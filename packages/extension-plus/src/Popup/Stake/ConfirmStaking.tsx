// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { StakingLedger } from '@polkadot/types/interfaces';

import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { Grid, Skeleton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { AccountContext } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Password, PlusHeader, Popup } from '../../components';
import broadcast from '../../util/api/broadcast';
import { bondOrBondExtra, chill, nominate, unbond } from '../../util/api/staking';
import { PASS_MAP, STATES_NEEDS_MESSAGE } from '../../util/constants';
import { AccountsBalanceType, ChainInfo, StakingConsts, TransactionDetail, ValidatorsName } from '../../util/plusTypes';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, isEqual, prepareMetaData } from '../../util/plusUtils';
import ValidatorsList from './ValidatorsList';
import { ContentCutOutlined } from '@mui/icons-material';

interface Props {
  chain?: Chain | null;
  chainInfo: ChainInfo;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectValidatorsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  handleEasyStakingModalClose?: () => void;
  stakingConsts: StakingConsts | null;
  amount: bigint;
  ledger: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  validatorsName: ValidatorsName[] | null;
  selectedValidators: DeriveStakingQuery[] | null;
  validatorsToList: DeriveStakingQuery[] | null;
}

export default function ConfirmStaking({ amount, chain, chainInfo, handleEasyStakingModalClose, ledger, nominatedValidators, selectedValidators, setConfirmStakingModalOpen, setSelectValidatorsModalOpen, setState, showConfirmStakingModal, staker, stakingConsts, state, validatorsName, validatorsToList }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [currentlyStaked, setCurrentlyStaked] = useState<bigint>(0n);
  const [totalStakedInHuman, setTotalStakedInHuman] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance>();
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean>(false);
  const [confirmButtonText, setConfirmButtonText] = useState<string>(t('Confirm'));
  const [note, setNote] = useState<string>();


  const nominatedValidatorsId = useMemo(() => nominatedValidators ? nominatedValidators.map((v) => String(v.accountId)) : [], [nominatedValidators]);
  const selectedValidatorsAccountId = useMemo(() => selectedValidators ? selectedValidators.map((v) => String(v.accountId)) : [], [selectedValidators]);

  /** list of available trasaction types */
  const chilled = chainInfo?.api.tx.staking.chill;
  const unbonded = chainInfo?.api.tx.staking.unbond;
  const nominated = chainInfo?.api.tx.staking.nominate;
  const bondExtra = chainInfo?.api.tx.staking.bondExtra;
  const bond = chainInfo?.api.tx.staking.bond;
  const redeem = chainInfo?.api.tx.staking.withdrawUnbonded;
  const bonding = currentlyStaked ? bondExtra : bond;

  async function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    /** check if re-nomination is needed */
    if (['stakeManual', 'changeValidators'].includes(state)) {
      if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
        if (state === 'changeValidators') setConfirmButtonDisabled(true);
        setNote(t('The selected and previously nominated validators are the same, no need to renominate'));
      } else {
        setConfirmButtonDisabled(false);
        setNote('');
      }
    }
  }, [selectedValidatorsAccountId, state, nominatedValidatorsId, t]);

  useEffect(() => {
    if (['confirming', 'success', 'failed'].includes(confirmingState) || !chainInfo) {
      return;
    }

    // defaults for many states
    setTotalStakedInHuman(amountToHuman((currentlyStaked).toString(), chainInfo?.decimals));

    console.log(`amount while ${state} is  ${amount}`)

    /** set fees and stakeAmount */
    let params;

    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
        params = currentlyStaked ? [amount] : [staker.address, amount, 'Staked'];

        // eslint-disable-next-line no-void
        void bonding(...params).paymentInfo(staker.address).then((i) => {
          const bondingFee = i?.partialFee;

          if (!isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            params = [selectedValidatorsAccountId];

            // eslint-disable-next-line no-void
            void nominated(...params).paymentInfo(staker.address).then((i) => {
              const nominatingFee = i?.partialFee;

              setEstimatedFee((bondingFee.add(nominatingFee) as Balance));
            });
          } else {
            setEstimatedFee(bondingFee);
          }
        }
        );

        setTotalStakedInHuman(amountToHuman((currentlyStaked + amount).toString(), chainInfo?.decimals));
        break;
      case ('stakeKeepNominated'):
        params = [amount];

        // eslint-disable-next-line no-void
        void bondExtra(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        setTotalStakedInHuman(amountToHuman((currentlyStaked + amount).toString(), chainInfo?.decimals));
        break;
      case ('unstake'):
        params = [amount];

        // eslint-disable-next-line no-void
        void unbonded(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        setTotalStakedInHuman(amountToHuman((currentlyStaked - amount).toString(), chainInfo?.decimals));
        break;
      case ('stopNominating'):
        // eslint-disable-next-line no-void
        void chilled().paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        // setTotalStakedInHuman(amountToHuman((currentlyStaked).toString(), chainInfo?.decimals));
        break;
      case ('changeValidators'):
        params = [selectedValidatorsAccountId];

        // eslint-disable-next-line no-void
        void nominated(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawUnbound'):
        params = [100];

        // eslint-disable-next-line no-void
        void redeem(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        // setTotalStakedInHuman(amountToHuman((currentlyStaked).toString(), chainInfo?.decimals));
        break;
      default:
      // setTotalStakedInHuman(amountToHuman((currentlyStaked).toString(), chainInfo?.decimals));
      // break;
    }
  }, [amount, currentlyStaked, chainInfo, state, confirmingState, staker.address, bonding, bondExtra, unbonded, chilled, selectedValidatorsAccountId, nominatedValidatorsId, nominated, redeem]);

  useEffect(() => {
    if (!estimatedFee || estimatedFee?.isEmpty) { return; }

    let reduction = amount;

    if (state === 'withdrawUnbound') { reduction = 0n; }

    const fee = BigInt(estimatedFee.toString());

    if (staker.balanceInfo?.available - (reduction + fee) <= stakingConsts.existentialDeposit) {
      setConfirmButtonDisabled(true);
      setConfirmButtonText(t('Account reap issue, consider fee!'));
    }
  }, [amount, estimatedFee, staker.balanceInfo?.available, stakingConsts.existentialDeposit, state, t]);

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
        return 'STAKING OF';
      case ('changeValidators'):
        return 'NOMINATING';
      case ('unstake'):
        return 'UNSTAKING';
      case ('withdrawUnbound'):
        return 'REDEEM';
      case ('stopNominating'):
        return 'STOP NOMINATING';
      default:
        return state.toUpperCase();
    }
  };

  const handleConfirm = async (): Promise<void> => {
    const localState = state;

    try {
      setConfirmingState('confirming');
      // const { api } = await getChainInfo(chain);

      const signer = keyring.getPair(staker.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const alreadyBondedAmount = BigInt(String(ledger?.total));

      if (['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(localState) && amount !== 0n) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        const { block, failureText, fee, status, txHash } = await bondOrBondExtra(chain, staker.address, signer, amount, alreadyBondedAmount);

        console.log('bond Result,', status);

        const history: TransactionDetail = {
          action: alreadyBondedAmount ? 'bond_extra' : 'bond',
          amount: amountToHuman(String(amount), chainInfo?.decimals),
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
          await saveHistory(chain, hierarchy, staker.address, history);
        }

        if (status === 'failed' || localState === 'stakeKeepNominated') {
          setConfirmingState(status);

          return;
        }
      }

      if (['changeValidators', 'stakeAuto', 'stakeManual'].includes(localState)) {

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

          // if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
          //   console.log('the selected and previously nominated validators are the same, no need to renominate');

          //   setConfirmingState('failed');

          //   return;
          // }
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
          // if unstaking all, should chill first
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
          amount: amountToHuman(String(amount), chainInfo?.decimals),
          block: block,
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

        console.log('unbond:', status);
        setConfirmingState(status);
      }

      if (localState === 'withdrawUnbound' && amount > 0n) {
        const optSpans = await chainInfo?.api.query.staking.slashingSpans(staker.address);
        const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1;

        const { block, failureText, fee, status, txHash } = await broadcast(chainInfo.api, redeem, [spanCount || 0], signer);

        // const { block, failureText, fee, status, txHash } = await withdrawUnbonded(chain, staker.address, signer);

        const history: TransactionDetail = {
          action: 'redeem',
          amount: amountToHuman(String(amount), chainInfo?.decimals),
          block: block,
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

        console.log('withdrawUnbound:', status);
        setConfirmingState(status);
      }

      if (localState === 'stopNominating') {

        const { block, failureText, fee, status, txHash } = await broadcast(chainInfo.api, chilled, [], signer);

        const history: TransactionDetail = {
          action: 'stop_nominating',
          block: block,
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
    if (handleEasyStakingModalClose) handleEasyStakingModalClose();
  }, [handleCloseModal, handleEasyStakingModalClose, setSelectValidatorsModalOpen, setState]);

  const writeAppropiateMessage = useCallback((state: string, note: string): React.ReactNode => {
    switch (state) {
      case ('unstake'):
        return <Typography variant='h6'>
          {t('Note: The unstaked amount will be redeemable after {{days}} days ', { replace: { days: stakingConsts.bondingDuration } })}
        </Typography>;
      case ('withdrawUnbound'):
        return <Typography sx={{ m: '5px 0px 5px' }} variant='h6'>
          {t('Available balance after redeem ')}<br />
          {estimatedFee ? amountToHuman(String(BigInt(amount + staker.balanceInfo.available) - estimatedFee.toBigInt()), chainInfo?.decimals) : ''}{' '} {chainInfo?.coin}
        </Typography>;
      case ('stopNominating'):
        return <Typography sx={{ m: '30px 0px 30px' }} variant='h6'>
          {t('Declaring no desire to nominate validators')}
        </Typography>;
      default:
        return <Typography sx={{ m: '30px 0px 30px' }} variant='h6'>
          {note}
        </Typography>;
    }
  }, [amount, chainInfo?.coin, chainInfo?.decimals, estimatedFee, staker.balanceInfo.available, stakingConsts.bondingDuration, t]);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmStakingModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm'} />

      <Grid alignItems='center' container>
        <Grid container item sx={{ backgroundColor: '#f7f7f7', p: '25px 40px 10px' }} xs={12}>

          <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, justifyContent: 'flex-start', p: '5px 10px 5px', textAlign: 'center', fontVariant: 'small-caps' }}>
            {stateInHuman(confirmingState || state)}
          </Grid>

          {!!amount &&
            <Grid container item justifyContent='center' spacing={1} sx={{ fontFamily: 'fantasy', fontSize: 18, textAlign: 'center' }} xs={12}>
              <Grid item>
                {amountToHuman(amount.toString(), chainInfo?.decimals)}
              </Grid>
              <Grid item>
                {chainInfo?.coin}
              </Grid>
            </Grid>
          }

          <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12, paddingTop: '30px' }} xs={12} >
            <Grid container item justifyContent='flex-start' spacing={1} xs={5}>
              <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                {t('Currently staked')}{': '}
              </Grid>
              <Grid item sx={{ fontSize: 12 }}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {currentlyStaked ? amountToHuman(currentlyStaked.toString(), chainInfo?.decimals) : '0.00'}
                  </>
                }
                {/* {' '}{chainInfo?.coin} */}
              </Grid>
            </Grid>

            <Grid container item justifyContent='center' spacing={1} xs={2}>
              <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                {t('Fee')}{': '}
              </Grid>
              <Grid item sx={{ fontSize: 12 }}>
                {!estimatedFee
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                  : <>
                    {amountToHuman(estimatedFee.toString(), chainInfo?.decimals)}
                  </>
                }
              </Grid>
            </Grid>

            <Grid container item justifyContent='flex-end' spacing={1} xs={5}>
              <Grid item sx={{ fontSize: 12, fontWeight: '600' }}>
                {t('Total staked')}{': '}
              </Grid>
              <Grid item sx={{ fontSize: 12 }}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {totalStakedInHuman}
                  </>
                }
                {/* {' '}{chainInfo?.coin} */}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {stakingConsts && !(STATES_NEEDS_MESSAGE.includes(state) || note)
          ? <>
            <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '15px 50px 5px' }} xs={12}>
              {t('VALIDATORS')}
            </Grid>
            <Grid item sx={{ fontSize: 14, p: '1px 20px 0px' }} xs={12}>

              <ValidatorsList
                chain={chain}
                stakingConsts={stakingConsts}
                validatorsInfo={validatorsToList}
                validatorsName={validatorsName} />

            </Grid>
          </>
          : <Grid item xs={12} sx={{ m: '70px 40px 70px', textAlign: 'center' }}>
            {writeAppropiateMessage(state, note)}
          </Grid>
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
          isDisabled={!ledger || confirmButtonDisabled}
          state={confirmingState}
          text={confirmButtonText}
        />
      </Grid>
    </Popup>
  );
}
