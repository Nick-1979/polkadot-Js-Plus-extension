// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here users confirm their staking related orders (e.g., stake, unstake, redeem, etc.)
 * */

import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { RecoveryConsts, Rescuer, TransactionDetail } from '../../util/plusTypes';

import { ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Divider, Grid, Skeleton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ZERO } from '@polkadot/util';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, FormatBalance, Identity, Password, PlusHeader, Popup, ShowBalance2, ShowValue } from '../../components';
import { broadcast, signAndSend } from '../../util/api';
import { PASS_MAP } from '../../util/constants';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';

interface WithdrawAmounts {
  totalWithdrawable: BN;
  available: BN;
  redeemable: BN;
  staked: BN;
  spanCount: number;
}
interface Props {
  api: ApiPromise;
  chain: Chain;
  showConfirmModal: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string | undefined>>
  account: DeriveAccountInfo;
  friends?: DeriveAccountInfo[];
  recoveryThreshold?: number;
  recoveryDelay?: number;
  recoveryConsts?: RecoveryConsts;
  lostAccount?: DeriveAccountInfo;
  rescuer?: Rescuer;
  withdrawAmounts?: WithdrawAmounts;
  otherPossibleRescuers?: Rescuer[] | undefined
}

export default function Confirm({ account, api, chain, friends, lostAccount, otherPossibleRescuers, recoveryConsts, recoveryDelay, recoveryThreshold, rescuer, setConfirmModalOpen, setState, showConfirmModal, state, withdrawAmounts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();

  const decimals = api.registry.chainDecimals[0];
  const friendIds = friends?.map((f) => f.accountId).sort(); // if not sorted, tx will retun an error!!

  const bondingDuration = api.consts.staking.bondingDuration.toNumber();
  const sessionsPerEra = api.consts.staking.sessionsPerEra.toNumber();
  const epochDuration = api.consts.babe.epochDuration.toNumber();
  const expectedBlockTime = api.consts.babe.expectedBlockTime.toNumber();
  const epochDurationInHours = epochDuration * expectedBlockTime / 3600000; // 1000miliSec * 60sec * 60min
  const unbondingDuration = bondingDuration * sessionsPerEra * epochDurationInHours / 24;

  /** list of available trasactions */
  const createRecovery = api.tx.recovery.createRecovery;// (friends: Vec<AccountId32>, threshold: u16, delay_period: u32)
  const removeRecovery = api.tx.recovery.removeRecovery;
  const initiateRecovery = api.tx.recovery.initiateRecovery; // (lostAccount)
  const closeRecovery = api.tx.recovery.closeRecovery; // (rescuer)
  const vouchRecovery = api.tx.recovery.vouchRecovery; // (lost, rescuer)
  const claimRecovery = api.tx.recovery.claimRecovery; // (lost)
  const transferAll = api.tx.balances.transferAll; // [rescuer.accountId, false]
  const asRecovered = api.tx.recovery.asRecovered;
  const unbonded = api.tx.staking.unbond;
  const redeem = api.tx.staking.withdrawUnbonded;
  const chill = api.tx.staking.chill;
  const batchAll = api.tx.utility.batchAll;

  const withdrawCalls = []; // put all withdraws as recoverd from the lost account inside

  if (['withdrawAsRecovered', 'withdrawWithClaim'].includes(state)) {
    rescuer?.accountId && rescuer?.option?.deposit && withdrawCalls.push(closeRecovery(rescuer.accountId));
    otherPossibleRescuers?.length && withdrawCalls.push(...otherPossibleRescuers.map((o) => closeRecovery(o.accountId)));
    recoveryThreshold && withdrawCalls.push(removeRecovery()); // to collect deposit
    withdrawAmounts?.staked && !withdrawAmounts.staked.isZero() && withdrawCalls.push(chill(), unbonded(withdrawAmounts.staked));
    withdrawAmounts?.redeemable && !withdrawAmounts.redeemable.isZero() && withdrawCalls.push(redeem(withdrawAmounts.spanCount));
    withdrawAmounts?.available && !withdrawAmounts.available.isZero() && rescuer?.accountId && withdrawCalls.push(transferAll(rescuer.accountId, false));// should be last call in the batch to collect redeemed amount
  }

  const batchWithdraw = rescuer?.accountId && batchAll(withdrawCalls);

  const confirmBtnDisabled = useMemo(() => {
    if (!estimatedFee) {
      return true;
    };
    // TODO: check available balance to see if transaction can be done
    // if(state==='initiateRecovery'){
    //   return estimatedFee.add(recoveryConsts.recoveryDeposit).gt(account.);
    // }

    return false;
  }, [estimatedFee]);

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, history: TransactionDetail[]): Promise<boolean> {
    if (!history.length) {
      return false;
    }

    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(...history);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  const callSetFee = useCallback(() => {
    let params;
    const recoveryDelayInBlocks = recoveryDelay ? Math.floor(recoveryDelay * 24 * 60 * 10) : undefined;

    switch (state) {
      case ('makeRecoverable'):
        params = [friendIds, recoveryThreshold, recoveryDelayInBlocks];

        // eslint-disable-next-line no-void
        account?.accountId && void createRecovery(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      case ('removeRecovery'):
        // eslint-disable-next-line no-void
        account?.accountId && void removeRecovery().paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      case ('initiateRecovery'):
        // eslint-disable-next-line no-void
        lostAccount?.accountId && account?.accountId && void initiateRecovery(lostAccount.accountId).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      case ('closeRecovery'):
        params = [rescuer.accountId];

        // eslint-disable-next-line no-void
        account?.accountId && void closeRecovery(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;

      case ('closeRecoveryAsRescuer'): {
        const call = closeRecovery(rescuer.accountId);

        params = [lostAccount.accountId, call];

        // eslint-disable-next-line no-void
        account?.accountId && void asRecovered(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      }

      case ('vouchRecovery'):
        params = [lostAccount.accountId, rescuer.accountId];

        // eslint-disable-next-line no-void
        account?.accountId && void vouchRecovery(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      // case ('claimRecovery'):
      //   params = [lostAccount.accountId];

      //   // eslint-disable-next-line no-void
      //   account?.accountId && void claimRecovery(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

      //   break;
      case ('withdrawWithClaim'):
        params = [lostAccount.accountId, batchWithdraw];

        // eslint-disable-next-line no-void
        account?.accountId && void batchAll([claimRecovery(lostAccount.accountId), asRecovered(...params)]).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawAsRecovered'):
        params = [lostAccount.accountId, batchWithdraw];

        // eslint-disable-next-line no-void
        account?.accountId && void asRecovered(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));
        break;
      default:
    }
  }, [batchAll, account?.accountId, batchWithdraw, claimRecovery, closeRecovery, asRecovered, createRecovery, friendIds, initiateRecovery, lostAccount?.accountId, recoveryDelay, recoveryThreshold, removeRecovery, rescuer?.accountId, state, vouchRecovery]);

  const deposit = useMemo((): BN => {
    if (['removeRecovery', 'makeRecoverable'].includes(state) && friendIds?.length && recoveryConsts) {
      return recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(friendIds.length));
    }

    if (state === 'initiateRecovery' && recoveryConsts) {
      return recoveryConsts.recoveryDeposit;
    }

    if (['closeRecovery', 'closeRecoveryAsRescuer'].includes(state)) {
      return rescuer?.option?.deposit ? new BN(rescuer?.option?.deposit) : BN_ZERO;
    }

    return BN_ZERO;
  }, [friendIds?.length, recoveryConsts, rescuer, state]);

  useEffect(() => {
    if (!api) {
      return;
    }

    !estimatedFee && callSetFee();
  }, [api, callSetFee, estimatedFee]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    const localState = state;
    const history: TransactionDetail[] = []; /** collects all records to save in the local history at the end */

    try {
      if (!account?.accountId) {
        return;
      }

      setConfirmingState('confirming');

      const signer = keyring.getPair(account.accountId);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      if (localState === 'makeRecoverable' && recoveryDelay !== undefined) {
        const recoveryDelayInBlocks = Math.floor(recoveryDelay * 24 * 60 * 10);

        const params = [friendIds, recoveryThreshold, recoveryDelayInBlocks];
        const { block, failureText, fee, status, txHash } = await broadcast(api, createRecovery, params, signer, account.accountId);

        history.push({
          action: 'make_recoverable',
          amount: '0',
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'removeRecovery') {
        const { block, failureText, fee, status, txHash } = await broadcast(api, removeRecovery, [], signer, account.accountId);

        history.push({
          action: 'remove_recovery',
          amount: '0',
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'initiateRecovery' && lostAccount?.accountId) {
        const params = [lostAccount.accountId];

        const { block, failureText, fee, status, txHash } = await broadcast(api, initiateRecovery, params, signer, account.accountId);

        history.push({
          action: 'initiate_recovery',
          amount: recoveryConsts ? amountToHuman(recoveryConsts.recoveryDeposit.toString(), decimals) : '0',
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: String(lostAccount.accountId)
        });

        setConfirmingState(status);
      }

      if (localState === 'closeRecovery' && rescuer?.accountId && rescuer?.option) {
        const params = [rescuer.accountId];
        const { block, failureText, fee, status, txHash } = await broadcast(api, closeRecovery, params, signer, account.accountId);

        history.push({
          action: 'close_recovery',
          amount: amountToHuman(String(rescuer.option.deposit), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(rescuer.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: String(account.accountId)
        });

        setConfirmingState(status);
      }

      if (localState === 'closeRecoveryAsRescuer' && rescuer?.accountId && lostAccount?.accountId && rescuer?.option) {
        const call = closeRecovery(rescuer.accountId);

        const params = [lostAccount.accountId, call];
        const { block, failureText, fee, status, txHash } = await broadcast(api, asRecovered, params, signer, account.accountId);

        history.push({
          action: 'close_recovery_a.r.',
          amount: amountToHuman(String(rescuer.option.deposit), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'withdrawAsRecovered' && lostAccount?.accountId && withdrawAmounts) {
        const params = [lostAccount.accountId, batchWithdraw];
        const { block, failureText, fee, status, txHash } = await broadcast(api, asRecovered, params, signer, account.accountId);

        history.push({
          action: 'withdraw_a.r.',
          amount: amountToHuman(String(withdrawAmounts.available.add(withdrawAmounts.redeemable).add(withdrawAmounts.staked)), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(lostAccount.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: String(account.accountId)
        });

        setConfirmingState(status);
      }

      if (localState === 'withdrawWithClaim' && lostAccount?.accountId && withdrawAmounts) {
        const params = [lostAccount.accountId, batchWithdraw];

        const withdrawWithClaimCall = batchAll([claimRecovery(lostAccount.accountId), asRecovered(...params)]);
        const { block, failureText, fee, status, txHash } = await signAndSend(api, withdrawWithClaimCall, signer, account.accountId);

        history.push({
          action: 'withdraw_w.c.',
          amount: amountToHuman(String(withdrawAmounts.available.add(withdrawAmounts.redeemable).add(withdrawAmounts.staked)), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(lostAccount.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: String(account.accountId)
        });

        setConfirmingState(status);
      }

      if (localState === 'vouchRecovery' && rescuer?.accountId && lostAccount?.accountId) {
        const params = [lostAccount.accountId, rescuer.accountId];
        const { block, failureText, fee, status, txHash } = await broadcast(api, vouchRecovery, params, signer, account.accountId);

        history.push({
          action: 'vouch_recovery',
          amount: '0',
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: String(rescuer.accountId)
        });

        setConfirmingState(status);
      }

      // if (localState === 'claimRecovery' && account.accountId && lostAccount?.accountId) {
      //   const params = [lostAccount.accountId];
      //   const { block, failureText, fee, status, txHash } = await broadcast(api, claimRecovery, params, signer, account.accountId);

      //   history.push({
      //     action: 'claim_recovery',
      //     amount: '0',
      //     block,
      //     date: Date.now(),
      //     fee: fee || '',
      //     from: String(account.accountId),
      //     hash: txHash || '',
      //     status: failureText || status,
      //     to: ''
      //   });

      //   setConfirmingState(status);
      // }

      // eslint-disable-next-line no-void
      account?.accountId && void saveHistory(chain, hierarchy, String(account.accountId), history);
      // localState === 'initiateRecovery' && account?.accountId && lostAccount?.accountId && updateMeta(String(account?.accountId), prepareMetaData(chain, 'activeRescue', lostAccount.accountId));
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState(localState);
      setConfirmingState('');
    }
  }, [account.accountId, asRecovered, api, batchAll, batchWithdraw, chain, withdrawAmounts, vouchRecovery, closeRecovery, claimRecovery, createRecovery, decimals, friendIds, hierarchy, initiateRecovery, lostAccount?.accountId, password, recoveryDelay, recoveryThreshold, removeRecovery, rescuer, setState, state]);

  const handleCloseModal = useCallback((): void => {
    setConfirmModalOpen(false);
  }, [setConfirmModalOpen]);

  const handleReject = useCallback((): void => {
    setState('');
    setConfirmingState('');
    onAction('/');
    window.location.reload();
  }, [onAction, setState]);

  const getMessage = useCallback((note, state: string): string => {
    if (state === 'initiateRecovery') {
      return t<string>('Initiating recovery for the recoverable account, with the following friend(s)');
    }

    if (['closeRecovery', 'closeRecoveryAsRescuer'].includes(state)) {
      return t('The recoverable account will receive the recovery deposit {{deposit}} placed by the rescuer account', { replace: { deposit: api.createType('Balance', deposit).toHuman() } });
    }

    if (state === 'removeRecovery') {
      return t('Removing your account configuration as recoverable. Your {{deposit}} deposit will be unlocked', { replace: { deposit: api.createType('Balance', deposit).toHuman() } });
    }

    if (state === 'vouchRecovery') {
      return t('Vouching to rescue the recoverable account using the rescuer account');
    }

    if (state === 'claimRecovery') {
      return t('Claiming recovery for the recoverable account');
    }

    if (['withdrawAsRecovered', 'withdrawWithClaim'].includes(state) && withdrawAmounts) {
      return (withdrawAmounts?.totalWithdrawable && !withdrawAmounts.totalWithdrawable.isZero()
        ? t('Withdrawing {{amount}}', { replace: { amount: api.createType('Balance', withdrawAmounts.totalWithdrawable).toHuman() } })
        : '') +
        (withdrawAmounts?.staked && !withdrawAmounts.staked.isZero()
          ? t(' Unstaking {{amount}} which will be redeemable after {{days}} days', {
            replace: { amount: api.createType('Balance', withdrawAmounts.staked).toHuman(), days: unbondingDuration }
          })
          : '');
    }

    return '';
  }, [api, deposit, t, unbondingDuration, withdrawAmounts]);

  const WriteAppropriateMessage = ({ note, state }: { state: string, note?: string }) => (
    <Typography sx={{ mt: '30px', textAlign: 'center' }} variant='body1'>
      {getMessage(note, state)}
    </Typography>
  );

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('makeRecoverable'):
        return 'Make Recoverable';
      case ('removeRecovery'):
        return 'Remove Recovery';
      case ('initiateRecovery'):
        return 'Initiate Recovery';
      case ('closeRecovery'):
      case ('closeRecoveryAsRescuer'):
        return 'Close Recovery';
      case ('vouchRecovery'):
        return 'Vouch Recovery';
      case ('claimRecovery'):
        return 'Claim Recovery';
      case ('withdrawAsRecovered'):
      case ('withdrawWithClaim'):
        return 'Withdraw';
      default:
        return state.toUpperCase();
    }
  };

  const handleBack = useCallback((): void => {
    setConfirmingState('');

    handleCloseModal();
  }, [handleCloseModal]);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={stateInHuman(state)} />
      <Grid alignItems='center' container>
        <Grid alignItems='center' container item justifyContent='space-between' sx={{ backgroundColor: '#f7f7f7', textAlign: 'center', fontSize: 12, p: '15px 40px 10px' }} xs={12}>
          <Grid container item sx={{ fontFamily: 'sans-serif', fontWeight: 'bold', pl: 6 }} xs={12}>
            <Identity accountInfo={lostAccount} chain={chain} showAddress title={t('Recoverable account')} />
          </Grid>
          <Grid container item xs={12}>
            <Divider />
          </Grid>
          <Grid alignItems='center' container item justifyContent='space-around' sx={{ fontSize: 11, pt: '20px', textAlign: 'center' }} xs={12}>
            {recoveryThreshold && !['withdrawAsRecovered'].includes(state) &&
              <Grid container item justifyContent='flex-start' sx={{ textAlign: 'left' }} xs={3}>
                <ShowValue direction='column' title={t('Recovery threshold')} value={recoveryThreshold} />
              </Grid>
            }
            <Grid container item justifyContent='center' xs={3}>
              <ShowBalance2 api={api} balance={estimatedFee} title={t('Fee')} />
            </Grid>
            {['initiateRecovery', 'makeRecoverable'].includes(state) &&
              <Grid container item justifyContent='center' xs={3}>
                <ShowBalance2 api={api} balance={deposit} title={t('Deposit')} />
              </Grid>
            }
            {recoveryDelay !== undefined && !['withdrawAsRecovered'].includes(state) &&
              <Grid container item justifyContent='flex-end' sx={{ textAlign: 'right' }} xs={3}>
                <ShowValue direction='column' title={t('Recovery delay ')} value={recoveryDelay} />
              </Grid>
            }
          </Grid>
        </Grid>
        <Grid container item sx={{ bgcolor: 'white', fontSize: 12, height: '210px', overflowY: 'auto' }} xs={12}>
          {state === 'makeRecoverable' && <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '30px 50px 5px', textAlign: 'center' }} xs={12}>
            {t('List of friends')}
          </Grid>
          }
          {['closeRecovery', 'initiateRecovery', 'closeRecoveryAsRescuer', 'vouchRecovery', 'removeRecovery', 'claimRecovery', 'withdrawAsRecovered', 'withdrawWithClaim'].includes(state) &&
            <Grid container item justifyContent='center' p='15px 30px'>
              <WriteAppropriateMessage state={state} />
            </Grid>
          }
          {['makeRecoverable', 'initiateRecovery'].includes(state) &&
            friends?.map((f, index) => (
              <Grid alignItems='flex-start' key={index} sx={{ fontFamily: 'sans-serif', px: 6 }} xs={12}>
                <Identity accountInfo={f} chain={chain} showAddress />
              </Grid>
            ))
          }
          {['closeRecovery', 'closeRecoveryAsRescuer', 'vouchRecovery', 'claimRecovery'].includes(state) &&
            <Grid container item sx={{ fontFamily: 'sans-serif', fontWeight: 'bold', pl: 11 }} xs={12}>
              <Identity accountInfo={rescuer} chain={chain} showAddress title={'Rescuer account'} />
            </Grid>
          }
        </Grid>
      </Grid>
      <Grid container item sx={{ p: '30px 25px' }} xs={12}>
        <Password
          autofocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
          handleIt={handleConfirm}
          isDisabled={!estimatedFee}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />
        <Grid alignItems='center' container item xs={12}>
          <Grid container item xs={12}>
            <ConfirmButton
              handleBack={handleBack}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              isDisabled={confirmBtnDisabled}
              state={confirmingState}
              text={t('Confirm')}
            />
          </Grid>
        </Grid>
      </Grid>
    </Popup>
  );
}
