// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here users confirm their staking related orders (e.g., stake, unstake, redeem, etc.)
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BuildCircleRounded as BuildCircleRoundedIcon, ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Avatar, Grid, IconButton, Link, Skeleton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { AccountContext } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Hint, Password, PlusHeader, Popup, ShortAddress } from '../../../components';
import { ChooseProxy } from '../../../partials';
import broadcast from '../../../util/api/broadcast';
import { bondOrBondExtra } from '../../../util/api/staking';
import { PASS_MAP, STATES_NEEDS_MESSAGE } from '../../../util/constants';
import getLogo from '../../../util/getLogo';
import { AccountsBalanceType, Proxy, PutInFrontInfo, RebagInfo, StakingConsts, TransactionDetail } from '../../../util/plusTypes';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, isEqual, prepareMetaData } from '../../../util/plusUtils';
import ValidatorsList from '../common/ValidatorsList';

interface Props {
  chain: Chain;
  api: ApiPromise;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectValidatorsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  handleSoloStakingModalClose?: () => void;
  stakingConsts: StakingConsts | undefined;
  amount: bigint;
  ledger: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  selectedValidators: DeriveStakingQuery[] | null;
  putInFrontInfo?: PutInFrontInfo | undefined;
  rebagInfo?: RebagInfo | undefined;
}

export default function ConfirmStaking({ amount, api, chain, handleSoloStakingModalClose, ledger, nominatedValidators, putInFrontInfo, rebagInfo, selectedValidators, setConfirmStakingModalOpen, setSelectValidatorsModalOpen, setState, showConfirmStakingModal, staker, stakingConsts, state, validatorsIdentities }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const { hierarchy } = useContext(AccountContext);
  const [confirmingState, setConfirmingState] = useState<string | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [currentlyStaked, setCurrentlyStaked] = useState<bigint | undefined>(undefined);
  const [totalStakedInHuman, setTotalStakedInHuman] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean>(false);
  const [confirmButtonText, setConfirmButtonText] = useState<string>(t('Confirm'));
  const [amountNeedsAdjust, setAmountNeedsAdjust] = useState<boolean>(false);
  const [surAmount, setSurAmount] = useState<bigint>(amount); /** SUR: Staking Unstaking Redeem amount */
  const [note, setNote] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<bigint>(0n);
  const [proxy, setProxy] = useState<Proxy | undefined>();
  const [selectProxyModalOpen, setSelectProxyModalOpen] = useState<boolean>(false);

  const chainName = chain?.name.replace(' Relay Chain', '');
  const decimals = api.registry.chainDecimals[0];
  const token = api.registry.chainTokens[0];

  const nominatedValidatorsId = useMemo(() => nominatedValidators ? nominatedValidators.map((v) => String(v.accountId)) : [], [nominatedValidators]);
  const selectedValidatorsAccountId = useMemo(() => selectedValidators ? selectedValidators.map((v) => String(v.accountId)) : [], [selectedValidators]);
  const validatorsToList = ['stakeAuto', 'stakeManual', 'changeValidators', 'setNominees'].includes(state) ? selectedValidators : nominatedValidators;

  /** list of available trasaction types */
  const renameConsistentApi = api.tx?.bagsList || api.tx?.voterList;

  const chilled = api.tx.staking.chill;
  const unbonded = api.tx.staking.unbond;
  const nominated = api.tx.staking.nominate;
  const bondExtra = api.tx.staking.bondExtra;
  const bond = api.tx.staking.bond;
  const redeem = api.tx.staking.withdrawUnbonded;
  const bonding = currentlyStaked ? bondExtra : bond;
  const rebaged = renameConsistentApi.rebag;
  const putInFrontOf = renameConsistentApi.putInFrontOf;

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, history: TransactionDetail[]): Promise<boolean> {
    if (!history.length) {
      return false;
    }

    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(...history);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    setConfirmButtonDisabled(!stakingConsts || !ledger || !estimatedFee || !availableBalance);
  }, [stakingConsts, ledger, estimatedFee, availableBalance]);

  useEffect(() => {
    if (staker?.balanceInfo?.available) {
      setAvailableBalance(staker.balanceInfo.available);
    }
  }, [staker?.balanceInfo?.available]);

  useEffect(() => {
    if (confirmingState) {
      // do not run following code while are in these states
      return;
    }

    /** check if re-nomination is needed */
    if (['stakeManual', 'changeValidators'].includes(state)) {
      if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
        if (state === 'changeValidators') {
          setConfirmButtonDisabled(true);
        }

        setNote(t('The selected and previously nominated validators are the same, no need to renominate'));
      }
      // else {
      //   setConfirmButtonDisabled(false);
      //   setNote('');
      // }
    }
  }, [selectedValidatorsAccountId, state, nominatedValidatorsId, t, confirmingState]);

  const setFee = useCallback(() => {
    let params;

    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
        params = currentlyStaked ? [surAmount] : [staker.address, surAmount, 'Staked'];

        // eslint-disable-next-line no-void
        void bonding(...params).paymentInfo(staker.address).then((i) => {
          const bondingFee = i?.partialFee;

          if (!isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            params = [selectedValidatorsAccountId];

            // eslint-disable-next-line no-void
            void nominated(...params).paymentInfo(staker.address).then((i) => {
              const nominatingFee = i?.partialFee;

              setEstimatedFee(api.createType('Balance', bondingFee.add(nominatingFee)));
            });
          } else {
            setEstimatedFee(bondingFee);
          }
        }
        );

        break;
      case ('stakeKeepNominated'):
        params = [surAmount];

        // eslint-disable-next-line no-void
        void bondExtra(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('unstake'):
        params = [surAmount];

        // eslint-disable-next-line no-void
        void unbonded(...params).paymentInfo(staker.address).then((i) => {
          const fee = i?.partialFee;

          if (surAmount === currentlyStaked) {
            // eslint-disable-next-line no-void
            void chilled().paymentInfo(staker.address).then((j) => setEstimatedFee(api.createType('Balance', fee.add(j?.partialFee))));
          } else {
            setEstimatedFee(fee);
          }
        });
        break;
      case ('stopNominating'):
        // eslint-disable-next-line no-void
        void chilled().paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('changeValidators'):
      case ('setNominees'):
        params = [selectedValidatorsAccountId];

        // eslint-disable-next-line no-void
        void nominated(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawUnbound'):
        params = [100]; /** a dummy number */

        // eslint-disable-next-line no-void
        void redeem(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('tuneUp'):
        if (rebagInfo?.shouldRebag) {
          params = [staker.address];
          // eslint-disable-next-line no-void
          void rebaged(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        } else if (putInFrontInfo?.shouldPutInFront) {
          params = [putInFrontInfo?.lighter];
          // eslint-disable-next-line no-void
          void putInFrontOf(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        }

        break;
      default:
    }
  }, [surAmount, currentlyStaked, api, state, staker.address, bonding, bondExtra, unbonded, chilled, selectedValidatorsAccountId, nominatedValidatorsId, nominated, redeem, rebagInfo, putInFrontInfo?.shouldPutInFront, putInFrontInfo?.lighter, rebaged, putInFrontOf]);

  const setTotalStakedInHumanBasedOnStates = useCallback(() => {
    const lastStaked = currentlyStaked ?? 0n;

    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        setTotalStakedInHuman(amountToHuman((lastStaked + surAmount).toString(), decimals));
        break;
      case ('unstake'):
        setTotalStakedInHuman(amountToHuman((lastStaked - surAmount).toString(), decimals));
        break;

      default:
        setTotalStakedInHuman(amountToHuman(String(lastStaked), decimals)); // as default for states like setNominees
    }
  }, [surAmount, currentlyStaked, state, decimals]);

  useEffect(() => {
    if (confirmingState || !api) {
      return;
    }

    /** set fees and totalStakeAmount */
    !estimatedFee && setFee();
    setTotalStakedInHumanBasedOnStates();
  }, [api, confirmingState, decimals, estimatedFee, setFee, setTotalStakedInHumanBasedOnStates]);

  useEffect(() => {
    if (!estimatedFee || estimatedFee?.isEmpty || !availableBalance || !stakingConsts?.existentialDeposit || confirmingState) {
      return;
    }

    let partialSubtrahend = BigInt(surAmount);

    if (['withdrawUnbound', 'unstake'].includes(state)) {
      partialSubtrahend = 0n;
    }

    const fee = BigInt(estimatedFee.toString());

    if (BigInt(availableBalance) - (partialSubtrahend + fee) < stakingConsts?.existentialDeposit) {
      setConfirmButtonDisabled(true);
      setConfirmButtonText(t('Account reap issue, consider fee!'));

      if (['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(state)) {
        setAmountNeedsAdjust(true);
      }
    } else {
      // setConfirmButtonDisabled(false);
      setConfirmButtonText(t('Confirm'));
    }
  }, [surAmount, estimatedFee, availableBalance, stakingConsts?.existentialDeposit, state, t, confirmingState]);

  useEffect(() => {
    if (!ledger) {
      return;
    }

    setCurrentlyStaked(BigInt(String(ledger.active)));
  }, [ledger]);

  const handleCloseModal = useCallback((): void => {
    setConfirmStakingModalOpen(false);
  }, [setConfirmStakingModalOpen]);

  const handleBack = useCallback((): void => {
    if (!['stakeManual', 'changeValidators', 'setNominees'].includes(state)) {
      setState('');
      setConfirmingState(undefined);
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
      case ('setNominees'):
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

  const handleConfirm = useCallback(async (): Promise<void> => {
    const localState = state;
    const history: TransactionDetail[] = []; /** collect all records to save in the local history at the end */

    try {
      setConfirmingState('confirming');
      const signer = keyring.getPair(proxy?.delegate ?? staker.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const alreadyBondedAmount = BigInt(String(ledger?.total)); // TODO: double check it, it might be ledger?.active but works if unstacked in this era

      if (['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(localState) && surAmount !== 0n) {
        const { block, failureText, fee, status, txHash } = await bondOrBondExtra(api, staker.address, signer, surAmount, alreadyBondedAmount, proxy);

        history.push({
          action: alreadyBondedAmount ? 'bond_extra' : 'bond',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || String(estimatedFee) || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: staker.address
        });

        if (status === 'failed' || localState === 'stakeKeepNominated') {
          setConfirmingState(status);

          // eslint-disable-next-line no-void
          void saveHistory(chain, hierarchy, staker.address, history);

          return;
        }
      }

      if (['changeValidators', 'stakeAuto', 'stakeManual', 'setNominees'].includes(localState)) {
        if (localState === 'stakeAuto') {
          if (!selectedValidators) { // TODO: does it realy happen!
            console.log('! there is no selectedValidators to bond at StakeAuto, so might do bondExtera');

            if (alreadyBondedAmount) {
              setConfirmingState('success');
            } else {
              setConfirmingState('failed');
            }

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('selected and previously nominated validators are the same, no need to renominate');

            setConfirmingState('success');

            return;
          }
        }

        const { block, failureText, fee, status, txHash } = await broadcast(api, nominated, [selectedValidatorsAccountId], signer, staker.address, proxy);

        history.push({
          action: 'nominate',
          amount: '',
          block,
          date: Date.now(),
          fee: fee || String(estimatedFee) || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'unstake' && surAmount > 0n) {
        if (surAmount === currentlyStaked) {
          /**  if unstaking all, should chill first */
          const { failureText, fee, status, txHash } = await broadcast(api, chilled, [], signer, staker.address, proxy);

          history.push({
            action: 'chill',
            amount: '',
            date: Date.now(),
            fee: fee || String(estimatedFee) || '',
            from: staker.address,
            hash: txHash || '',
            status: failureText || status,
            to: ''
          });

          if (state === 'failed') {
            console.log('chilling failed:', failureText);
            setConfirmingState(status);

            // eslint-disable-next-line no-void
            void saveHistory(chain, hierarchy, staker.address, history);

            return;
          }
        }

        const { block, failureText, fee, status, txHash } = await broadcast(api, unbonded, [surAmount], signer, staker.address, proxy);

        history.push({
          action: 'unbond',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || String(estimatedFee) || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        console.log('unbond:', status);
        setConfirmingState(status);
      }

      if (localState === 'withdrawUnbound' && surAmount > 0n) {
        const optSpans = await api.query.staking.slashingSpans(staker.address);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1;

        const { block, failureText, fee, status, txHash } = await broadcast(api, redeem, [spanCount || 0], signer, staker.address, proxy);

        history.push({
          action: 'redeem',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || String(estimatedFee) || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        console.log('withdrawUnbound:', status);
        setConfirmingState(status);
      }

      if (localState === 'stopNominating') {
        const { block, failureText, fee, status, txHash } = await broadcast(api, chilled, [], signer, staker.address, proxy);

        history.push({
          action: 'stop_nominating',
          block,
          date: Date.now(),
          fee: fee || String(estimatedFee) || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'tuneUp') {
        const tx = rebagInfo?.shouldRebag ? rebaged : putInFrontOf;
        const params = rebagInfo?.shouldRebag ? staker.address : putInFrontInfo?.lighter;
        const { block, failureText, fee, status, txHash } = await broadcast(api, tx, [params], signer, staker.address, proxy);

        history.push({
          action: 'tuneUp',
          block,
          date: Date.now(),
          fee: fee || String(estimatedFee) || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, staker.address, history);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState(localState);
      setConfirmingState(undefined);
    }
  }, [api, chain, chilled, currentlyStaked, decimals, estimatedFee, hierarchy, ledger?.total, nominated, nominatedValidatorsId, password, proxy, putInFrontInfo?.lighter, putInFrontOf, rebagInfo?.shouldRebag, rebaged, redeem, selectedValidators, selectedValidatorsAccountId, setState, staker.address, state, surAmount, unbonded]);

  const handleReject = useCallback((): void => {
    setState('');
    setConfirmingState(undefined);

    if (setSelectValidatorsModalOpen) {
      setSelectValidatorsModalOpen(false);
    }

    handleCloseModal();

    if (handleSoloStakingModalClose) {
      handleSoloStakingModalClose();
    }
  }, [handleCloseModal, handleSoloStakingModalClose, setSelectValidatorsModalOpen, setState]);

  const handleChooseProxy = useCallback((): void => {
    setSelectProxyModalOpen(true);
  }, []);

  const writeAppropiateMessage = useCallback((state: string, note: string): React.ReactNode => {
    switch (state) {
      case ('unstake'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Note: The unstaked amount will be redeemable after {{days}} days ', { replace: { days: stakingConsts?.unbondingDuration } })}
        </Typography>;
      case ('withdrawUnbound'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Available balance after redeem will be')}<br />
          {estimatedFee
            ? amountToHuman(String(BigInt(surAmount + availableBalance) - BigInt(String(estimatedFee))), decimals)
            : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
          }
          {' '} {token}
        </Typography>;
      case ('stopNominating'):
        return <Typography sx={{ mt: '30px' }} variant='h6'>
          {t('Declaring no desire to nominate validators')}
        </Typography>;
      case ('tuneUp'):
        return <>
          {rebagInfo?.shouldRebag &&
            <Grid item sx={{ fontSize: 14, fontWeight: 600, mt: '45px' }} xs={12}>
              {t('Declaring that your account has sufficiently changed its score that should fall into a different bag.')}
            </Grid>
          }
          {!rebagInfo?.shouldRebag && putInFrontInfo?.shouldPutInFront &&
            <Grid item sx={{ fontSize: 14, fontWeight: 600, mt: '45px' }} xs={12}>
              {t('Changing your accout\'s position to a better one')}
            </Grid>
          }
          <Grid container item justifyContent='space-between' sx={{ fontSize: 11, p: '15px 30px' }} xs={12}>
            <Grid item>
              {t('Current bag threshold')}
            </Grid>
            <Grid item>
              {rebagInfo?.currentBagThreshold}
            </Grid>
          </Grid>
          {rebagInfo?.shouldRebag &&
            <Grid item sx={{ fontSize: 11, pt: '10px' }} xs={12}>
              {t('You will probably need another tune up after this one!')}
            </Grid>
          }
          {!rebagInfo?.shouldRebag && putInFrontInfo?.shouldPutInFront &&
            <Grid container item justifyContent='space-between' sx={{ fontSize: 11, p: '5px 30px' }} xs={12}>
              <Grid item>
                {t('Account to overtake')}
              </Grid>
              <Grid container item justifyContent='flex-end' spacing={0.5} xs={5}>
                <Grid item>
                  <Link href={`https://${chainName}.subscan.io/account/${putInFrontInfo?.lighter ?? ''}?tab=reward`} rel='noreferrer' target='_blank' underline='none'>
                    <Avatar alt={'subscan'} src={getLogo('subscan')} sx={{ height: 11, width: 11 }} />
                  </Link>
                </Grid>
                <Grid item>
                  <ShortAddress address={putInFrontInfo?.lighter ?? ''} fontSize={11} />
                </Grid>
              </Grid>
            </Grid>
          }
        </>;
      default:
        return <Typography sx={{ m: '30px 0px 30px' }} variant='h6'>
          {note}
        </Typography>;
    }
    // Note: availableBalance change should not change the alert in redeem confirm page!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surAmount, token, decimals, estimatedFee, stakingConsts?.unbondingDuration, t, rebagInfo]);

  const handleAutoAdjust = useCallback((): void => {
    const ED = stakingConsts?.existentialDeposit;

    if (!ED) {
      return;
    }

    const fee = BigInt(String(estimatedFee));
    const adjustedAmount = availableBalance - (ED + fee);

    setSurAmount(adjustedAmount);
    setAmountNeedsAdjust(false);
    setConfirmButtonDisabled(false);
  }, [estimatedFee, availableBalance, stakingConsts?.existentialDeposit]);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmStakingModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm'} />
      <Grid alignItems='center' container>
        <Grid container item sx={{ backgroundColor: '#f7f7f7', p: '20px 40px 10px' }} xs={12}>
          <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, fontVariant: 'small-caps', justifyContent: 'flex-start', p: '5px 10px', textAlign: 'center' }}>
            {stateInHuman(confirmingState || state)}
          </Grid>
          <Grid data-testid='amount' item sx={{ fontSize: 20, fontWeight: 600, height: '20px', textAlign: 'center' }} xs={12}>
            {!!surAmount && amountToHuman(surAmount.toString(), decimals) + ' ' + token}
          </Grid>
          <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 11, paddingTop: '15px', textAlign: 'center' }} xs={12}>
            <Grid container item justifyContent='flex-start' sx={{ textAlign: 'left' }} xs={4}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Currently staked')}
              </Grid>
              <Grid item xs={12}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {currentlyStaked ? amountToHuman(currentlyStaked.toString(), decimals) : '0.00'}
                  </>
                }{' '}{token}
              </Grid>
            </Grid>
            <Grid container item justifyContent='center' xs={4}>
              <Grid item sx={{ color: grey[500], fontWeight: '600' }} xs={12}>
                {t('Fee')}
              </Grid>
              <Grid item xs={12}>
                {!estimatedFee
                  ? <span><Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '30px' }} /></span>
                  : <>
                    {estimatedFee?.toHuman()}
                  </>
                }
              </Grid>
            </Grid>
            <Grid container item justifyContent='flex-end' sx={{ textAlign: 'right' }} xs={4}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Total staked')}
              </Grid>
              <Grid item xs={12}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {totalStakedInHuman !== '0' ? totalStakedInHuman : '0.00'}
                  </>
                }{' '}{token}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {stakingConsts && !(STATES_NEEDS_MESSAGE.includes(state) || note)
          ? <>
            <Grid item sx={{ color: grey[600], fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
              {t('VALIDATORS')}{` (${validatorsToList?.length ?? ''})`}
            </Grid>
            <Grid item sx={{ fontSize: 14, height: '185px', p: '0px 20px 0px' }} xs={12}>
              <ValidatorsList
                api={api}
                chain={chain}
                height={180}
                stakingConsts={stakingConsts}
                validatorsIdentities={validatorsIdentities}
                validatorsInfo={validatorsToList}
              />
            </Grid>
          </>
          : <Grid item sx={{ height: '115px', m: '50px 30px 50px', textAlign: 'center' }} xs={12}>
            {writeAppropiateMessage(state, note)}
          </Grid>
        }
      </Grid>
      <Grid container item sx={{ p: '30px 25px' }} xs={12}>
        <Grid container item spacing={0.5} xs={12}>
          <Grid item xs>
            <Password
              autofocus={!confirmingState}
              handleIt={handleConfirm}
              isDisabled={confirmButtonDisabled || !!confirmingState || (staker.isProxied && !proxy)}
              password={password}
              passwordStatus={passwordStatus}
              setPassword={setPassword}
              setPasswordStatus={setPasswordStatus}
            />
          </Grid>
          <ChooseProxy
            acceptableTypes={['Any', 'Staking', 'NonTransfer']}
            api={api}
            chain={chain}
            headerIcon={<FontAwesomeIcon icon={faCoins} size='sm' />}
            onClick={handleChooseProxy}
            proxy={proxy}
            realAddress={staker.address}
            selectProxyModalOpen={selectProxyModalOpen}
            setProxy={setProxy}
            setSelectProxyModalOpen={setSelectProxyModalOpen}
          />
        </Grid>
        <Grid alignItems='center' container item xs={12}>
          <Grid container item xs={amountNeedsAdjust ? 11 : 12}>
            <ConfirmButton
              handleBack={handleBack}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              isDisabled={confirmButtonDisabled || (staker.isProxied && !proxy)}
              state={confirmingState ?? ''}
              text={confirmButtonText}
            />
          </Grid>
          {amountNeedsAdjust &&
            <Grid item sx={{ textAlign: 'left' }} xs={1}>
              <Hint id='adjustAmount' place='left' tip={t('Auto adjust the staking amount')}>
                <IconButton aria-label='Adjust' color='warning' onClick={handleAutoAdjust} size='medium'>
                  <BuildCircleRoundedIcon sx={{ fontSize: 40 }} />
                </IconButton>
              </Hint>
            </Grid>
          }
        </Grid>
      </Grid>
    </Popup>
  );
}
