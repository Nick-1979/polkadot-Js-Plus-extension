// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { ThemeProps } from '../../../../../extension-ui/src/types';
import type { AccountsBalanceType, MembersMapEntry, PoolInfo, PoolStakingConsts } from '../../../util/plusTypes';

import { SettingsAccessibility as SettingsAccessibilityIcon } from '@mui/icons-material';
import { Button, Grid, InputAdornment, Paper, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

import { BackButton, NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress, ShowBalance2 } from '../../../components';
import { PREFERED_POOL_NAME } from '../../../util/constants';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../../util/plusUtils';
import Pool from './Pool';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  chain: Chain;
  className?: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  showJoinPoolModal: boolean;
  staker: AccountsBalanceType;
  setJoinPoolModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleConfirmStakingModalOpen: () => void;
  setPool: React.Dispatch<React.SetStateAction<PoolInfo | undefined>>
  poolStakingConsts: PoolStakingConsts | undefined;
  poolsInfo: PoolInfo[];
  setStakeAmount: React.Dispatch<React.SetStateAction<BN>>
  poolsMembers: MembersMapEntry[] | undefined
}

function JoinPool({ api, chain, poolsInfo, poolsMembers, className, setStakeAmount, poolStakingConsts, setPool, handleConfirmStakingModalOpen, setState, setJoinPoolModalOpen, showJoinPoolModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const defaultPool = useMemo((): PoolInfo | undefined => poolsInfo?.find((p) => p?.metadata?.includes(PREFERED_POOL_NAME) && String(p?.bondedPool?.state) === 'Open'), [poolsInfo]);

  const [alert, setAlert] = useState<string | undefined>();
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>('0');
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [minStakeable, setMinStakeable] = useState<number>(0);
  const [maxStakeable, setMaxStakeable] = useState<number>(0);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [estimatedMaxFee, setEstimatedMaxFee] = useState<Balance | undefined>();
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | undefined>(defaultPool);
  const ref = useRef();
  const openPools = useMemo(() => poolsInfo?.filter((p) => String(p?.bondedPool?.state) === 'Open' && p?.poolId !== selectedPool?.poolId), [poolsInfo, selectedPool?.poolId]);

  const decimals = api ? api.registry.chainDecimals[0] : 1;
  const token = api ? api.registry.chainTokens[0] : '';
  const existentialDeposit = useMemo(() => api ? new BN(api.consts.balances.existentialDeposit.toString()) : BN_ZERO, [api]);
  const realStakingAmount = useMemo(() => {
    const amount = new BN(String(amountToMachine(stakeAmountInHuman, decimals)));

    return amount.lt(BN_ZERO) ? BN_ZERO : amount;
  }, [decimals, stakeAmountInHuman]);// an ED goes to rewardId

  useEffect(() => {
    if (!decimals) { return; }

    if (Number(stakeAmountInHuman) && minStakeable <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman) <= maxStakeable) {
      setNextToStakeButtonDisabled(false);
    } else {
      setNextToStakeButtonDisabled(true);
    }

    const balanceIsInsufficient = !!staker?.balanceInfo?.available && staker?.balanceInfo?.available <= amountToMachine(stakeAmountInHuman, decimals);

    if (balanceIsInsufficient || !Number(stakeAmountInHuman)) {
      setNextToStakeButtonDisabled(true);
    }

    if (Number(stakeAmountInHuman) && balanceIsInsufficient) {
      setAlert(t('Insufficient Balance'));
    }
  }, [minStakeable, maxStakeable, stakeAmountInHuman, decimals, staker?.balanceInfo?.available, t]);

  useEffect(() => {
    decimals && setStakeAmount(realStakingAmount);
  }, [decimals, realStakingAmount, setStakeAmount]);

  useEffect(() => {
    if (!realStakingAmount) { return; }

    api && api.tx.nominationPools.join(String(realStakingAmount), selectedPool?.poolId ?? 1).paymentInfo(staker.address).then((i) => {
      setEstimatedFee(api.createType('Balance', i?.partialFee));
    });

    api && api.tx.nominationPools.join(String(staker?.balanceInfo?.available ?? realStakingAmount), selectedPool?.poolId ?? 1).paymentInfo(staker.address).then((i) => {
      setEstimatedMaxFee(api.createType('Balance', i?.partialFee));
    });
  }, [api, staker.address, realStakingAmount, selectedPool, staker?.balanceInfo?.available]);

  useEffect(() => {
    if (!poolStakingConsts || !decimals || existentialDeposit === undefined || !estimatedMaxFee || !staker?.balanceInfo?.available) { return; }

    const max = new BN(staker.balanceInfo.available.toString()).sub(existentialDeposit.muln(2)).sub(new BN(estimatedMaxFee));
    const min = poolStakingConsts.minJoinBond;

    let maxInHuman = Number(amountToHuman(max.toString(), decimals));
    let minInHuman = Number(amountToHuman(min.toString(), decimals));

    if (min.gt(max)) {
      const temp = api ? api.createType('Balance', min).toHuman() : min;

      setAlert(t('Balance isn\'t enough to join pool (min: {{min}} plus fee)!', { replace: { min: temp } }));
      minInHuman = maxInHuman = 0;
    }

    setMaxStakeable(maxInHuman);
    setMinStakeable(minInHuman);
  }, [api, availableBalanceInHuman, poolStakingConsts, decimals, existentialDeposit, staker?.balanceInfo?.available, t, estimatedMaxFee]);

  useEffect(() => {
    poolsInfo?.length && selectedPool && setPool(selectedPool);
  }, [setPool, poolsInfo, selectedPool]);

  useEffect(() => {
    if (!staker?.balanceInfo?.available) { return; }

    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker, staker?.balanceInfo?.available]);

  const handlePoolStakingModalClose = useCallback(() => {
    setJoinPoolModalOpen(false);
    setState('');
  }, [setJoinPoolModalOpen, setState]);

  const handleStakeAmountInput = useCallback((value: string): void => {
    setAlert('');

    if (value && Number(value) < minStakeable) {
      setAlert(t(`Staking amount is too low, it must be at least ${minStakeable} ${token}`));
    }

    if (Number(value) > maxStakeable && Number(value) < Number(availableBalanceInHuman)) {
      setAlert(t('Your account may be reaped!'));
    }

    setStakeAmountInHuman(fixFloatingPoint(value));
  }, [availableBalanceInHuman, maxStakeable, minStakeable, t, token]);

  const handleMinStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(minStakeable));
  }, [handleStakeAmountInput, minStakeable]);

  const handleMaxStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(maxStakeable));
  }, [handleStakeAmountInput, maxStakeable]);

  const handleStakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(value);
  }, [handleStakeAmountInput]);

  const handleSelectPool = useCallback((pool: PoolInfo) => {
    setSelectedPool(pool);
    ref.current.scrollTop = 0;
  }, []);

  return (
    <>
      <Popup handleClose={handlePoolStakingModalClose} showModal={showJoinPoolModal}>
        <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<SettingsAccessibilityIcon fontSize='small' />} title={'Join Pool'} />
        <Grid container sx={{ pt: 2 }}>
          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, p: '5px 35px 1px' }}>
            <Grid item sx={{ pr: '5px' }} xs={9}>
              <TextField
                InputLabelProps={{ shrink: true }}
                InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
                color='warning'
                fullWidth
                inputProps={{ step: '.01', style: { padding: '12px' } }}
                label={t('Amount')}
                name='stakeAmount'
                onChange={handleStakeAmount}
                placeholder='0.0'
                type='number'
                value={stakeAmountInHuman}
                variant='outlined'
              />
            </Grid>
            <Grid alignItems='center' color={grey[500]} container item justifyContent='space-between' sx={{ fontSize: 11 }} xs>
              <Grid item>
                {t('Fee')}:
              </Grid>
              <Grid item>
                <ShowBalance2 api={api} balance={estimatedFee} />
              </Grid>
            </Grid>
          </Grid>
          {maxStakeable === 0
            ? <Grid item sx={{ color: 'red', fontSize: 12, height: '40px', p: '0px 40px 25px' }} xs={12}>
              {alert}
            </Grid>
            : <Grid container item justifyContent='space-between' sx={{ height: '40px', p: '0px 25px 10px 40px' }} xs={9}>
              <Grid item sx={{ fontSize: 12 }}>
                {t('Min')}:
                <Button aria-label='min' onClick={handleMinStakeClicked} sx={{ p: '0px 0px 6px 8px' }} variant='text'>
                  {minStakeable}
                </Button>
              </Grid>
              <Grid item sx={{ fontSize: 12 }}>
                {t('Max')}{': ~ '}
                <Button aria-label='max' onClick={handleMaxStakeClicked} sx={{ p: '0px 0px 6px 8px' }} variant='text'>
                  {maxStakeable}
                </Button>
              </Grid>
            </Grid>
          }
          <Grid item sx={{ p: '20px 20px 0px' }} xs={12}>
            <Grid item sx={{ color: grey[600], fontSize: 16, p: '0px 50px 5px', textAlign: 'center' }} xs={12}>
              {t('Choose a pool to join')}
            </Grid>
            <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', py: '5px', width: '100%' }}>
              <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('More')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('Index')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={4}>
                  {t('Name')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={3}>
                  {t('Staked')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={2}>
                  {t('Members')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('Choose')}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid container item ref={ref} sx={{ scrollBehavior: 'smooth', height: '270px', overflowY: 'auto', p: '5px 20px 5px', scrollbarWidth: 'none', width: '100%' }}>
            {selectedPool &&
              <Grid container item sx={{ fontSize: 11, pt: '5px' }}>
                <Pool api={api} chain={chain} pool={selectedPool} poolsMembers={poolsMembers} selectedPool={selectedPool} handleSelectPool={handleSelectPool} showCheck={true} showHeader={false} />
              </Grid>
            }
            {openPools?.length
              ? openPools.map((p, i) =>
                <Grid container item key={i} sx={{ fontSize: 11, pt: '5px' }}>
                  <Pool api={api} chain={chain} index={i} pool={p} poolsMembers={poolsMembers} selectedPool={selectedPool} handleSelectPool={handleSelectPool} showCheck={true} showHeader={false} />
                </Grid>)
              : <Progress title={t('Loading ...')} />
            }
          </Grid>
          <Grid container item sx={{ p: '20px 24px' }} xs={12}>
            <Grid item xs={1}>
              <BackButton onClick={handlePoolStakingModalClose} />
            </Grid>
            <Grid item sx={{ pl: 1 }} xs>
              <NextStepButton
                data-button-action='next to stake'
                // isBusy={nextToStakeButtonBusy}
                isDisabled={nextToStakeButtonDisabled}
                onClick={handleConfirmStakingModalOpen}
              >
                {t('Next')}
              </NextStepButton>
            </Grid>
          </Grid>

        </Grid>
      </Popup>
    </>
  );
}

export default styled(JoinPool)`
      height: calc(100vh - 2px);
      overflow: auto;
      scrollbar - width: none;

      &:: -webkit - scrollbar {
        display: none;
      width:0,
       }
      .empty-list {
        text - align: center;
  }`;
