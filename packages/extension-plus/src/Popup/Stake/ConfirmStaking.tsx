// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { StakingLedger } from '@polkadot/types/interfaces';

import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { Grid, Skeleton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';

import { AccountContext } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Password, PlusHeader, Popup } from '../../components';
import { PASS_MAP } from '../../util/constants';
import getChainInfo from '../../util/getChainInfo';
import { AccountsBalanceType, StakingConsts, TransactionDetail, Validators, ValidatorsName } from '../../util/plusTypes';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';
import { bondOrBondExtra, chill, nominate, unbond, withdrawUnbonded } from '../../util/staking';
import ValidatorsList from './ValidatorsList';

interface Props {
  chain?: Chain | null;
  decimals: number;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectValidatorsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts | null;
  amount: bigint;
  validatorsInfo?: Validators | null;
  ledger: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  coin: string;
  validatorsName: ValidatorsName[] | null;
  selectedValidators: DeriveStakingQuery[] | null;
  validatorsToList: DeriveStakingQuery[] | null;
}

export default function ConfirmStaking({ amount, chain, coin, decimals, ledger, nominatedValidators, selectedValidators, setConfirmStakingModalOpen, setSelectValidatorsModalOpen, setState, showConfirmStakingModal, staker, stakingConsts, state, validatorsName, validatorsToList }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [currentlyStaked, setCurrentlyStaked] = useState<bigint>(0n);
  const [totalStakedInHuman, setTotalStakedInHuman] = useState<string>('');

  async function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    console.log('amount is :', amount);
    console.log('state is :', state);

    if (['confirming', 'success', 'failed'].includes(confirmingState)) {
      return;
    }

    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        setTotalStakedInHuman(amountToHuman((currentlyStaked + amount).toString(), decimals));
        break;
      case ('unstake'):
        setTotalStakedInHuman(amountToHuman((currentlyStaked - amount).toString(), decimals));
        break;
      default:
        setTotalStakedInHuman(amountToHuman((currentlyStaked).toString(), decimals));
        break;
    }
  }, [amount, currentlyStaked, decimals, state]);

  useEffect(() => {
    if (!ledger) { return; }

    setCurrentlyStaked(BigInt(String(ledger.active)));
  }, [ledger]);

  const handleClearPassword = useCallback((): void => {
    setPasswordStatus(PASS_MAP.EMPTY);
    setPassword('');
  }, []);

  const handleSavePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  }, [handleClearPassword]);

  const handleCloseModal = useCallback((): void => {
    setConfirmStakingModalOpen(false);
  }, [setConfirmStakingModalOpen]);

  const handleBack = useCallback((): void => {
    if (!['stakeManual', 'changeValidators'].includes(state)) {
      setState('');
      setConfirmingState('');
    }

    handleCloseModal();
  }, [handleCloseModal, setState, state]);

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        return 'Staking of'.toUpperCase();
      case ('changeValidators'):
        return 'nominating'.toUpperCase();
      case ('unstake'):
        return 'unstaking'.toUpperCase();
      case ('withdrawUnbound'):
        return 'redeem'.toUpperCase();
      default:
        return state.toUpperCase();
    }
  };

  const isEqual = (a1: string[] | null, a2: string[] | null): boolean => {
    if (!a1 && !a2) {
      return true;
    }

    if (!(a1 || a2)) {
      return false;
    }

    const a1Sorted = a1?.slice().sort();
    const a2Sorted = a2?.slice().sort();

    return JSON.stringify(a1Sorted) === JSON.stringify(a2Sorted);
  };

  const handleConfirm = async (): Promise<void> => {
    const localState = state;

    try {
      setConfirmingState('confirming');

      const signer = keyring.getPair(String(staker.address));

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const alreadyBondedAmount = BigInt(String(ledger?.total));

      if (['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(localState) && amount !== 0n) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        const { block, failureText, fee, status, txHash } = await bondOrBondExtra(chain, staker.address, signer, amount, alreadyBondedAmount);

        console.log('bond Result,', status);

        const history: TransactionDetail = {
          action: alreadyBondedAmount ? 'bond_extra' : 'bond',
          amount: amountToHuman(String(amount), decimals),
          date: Date.now(),
          block: block,
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        if (status === 'failed' || localState === 'stakeKeepNominated') {
          setConfirmingState(status);

          return;
        }
      }

      if (['changeValidators', 'stakeAuto', 'stakeManual'].includes(localState)) {
        const nominatedValidatorsId = nominatedValidators ? nominatedValidators.map((v) => String(v.accountId)) : [];
        const selectedValidatorsAccountId = selectedValidators ? selectedValidators.map((v) => String(v.accountId)) : [];

        if (['stakeAuto'].includes(localState)) {
          if (!selectedValidators) {
            console.log('! there is no selectedValidators to bond at Stakeauto, so might do bondExtera');

            if (alreadyBondedAmount) {
              setConfirmingState('success');
            } else {
              setConfirmingState('failed');
            }

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('the selected and previously nominated validators are the same, no need to renominate');

            setConfirmingState('success');

            return;
          }
        }

        if (['stakeManual'].includes(localState)) { // TODO: more check!!
          if (!selectedValidatorsAccountId) {
            console.log('selectedValidatorsAccountId is empty!!');
            setConfirmingState('failed');

            return;
          }
        }

        if (['changeValidators'].includes(localState)) {
          if (!selectedValidatorsAccountId) {
            console.log('! there is no selectedValidatorsAccountId to changeValidators');
            setConfirmingState('failed');

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('the selected and previously nominated validators are the same, no need to renominate');

            setConfirmingState('failed');

            return;
          }
        }

        const { block, failureText, fee, status, txHash } = await nominate(chain, staker.address, signer, selectedValidatorsAccountId);

        const history: TransactionDetail = {
          action: 'nominate',
          amount: '',
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        console.log('nominateResult,', status);
        setConfirmingState(status);
      }

      if (localState === 'unstake' && amount > 0n) {
        if (amount === currentlyStaked) {
          // if you are unstaking all, should chill first
          const { failureText, fee, status, txHash } = await chill(chain, staker.address, signer);

          const history: TransactionDetail = {
            action: 'chill',
            amount: '',
            date: Date.now(),
            fee: fee || '',
            from: staker.address,
            hash: txHash || '',
            status: failureText || status,
            to: ''
          };

          if (chain) {
            // eslint-disable-next-line no-void
            void saveHistory(chain, hierarchy, staker.address, history);
          }

          if (state === 'failed') {
            console.log('chilling failed:', failureText);
            setConfirmingState(status);

            return;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        const { block, failureText, fee, status, txHash } = await unbond(chain, staker.address, signer, amount);

        const history: TransactionDetail = {
          action: 'unbond',
          amount: amountToHuman(String(amount), decimals),
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        console.log('unbond:', status);
        setConfirmingState(status);
      }

      if (localState === 'withdrawUnbound' && amount > 0n) {
        const { block, failureText, fee, status, txHash } = await withdrawUnbonded(chain, staker.address, signer);

        const history: TransactionDetail = {
          action: 'redeem',
          amount: amountToHuman(String(amount), decimals),
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        };

        if (chain) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          saveHistory(chain, hierarchy, staker.address, history);
        }

        console.log('withdrawUnbound:', status);
        setConfirmingState(status);
      }
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState(localState);
      setConfirmingState('');
    }
  };

  const handleReject = useCallback((): void => {
    setState('');
    setConfirmingState('');
    if (setSelectValidatorsModalOpen) setSelectValidatorsModalOpen(false);

    handleCloseModal();
    // setReject(true);
  }, []);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmStakingModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm'} />

      <Grid alignItems='center' container>
        <Grid item container xs={12} sx={{ backgroundColor: '#f7f7f7', padding: '25px 40px 10px' }}>
          <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, justifyContent: 'flex-start', padding: '5px 10px 5px', textAlign: 'center', fontVariant: 'small-caps' }}>
            {stateInHuman(confirmingState || state)}
          </Grid>
          {amount
            ? <Grid item container justifyContent='center' spacing={1} xs={12} sx={{ fontFamily: 'fantasy', fontSize: 18, textAlign: 'center' }}>
              <Grid item>
                {amountToHuman(amount.toString(), decimals)}
              </Grid>
              <Grid item>
                {coin}
              </Grid>
            </Grid>
            : ''}

          <Grid item xs={12} container justifyContent='space-between' alignItems='center' sx={{ fontSize: 12, paddingTop: '30px' }} >
            <Grid item container xs={5} justifyContent='flex-start' spacing={1}>
              <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                {t('Currently staked')}{': '}
              </Grid>
              <Grid item sx={{ fontSize: 12 }}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {currentlyStaked ? amountToHuman(currentlyStaked.toString(), decimals) : '0.00'}
                  </>
                }{coin}
              </Grid>
            </Grid>
            <Grid container item justifyContent='flex-end' spacing={1} xs={5}>
              <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                {t('Total')}{': '}
              </Grid>
              <Grid item sx={{ fontSize: 12 }}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {totalStakedInHuman}
                  </>
                }{coin}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {stakingConsts && !['withdrawUnbound', 'unstake'].includes(state)
          ? <>
            <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 16, padding: '15px 50px 5px' }} xs={12}>
              {t('VALIDATORS')}
            </Grid>
            <Grid item sx={{ fontSize: 14, padding: '1px 20px 0px' }} xs={12}>

              <ValidatorsList
                chain={chain}
                stakingConsts={stakingConsts}
                validatorsInfo={validatorsToList}
                validatorsName={validatorsName} />

            </Grid>
          </>
          : <Grid sx={{ margin: '70px 40px 70px' }}>
            {['unstake'].includes(state) &&
              <Typography variant='h6' sx={{ textAlign: 'center' }}>
                {t('Note: The unstaked amount will be redeemable after {{days}} days ', { replace: { days: stakingConsts.bondingDuration } })}
              </Typography>
            }</Grid>
        }
      </Grid>

      <Grid container item sx={{ p: '20px 20px' }} xs={12}>
        <Password
          autofocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
          handleClearPassword={handleClearPassword}
          handleIt={handleConfirm}
          handleSavePassword={handleSavePassword}
          isDisabled={!ledger}
          password={password}
          passwordStatus={passwordStatus}
        />

        <ConfirmButton
          handleBack={handleBack}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
          isDisabled={!ledger}
          state={confirmingState}
        />
      </Grid>
    </Popup>

  );
}
