// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here users confirm their staking related orders (e.g., stake, unstake, redeem, etc.)
 * */

import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, StakingConsts, TransactionDetail } from '../../../util/plusTypes';

import { BuildCircleRounded as BuildCircleRoundedIcon, ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Grid, IconButton, Skeleton, Typography } from '@mui/material';
import { grey, red } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ZERO } from '@polkadot/util';

import { AccountContext } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, FormatBalance, Hint, Password, PlusHeader, Popup } from '../../../components';
import { broadcast, createPool, editPool, signAndSend } from '../../../util/api';
import { PASS_MAP, STATES_NEEDS_MESSAGE } from '../../../util/constants';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, isEqual, prepareMetaData } from '../../../util/plusUtils';
import ValidatorsList from '../Solo/ValidatorsList';
import Pool from './Pool';

interface Props {
  amount: BN;
  api: ApiPromise;
  chain: Chain;
  handlePoolStakingModalClose?: () => void;
  pool: MyPoolInfo; // FIXME check the type
  state: string;
  selectedValidators: DeriveStakingQuery[] | null;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectValidatorsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts | undefined;
  nextPoolId?: BN;
  nominatedValidators: DeriveStakingQuery[] | null;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  poolsMembers: MembersMapEntry[] | undefined;
  setNewPool?: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>
  basePool?: MyPoolInfo | undefined;
}

export default function ConfirmStaking({ amount, api, basePool, chain, handlePoolStakingModalClose, nominatedValidators, pool, poolsMembers, selectedValidators, setConfirmStakingModalOpen, setNewPool, setSelectValidatorsModalOpen, setState, showConfirmStakingModal, staker, stakingConsts, state, validatorsIdentities }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [confirmingState, setConfirmingState] = useState<string | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [currentlyStaked, setCurrentlyStaked] = useState<BN | undefined>();
  const [totalStaked, setTotalStaked] = useState<BN | undefined>();
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean>(false);
  const [confirmButtonText, setConfirmButtonText] = useState<string>(t('Confirm'));
  const [amountNeedsAdjust, setAmountNeedsAdjust] = useState<boolean>(false);
  const [surAmount, setSurAmount] = useState<BN>(amount); /** SUR: Staking Unstaking Redeem (and Claim) amount  */
  const [note, setNote] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<BN>(BN_ZERO);

  const decimals = api.registry.chainDecimals[0];
  const token = api.registry.chainTokens[0];
  const existentialDeposit = useMemo(() => new BN(String(api.consts.balances.existentialDeposit)), [api]);
  const poolId = pool?.poolId ?? pool?.member?.poolId; // it is a new selectedPool ( pool?.poolId) or an already joined pool (pool?.member?.poolId)

  const nominatedValidatorsId = useMemo(() => nominatedValidators ? nominatedValidators.map((v) => String(v.accountId)) : [], [nominatedValidators]);
  const selectedValidatorsAccountId = useMemo(() => selectedValidators ? selectedValidators.map((v) => String(v.accountId)) : [], [selectedValidators]);
  const validatorsToList = ['changeValidators', 'setNominees'].includes(state) ? selectedValidators : nominatedValidators;

  const unlockingLen = pool?.ledger?.unlocking?.length ?? 0;
  const maxUnlockingChunks = api.consts.staking.maxUnlockingChunks?.toNumber() as unknown as number;

  /** list of available trasactions */
  const chilled = api.tx.nominationPools.chill;
  const poolSetState = api.tx.nominationPools.setState; // (poolId, state)
  const create = api.tx.nominationPools.create;
  const setMetadata = api.tx.nominationPools.setMetadata;
  const joined = api.tx.nominationPools.join; // (amount, poolId)
  const unbonded = api.tx.nominationPools.unbond;
  const nominated = api.tx.nominationPools.nominate;
  const bondExtra = api.tx.nominationPools.bondExtra;
  const redeem = api.tx.nominationPools.withdrawUnbonded;
  const poolWithdrawUnbonded = api.tx.nominationPools.poolWithdrawUnbonded;
  const claim = api.tx.nominationPools.claimPayout;
  const updateRoles = api.tx.nominationPools.updateRoles;//(poolId, root, nominator, stateToggler)

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
    if (staker?.balanceInfo?.available) {
      setAvailableBalance(new BN(String(staker.balanceInfo.available)));
    }
  }, [staker?.balanceInfo?.available]);

  useEffect(() => {
    setConfirmButtonDisabled(!stakingConsts || !estimatedFee || !availableBalance || !api);
  }, [api, availableBalance, estimatedFee, stakingConsts]);

  useEffect(() => {
    if (confirmingState) {
      // do not run following code while are in these states
      return;
    }

    /** check if re-nomination is needed */
    if (['changeValidators'].includes(state)) {
      if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
        if (state === 'changeValidators') {
          setConfirmButtonDisabled(true);
        }

        setNote(t('The selected and previously nominated validators are the same, no need to renominate'));
      }
    }
  }, [selectedValidatorsAccountId, state, nominatedValidatorsId, t, confirmingState]);

  const getRole = useCallback((role) => {
    if (!basePool?.bondedPool || !pool?.bondedPool) {
      return;
    }

    if (!pool.bondedPool.roles[role]) {
      return 'Remove';
    }

    if (pool.bondedPool.roles[role] === basePool.bondedPool.roles[role]) {
      return 'Noop';
    }

    return { set: pool.bondedPool.roles[role] };
  }, [basePool, pool]);

  const setFee = useCallback(() => {
    let params;

    if (estimatedFee?.gtn(0)) {
      return;
    }

    switch (state) {
      case ('bondExtra'):
      case ('bondExtraRewards'):
        params = state === 'bondExtra' ? [{ FreeBalance: surAmount }] : ['Rewards'];

        // eslint-disable-next-line no-void
        void bondExtra(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('joinPool'):
        params = [surAmount, poolId];
        // eslint-disable-next-line no-void
        void joined(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('createPool'):
        if (!pool?.bondedPool) { return; }

        params = [surAmount, ...Object.values(pool.bondedPool.roles).slice(1)];

        // eslint-disable-next-line no-void
        void create(...params).paymentInfo(staker.address).then((i) => {
          const createFee = i?.partialFee;

          // eslint-disable-next-line no-void
          void setMetadata(pool.poolId, pool.metadata).paymentInfo(staker.address).then((i) =>
            setEstimatedFee(api.createType('Balance', createFee.add(i?.partialFee))));
        });

        break;
      case ('editPool'):
        if (!pool?.bondedPool || !pool?.member || !basePool?.bondedPool) { return; }

        params = [pool.member.poolId, pool.metadata];
        // eslint-disable-next-line no-void
        basePool && basePool.metadata !== pool.metadata && void setMetadata(...params).paymentInfo(staker.address).then((i) => {
          console.log('setmetadata fee set')
          setEstimatedFee((prevEstimatedFee) => api.createType('Balance', (prevEstimatedFee ?? BN_ZERO).add(i?.partialFee)));
        });

        params = [pool.member.poolId, getRole('root'), getRole('nominator'), getRole('stateToggler')];

        // eslint-disable-next-line no-void
        basePool && JSON.stringify(basePool.bondedPool.roles) !== JSON.stringify(pool.bondedPool.roles) &&
          // eslint-disable-next-line no-void
          void updateRoles(...params).paymentInfo(staker.address).then((i) => {
            setEstimatedFee((prevEstimatedFee) => api.createType('Balance', (prevEstimatedFee ?? BN_ZERO).add(i?.partialFee)));
          });

        break;
      case ('unstake'):
        params = [staker?.address, surAmount];
        console.log('unlockingLen', unlockingLen); console.log('maxUnlockingChunks', maxUnlockingChunks);

        // eslint-disable-next-line no-void
        void unbonded(...params).paymentInfo(staker.address).then((i) => {
          const fee = i?.partialFee;

          if (unlockingLen < maxUnlockingChunks) {
            setEstimatedFee(fee);
          } else {
            const dummyParams = [1, 1];

            // eslint-disable-next-line no-void
            void poolWithdrawUnbonded(...dummyParams).paymentInfo(staker.address).then((j) => setEstimatedFee(api.createType('Balance', fee.add(j?.partialFee))));
          }
        });

        break;
      case ('stopNominating'):
        params = [poolId];
        // eslint-disable-next-line no-void
        void chilled(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('changeValidators'):
      case ('setNominees'):
        params = [poolId, selectedValidatorsAccountId];

        // eslint-disable-next-line no-void
        void nominated(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawUnbound'):
        params = [staker.address, 100]; /** 100 is a dummy number */

        // eslint-disable-next-line no-void
        void redeem(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawClaimable'):
        // eslint-disable-next-line no-void
        void claim().paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('blocked'):
      case ('open'):
      case ('destroying'):
        params = [pool.poolId, state];

        // eslint-disable-next-line no-void
        void poolSetState(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      default:
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, basePool, bondExtra, claim, create, getRole, joined, maxUnlockingChunks, nominated, pool?.bondedPool?.roles, pool?.member?.poolId, pool.metadata, pool.poolId, poolId, poolSetState, poolWithdrawUnbonded, redeem, selectedValidatorsAccountId, setMetadata, staker.address, state, surAmount, unbonded, unlockingLen, updateRoles]);

  const setTotalStakedInHumanBasedOnStates = useCallback(() => {
    const lastStaked = currentlyStaked ?? BN_ZERO;

    switch (state) {
      case ('bondExtra'):
      case ('bondExtraRewards'):
      case ('joinPool'):
      case ('createPool'):

        setTotalStaked(lastStaked.add(surAmount));
        break;

      case ('unstake'):

        !lastStaked.isZero() && setTotalStaked(lastStaked.sub(surAmount));
        break;
      default:
        setTotalStaked(lastStaked); // as default for states like setState
    }
  }, [currentlyStaked, state, surAmount]);

  useEffect(() => {
    if (confirmingState || !api) {
      return;
    }

    /** set fees and stakeAmount */
    !estimatedFee && setFee();
    setTotalStakedInHumanBasedOnStates();
  }, [api, confirmingState, estimatedFee, setFee, setTotalStakedInHumanBasedOnStates]);

  useEffect(() => {
    if (!estimatedFee || estimatedFee?.isEmpty || !availableBalance || !staker.balanceInfo?.total || !existentialDeposit) {
      return;
    }

    if (confirmingState) {
      // do not run following code while confirming
      return;
    }

    let partialSubtrahend = surAmount;

    if (['withdrawUnbound', 'unstake', 'withdrawClaimable', 'bondExtraRewards'].includes(state)) {
      partialSubtrahend = BN_ZERO;
    }

    const fee = new BN(estimatedFee.toString());

    if (new BN(String(staker.balanceInfo.total)).sub((partialSubtrahend.add(fee))).lt(existentialDeposit)) {
      setConfirmButtonDisabled(true);

      setConfirmButtonText(t('Account reap issue, consider fee!'));
    }

    if (availableBalance.sub((partialSubtrahend.add(fee))).ltn(0)) {
      setConfirmButtonDisabled(true);
      setConfirmButtonText(t('Not enough balance, consider fee!'));

      if (['joinPool', 'createPool', 'bondExtra'].includes(state)) {
        setAmountNeedsAdjust(true);
      }
    }
  }, [surAmount, estimatedFee, availableBalance, staker, existentialDeposit, state, t, confirmingState]);

  useEffect(() => {
    setCurrentlyStaked(pool?.member?.points ? new BN(pool?.member?.points) : BN_ZERO);
  }, [pool]);

  const handleCloseModal = useCallback((): void => {
    setConfirmStakingModalOpen(false);
  }, [setConfirmStakingModalOpen]);

  const handleBack = useCallback((): void => {
    if (!['createPool', 'joinPool', 'changeValidators', 'setNominees', 'editPool'].includes(state)) {
      setState('');
      setConfirmingState('');
    }

    handleCloseModal();
  }, [handleCloseModal, setState, state]);

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('joinPool'):
        return 'JOIN POOL';
      case ('bondExtra'):
      case ('bondExtraRewards'):
        return 'STAKING OF';
      case ('createPool'):
        return 'CREATE POOL';
      case ('changeValidators'):
      case ('setNominees'):
        return 'NOMINATING';
      case ('unstake'):
        return 'UNSTAKING';
      case ('withdrawUnbound'):
        return 'REDEEM';
      case ('withdrawClaimable'):
        return 'CLAIM';
      case ('stopNominating'):
        return 'STOP NOMINATING';
      case ('blocked'):
        return 'BLOCKING';
      case ('editPool'):
        return 'EDIT POOL';
      default:
        return state.toUpperCase();
    }
  };

  const handleConfirm = useCallback(async (): Promise<void> => {
    const localState = state;
    const history: TransactionDetail[] = []; /** collects all records to save in the local history at the end */

    try {
      setConfirmingState('confirming');

      const signer = keyring.getPair(staker.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      if (localState === 'joinPool' && surAmount !== BN_ZERO) {
        const params = [surAmount, poolId];
        const { block, failureText, fee, status, txHash } = await broadcast(api, joined, params, signer, staker.address);

        history.push({
          action: 'pool_join',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (['bondExtra', 'bondExtraRewards'].includes(localState) && surAmount !== BN_ZERO) {
        const params = localState === 'bondExtra' ? [{ FreeBalance: surAmount }] : ['Rewards'];
        const { block, failureText, fee, status, txHash } = await broadcast(api, bondExtra, params, signer, staker.address);

        history.push({
          action: 'pool_bond_extra',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: pool?.accounts?.stashId || ''
        });

        setConfirmingState(status);
      }

      if (localState === 'createPool' && surAmount !== BN_ZERO) {
        if (!pool?.bondedPool?.roles) {
          return setConfirmingState('failed');
        }

        const { block, failureText, fee, status, txHash } = await createPool(api, staker.address, signer, surAmount, poolId, pool.bondedPool.roles, pool?.metadata ?? '');

        history.push({
          action: 'pool_create',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'editPool' && basePool) {
        const { block, failureText, fee, status, txHash } = await editPool(api, staker.address, signer, pool, basePool);

        history.push({
          action: 'pool_edit',
          amount: '',
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (['changeValidators', 'setNominees'].includes(localState) && poolId) {
        if (localState === 'changeValidators') {
          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('selected and previously nominated validators are the same, no need to renominate');

            setConfirmingState('success');

            return;
          }
        }

        const params = [poolId, selectedValidatorsAccountId];
        const { block, failureText, fee, status, txHash } = await broadcast(api, nominated, params, signer, staker.address);

        history.push({
          action: 'pool_nominate',
          amount: '',
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'unstake' && surAmount.gt(BN_ZERO)) {
        const params = [staker?.address, surAmount];

        if (unlockingLen < maxUnlockingChunks) {
          const { block, failureText, fee, status, txHash } = await broadcast(api, unbonded, params, signer, staker.address);

          history.push({
            action: 'pool_unbond',
            amount: amountToHuman(String(surAmount), decimals),
            block,
            date: Date.now(),
            fee: fee || '',
            from: staker.address,
            hash: txHash || '',
            status: failureText || status,
            to: ''
          });

          setConfirmingState(status);
        } else { // hence a poolWithdrawUnbonded is needed
          const optSpans = await api.query.staking.slashingSpans(staker.address);
          const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1;

          const batch = api.tx.utility.batchAll([
            poolWithdrawUnbonded(poolId, spanCount),
            unbonded(...params)
          ]);

          const { block, failureText, fee, status, txHash } = await signAndSend(api, batch, signer, staker.address)

          history.push({
            action: 'pool_unbond2',
            amount: amountToHuman(String(surAmount), decimals),
            block,
            date: Date.now(),
            fee: fee || '',
            from: staker.address,
            hash: txHash || '',
            status: failureText || status,
            to: ''
          });

          setConfirmingState(status);
        }
      }

      if (localState === 'withdrawUnbound' && surAmount.gt(BN_ZERO)) {
        const optSpans = await api.query.staking.slashingSpans(staker.address);
        const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1;
        const params = [staker.address, spanCount];

        const { block, failureText, fee, status, txHash } = await broadcast(api, redeem, params, signer, staker.address);

        history.push({
          action: 'pool_redeem',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'withdrawClaimable' && surAmount.gt(BN_ZERO)) {
        const { block, failureText, fee, status, txHash } = await broadcast(api, claim, [], signer, staker.address);

        history.push({
          action: 'pool_claim',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (['blocked', 'destroying', 'open'].includes(localState)) {
        const params = [poolId, state];
        const { block, failureText, fee, status, txHash } = await broadcast(api, poolSetState, params, signer, staker.address);

        history.push({
          action: 'pool_setState',
          amount: amountToHuman(String(surAmount), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'stopNominating') {
        const params = [poolId];
        const { block, failureText, fee, status, txHash } = await broadcast(api, chilled, params, signer, staker.address);

        history.push({
          action: 'pool_stop_nominating',
          block,
          date: Date.now(),
          fee: fee || '',
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
      setConfirmingState('');
    }
  }, [api, basePool, bondExtra, chain, chilled, claim, decimals, hierarchy, joined, maxUnlockingChunks, nominated, nominatedValidatorsId, password, pool, poolId, poolSetState, poolWithdrawUnbonded, redeem, selectedValidatorsAccountId, setState, staker.address, state, surAmount, unbonded, unlockingLen]);

  const handleReject = useCallback((): void => {
    setState('');
    setConfirmingState('');

    if (setSelectValidatorsModalOpen) {
      setSelectValidatorsModalOpen(false);
    }

    handleCloseModal();

    if (handlePoolStakingModalClose) {
      handlePoolStakingModalClose();
    }
  }, [handleCloseModal, handlePoolStakingModalClose, setSelectValidatorsModalOpen, setState]);

  const writeAppropiateMessage = useCallback((state: string, note?: string): React.ReactNode => {
    switch (state) {
      case ('unstake'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Note: The unstaked amount will be redeemable after {{days}} days ', { replace: { days: stakingConsts?.unbondingDuration } })}
        </Typography>;
      case ('withdrawUnbound'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Available balance after redeem will be')}<br />
          {estimatedFee
            ? amountToHuman(String(surAmount.add(availableBalance).sub(new BN(String(estimatedFee)))), decimals)
            : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
          }
          {' '} {token}
        </Typography>;
      case ('stopNominating'):
        return <Typography sx={{ mt: '30px' }} variant='h6'>
          {t('Declaring no desire to nominate validators')}
        </Typography>;
      case ('createPool'):
        return <Typography sx={{ mt: '30px' }} variant='body1'>
          <FormatBalance api={api} value={existentialDeposit} />
          {t(' will be bonded in Reward Id, and returned back when unbound all.')}
        </Typography>;
      case ('blocked'):
        return <Typography sx={{ color: grey[700], mt: '30px' }} variant='body1'>
          {t('The pool state will be changed to blocked, where no members can join and some admin roles can kick members')}
        </Typography>;
      case ('destroying'):
        return <Typography sx={{ color: red[700], mt: '30px' }} variant='body1'>
          {t('No one can join and all members can be permissionlessly removed. Once in destroying state, it cannot be reverted to another state')}
        </Typography>;
      case ('open'):
        return <Typography sx={{ color: grey[700], mt: '30px' }} variant='body1'>
          {t('The pool state will be changed to open, where anyone can join and no members can be permissionlessly removed')}
        </Typography>;
      default:
        return <Typography sx={{ m: '30px 0px 30px' }} variant='h6'>
          {note}
        </Typography>;
    }
    // Note: availableBalance change should not change the alert in redeem confirm page!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surAmount, token, decimals, estimatedFee, stakingConsts?.unbondingDuration, t]);

  const handleAutoAdjust = useCallback((): void => {
    if (!existentialDeposit) {
      return;
    }

    const fee = new BN(String(estimatedFee));
    const adjustedAmount = availableBalance.sub(existentialDeposit.add(fee));

    setSurAmount(adjustedAmount);
    setAmountNeedsAdjust(false);
    setConfirmButtonDisabled(false);

    if (String(pool?.bondedPool?.state) === 'Creating') {
      const modifiedPool = JSON.parse(JSON.stringify(pool)) as MyPoolInfo;

      modifiedPool.bondedPool.points = adjustedAmount;
      setNewPool && setNewPool(modifiedPool);
    }
  }, [existentialDeposit, estimatedFee, availableBalance, pool, setNewPool]);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmStakingModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm'} />
      <Grid alignItems='center' container>
        <Grid container item sx={{ backgroundColor: '#f7f7f7', p: '25px 40px 10px' }} xs={12}>
          <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, fontVariant: 'small-caps', justifyContent: 'flex-start', p: '5px 10px', textAlign: 'center' }}>
            {stateInHuman(confirmingState || state)}
          </Grid>
          <Grid data-testid='amount' item sx={{ fontSize: 20, fontWeight: 600, height: '20px', textAlign: 'center' }} xs={12}>
            {!surAmount?.isZero() && <FormatBalance api={api} value={surAmount} />}
          </Grid>
          <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 11, paddingTop: '15px', textAlign: 'center' }} xs={12}>
            <Grid container item justifyContent='flex-start' sx={{ textAlign: 'left' }} xs={4}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Currently staked')}
              </Grid>
              <Grid data-testid='currentlyStaked' item xs={12}>
                {!currentlyStaked
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <FormatBalance api={api} value={currentlyStaked} />
                }
              </Grid>
            </Grid>
            <Grid container item justifyContent='center' xs={4}>
              <Grid item sx={{ color: grey[500], fontWeight: '600' }} xs={12}>
                {t('Fee')}
              </Grid>
              <Grid item xs={12}>
                {!estimatedFee
                  ? <span><Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '30px' }} /></span>
                  : <FormatBalance api={api} value={estimatedFee} />
                }
              </Grid>
            </Grid>
            <Grid container item justifyContent='flex-end' sx={{ textAlign: 'right' }} xs={4}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Total staked')}
              </Grid>
              <Grid data-testid='totalStaked' item xs={12}>
                {!totalStaked
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <FormatBalance api={api} value={totalStaked} />
                }
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {stakingConsts && !(STATES_NEEDS_MESSAGE.includes(state) || note)
          ? <>
            {pool && !['changeValidators', 'setNominees'].includes(state)
              ? <>
                <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
                  {t('Pool')}
                </Grid>
                <Grid container item sx={{ fontSize: 14, height: '185px', p: '0px 20px 0px' }} xs={12}>
                  <Pool
                    api={api}
                    chain={chain}
                    pool={pool}
                    poolsMembers={poolsMembers}
                    showMore={!!(pool?.bondedPool && String(pool.bondedPool.state) !== 'Creating')}
                  />
                  <Grid item sx={{ m: '30px 30px', textAlign: 'center' }} xs={12}>
                    {writeAppropiateMessage(state)}
                  </Grid>
                </Grid>
              </>
              : <>
                <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
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
            }
          </>
          : <Grid item sx={{ height: '115px', m: '50px 30px 50px', textAlign: 'center' }} xs={12}>
            {writeAppropiateMessage(state, note)}
          </Grid>
        }
      </Grid>
      <Grid container item sx={{ p: '25px 25px' }} xs={12}>
        <Password
          autofocus={!confirmingState}
          handleIt={handleConfirm}
          isDisabled={confirmButtonDisabled || !!confirmingState}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />
        <Grid alignItems='center' container item xs={12}>
          <Grid container item xs={amountNeedsAdjust ? 11 : 12}>
            <ConfirmButton
              handleBack={handleBack}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              isDisabled={confirmButtonDisabled}
              state={confirmingState ?? ''}
              text={confirmButtonText}
            />
          </Grid>
          {amountNeedsAdjust &&
            <Grid item sx={{ textAlign: 'left' }} xs={1}>
              <Hint id='adjustAmount' tip={t('Auto adjust the staking amount')}>
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
