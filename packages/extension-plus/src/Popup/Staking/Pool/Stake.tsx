// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * render stake tab in pool staking
 * */

import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts } from '../../../util/plusTypes';

import { Alert, Avatar, Badge, Button as MuiButton, Grid, InputAdornment, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Balance } from '@polkadot/types/interfaces';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';
import { BN, BN_ZERO } from '@polkadot/util';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { FormatBalance, Progress, ShowBalance2 } from '../../../components';
import { amountToHuman, amountToMachine, fixFloatingPoint } from '../../../util/plusUtils';
import CreatePool from './CreatePool';
import JoinPool from './JoinPool';

interface Props {
  api: ApiPromise | undefined;
  chain: Chain;
  currentlyStaked: BN | undefined | null;
  setStakeAmount: React.Dispatch<React.SetStateAction<BN>>
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  state: string;
  poolStakingConsts: PoolStakingConsts | undefined;
  handleConfirmStakingModalOpen: () => void;
  myPool: MyPoolInfo | undefined | null;
  nextPoolId: BN | undefined;
  poolsInfo: PoolInfo[] | undefined | null;
  setNewPool: React.Dispatch<React.SetStateAction<PoolInfo | undefined>>
  poolsMembers: MembersMapEntry[] | undefined
}

export default function Stake({ api, chain, currentlyStaked, handleConfirmStakingModalOpen, myPool, nextPoolId, poolStakingConsts, poolsInfo, poolsMembers, setNewPool, setStakeAmount, setState, staker, state }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<string>('');
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>();
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);
  const [maxStakeable, setMaxStakeable] = useState<BN|undefined>();
  const [maxStakeableAsNumber, setMaxStakeableAsNumber] = useState<number>(0);
  const [showCreatePoolModal, setCreatePoolModalOpen] = useState<boolean>(false);
  const [showJoinPoolModal, setJoinPoolModalOpen] = useState<boolean>(false);
  const [estimatedMaxFee, setEstimatedMaxFee] = useState<Balance | undefined>();

  const decimals = api && api.registry.chainDecimals[0];
  const token = api ? api.registry.chainTokens[0] : '';
  const existentialDeposit = useMemo(() => api ? new BN(api.consts.balances.existentialDeposit.toString()) : BN_ZERO, [api]);

  useEffect(() => {
    api && staker?.balanceInfo?.available &&
      api.tx.nominationPools.bondExtra({ FreeBalance: staker.balanceInfo.available }).paymentInfo(staker.address).then((i) => {
        setEstimatedMaxFee(api.createType('Balance', i?.partialFee));
      });
  }, [api, staker]);

  useEffect(() => {
    decimals && setStakeAmount(new BN(String(amountToMachine(stakeAmountInHuman, decimals))));
  }, [decimals, setStakeAmount, stakeAmountInHuman]);

  const handleStakeAmountInput = useCallback((value: string): void => {
    if (!api || !decimals || !staker?.balanceInfo?.total) { return; }

    setAlert('');
    const valueAsBN = new BN(String(amountToMachine(value, decimals)));

    if (new BN(staker.balanceInfo.total.toString()).sub(valueAsBN).sub(estimatedMaxFee ?? BN_ZERO).lt(existentialDeposit)) {
      setAlert(t('Your account might be reaped!'));
    }

    setStakeAmountInHuman(fixFloatingPoint(value));
  }, [api, decimals, estimatedMaxFee, existentialDeposit, staker, t]);

  const handleStakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(value);
  }, [handleStakeAmountInput]);

  const handleCreatePool = useCallback((): void => {
    if (staker?.balanceInfo?.available) {
      setCreatePoolModalOpen(true);

      if (!state) { setState('createPool'); }
    }
  }, [staker?.balanceInfo?.available, state, setState]);

  const handleJoinPool = useCallback((): void => {
    if (staker?.balanceInfo?.available) {
      setJoinPoolModalOpen(true);

      if (!state) { setState('joinPool'); }
    }
  }, [staker?.balanceInfo?.available, state, setState]);

  const handleNextToStake = useCallback((): void => {
    if (!decimals) { return; }

    if (Number(stakeAmountInHuman)) {
      handleConfirmStakingModalOpen();

      if (!state) { setState('bondExtra'); }
    }
  }, [stakeAmountInHuman, decimals, handleConfirmStakingModalOpen, state, setState]);

  useEffect(() => {
    if (!poolStakingConsts || existentialDeposit === undefined || !staker?.balanceInfo?.available || !estimatedMaxFee) { return; }

    let max = new BN(String(staker.balanceInfo.available)).sub(existentialDeposit.muln(2)).sub(estimatedMaxFee);

    if (max.ltn(0)) {
      max = BN_ZERO;
    }

    setMaxStakeable(max);
  }, [poolStakingConsts, existentialDeposit, staker, myPool, estimatedMaxFee]);

  useEffect(() => {
    if (!decimals || !maxStakeable) { return; }

    const maxStakeableAsNumber = Number(amountToHuman(maxStakeable.toString(), decimals));

    setMaxStakeableAsNumber(maxStakeableAsNumber);
  }, [maxStakeable, decimals, currentlyStaked]);

  useEffect(() => {
    if (stakeAmountInHuman && Number(stakeAmountInHuman) <= maxStakeableAsNumber) {
      setNextToStakeButtonDisabled(false);
    }
  }, [maxStakeableAsNumber, stakeAmountInHuman]);

  useEffect(() => {
    if (!decimals) { return; }

    if (!staker?.balanceInfo?.available) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    setNextButtonCaption(t('Next'));

    const balanceIsInsufficient = staker?.balanceInfo?.available <= amountToMachine(stakeAmountInHuman, decimals);

    if (balanceIsInsufficient || !Number(stakeAmountInHuman)) {
      setNextToStakeButtonDisabled(true);
    }

    if (Number(stakeAmountInHuman) && balanceIsInsufficient) {
      setNextButtonCaption(t('Insufficient Balance'));
    }
  }, [stakeAmountInHuman, t, staker?.balanceInfo?.available, decimals]);

  const handleMaxStakeClicked = useCallback(() => {
    if (myPool?.bondedPool?.state?.toLowerCase() === 'destroying') { return; }

    handleStakeAmountInput(String(maxStakeableAsNumber));
  }, [handleStakeAmountInput, maxStakeableAsNumber, myPool?.bondedPool?.state]);

  const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: '#44b700',
      color: '#44b700',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      },
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  }));

  const StakeInitialChoice = () => (
    <Grid container justifyContent='center' sx={{ pt: 5 }}>
      <Grid container item justifyContent='center' spacing={0.5} sx={{ fontSize: 12 }} xs={6}>
        <Grid item sx={{ pb: 1, textAlign: 'center' }} xs={12}>
          <StyledBadge
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            overlap='circular'
            variant='dot'
          >
            <Avatar onClick={handleJoinPool} sx={{ bgcolor: '#1c4a5a', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#ffb057', cursor: 'pointer', height: 110, width: 110 }}>{t('Join pool')}</Avatar>
          </StyledBadge>
        </Grid>
        <Grid item>
          {t('Min to join')}:
        </Grid>
        <Grid item>
          <ShowBalance2 api={api} balance={poolStakingConsts?.minJoinBond} />
        </Grid>
      </Grid>
      <Grid container item justifyContent='center' spacing={0.5} sx={{ fontSize: 12 }} xs={6}>
        <Grid container item justifyContent='center' sx={{ pb: 1 }} xs={12}>
          <Grid item>
            <Avatar onClick={handleCreatePool} sx={{ bgcolor: '#ffb057', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#1c4a5a', cursor: 'pointer', height: 110, width: 110 }}>{t('Create pool')}</Avatar>
          </Grid>
        </Grid>
        <Grid item>
          {t('Min to create')}:
        </Grid>
        <Grid item>
          <ShowBalance2 api={api} balance={poolStakingConsts?.minCreationBond} />
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <>
      {currentlyStaked === undefined
        ? <Progress title={'Loading ...'} />
        : currentlyStaked === null && !myPool
          ? <StakeInitialChoice />
          : <>
            <Grid item sx={{ p: '10px 30px 0px' }} xs={12}>
              <TextField
                InputLabelProps={{ shrink: true }}
                InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
                autoFocus
                color='warning'
                disabled={myPool?.bondedPool?.state?.toLowerCase() === 'destroying'}
                error={zeroBalanceAlert}
                fullWidth
                helperText={zeroBalanceAlert ? t('No available fund to stake') : ''}
                inputProps={{ step: '.01' }}
                label={t('Amount')}
                name='stakeAmount'
                onChange={handleStakeAmount}
                placeholder='0.0'
                sx={{ height: '50px' }}
                type='number'
                value={stakeAmountInHuman}
                variant='outlined'
              />
            </Grid>
            <Grid container sx={{ height: '160px' }}>
              {!zeroBalanceAlert && token &&
                <Grid container item justifyContent='flex-end' sx={{ px: '30px' }} xs={12}>

                  <Grid item sx={{ fontSize: 12 }}>
                    {t('Max')}{': ~ '}
                    <MuiButton onClick={handleMaxStakeClicked} variant='text'>
                      <ShowBalance2 api={api} balance={maxStakeable} />
                    </MuiButton>
                  </Grid>
                </Grid>
              }
              <Grid container item sx={{ fontSize: 13, fontWeight: '600', p: '15px 30px 5px', textAlign: 'center' }} xs={12}>
                {alert &&
                  <Grid item xs={12}>
                    <Alert severity='error' sx={{ fontSize: 12 }}>
                      {alert}
                    </Alert>
                  </Grid>
                }
              </Grid>
              {myPool?.member?.poolId && myPool?.bondedPool?.state?.toLowerCase() !== 'destroying'
                ? <Grid item sx={{ color: grey[500], fontSize: 12, textAlign: 'center' }} xs={12}>
                  {t('You are staking in "{{poolName}}" pool (index: {{poolId}}).', { replace: { poolId: myPool.member.poolId, poolName: myPool.metadata ?? 'no name' } })}
                </Grid>
                : <Grid item sx={{ color: grey[500], fontSize: 12, textAlign: 'center' }} xs={12}>
                  {t('"{{poolName}}" pool is in {{state}} state, hence can not stake anymore.',
                    { replace: { poolId: myPool.member.poolId, poolName: myPool.metadata ?? 'no name', state: myPool?.bondedPool?.state } })}
                </Grid>
              }
            </Grid>
            <Grid item sx={{ px: '10px' }} xs={12}>
              <NextStepButton
                data-button-action='next to stake'
                isDisabled={nextToStakeButtonDisabled}
                onClick={handleNextToStake}
              >
                {nextButtonCaption}
              </NextStepButton>
            </Grid>
          </>
      }
      {showCreatePoolModal && nextPoolId &&
        <CreatePool
          api={api}
          chain={chain}
          handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
          nextPoolId={nextPoolId}
          poolStakingConsts={poolStakingConsts}
          setCreatePoolModalOpen={setCreatePoolModalOpen}
          setNewPool={setNewPool}
          setStakeAmount={setStakeAmount}
          setState={setState}
          showCreatePoolModal={showCreatePoolModal}
          staker={staker}
        />
      }
      {showJoinPoolModal && poolsInfo &&
        <JoinPool
          api={api}
          chain={chain}
          handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
          poolStakingConsts={poolStakingConsts}
          poolsInfo={poolsInfo}
          poolsMembers={poolsMembers}
          setJoinPoolModalOpen={setJoinPoolModalOpen}
          setPool={setNewPool}
          setStakeAmount={setStakeAmount}
          setState={setState}
          showJoinPoolModal={showJoinPoolModal}
          staker={staker}
        />
      }
    </>
  );
}
