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
import type { AccountsBalanceType, MyPoolInfo, PoolStakingConsts } from '../../../util/plusTypes';

import { Pool as PoolIcon } from '@mui/icons-material';
import { Button, Divider, Grid, InputAdornment, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';

import { BackButton, NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { AddressInput, PlusHeader, Popup, ShowBalance2 } from '../../../components';
import { EXTENSION_NAME } from '../../../util/constants';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  chain: Chain;
  className?: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  showCreatePoolModal: boolean;
  staker: AccountsBalanceType;
  setCreatePoolModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  nextPoolId: BN;
  handleConfirmStakingModalOpen: () => void;
  setNewPool: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>
  poolStakingConsts: PoolStakingConsts | undefined;
  setStakeAmount: React.Dispatch<React.SetStateAction<BN>>
}

function CreatePool({ api, chain, nextPoolId, className, setStakeAmount, poolStakingConsts, setNewPool, handleConfirmStakingModalOpen, setState, setCreatePoolModalOpen, showCreatePoolModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [alert, setAlert] = useState<string | undefined>();
  const [poolName, setPoolName] = useState<string>(`${EXTENSION_NAME}-${nextPoolId}`);
  const [rootId, setRootId] = useState<string>(staker.address);
  const [nominatorId, setNominatorId] = useState<string>(staker.address);
  const [stateTogglerId, setStateTogglerId] = useState<string>(staker.address);
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>('0');
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [minStakeable, setMinStakeable] = useState<number>(0);
  const [maxStakeable, setMaxStakeable] = useState<number>(0);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [estimatedMaxFee, setEstimatedMaxFee] = useState<Balance | undefined>();
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);

  const decimals = api ? api.registry.chainDecimals[0] : 1;
  const token = api ? api.registry.chainTokens[0] : '';
  const existentialDeposit = useMemo(() => api ? new BN(api.consts.balances.existentialDeposit.toString()) : BN_ZERO, [api]);
  const realStakingAmount = useMemo(() => {
    const amount = new BN(String(amountToMachine(stakeAmountInHuman, decimals))).sub(existentialDeposit);

    return amount.lt(BN_ZERO) ? BN_ZERO : amount;
  }, [decimals, existentialDeposit, stakeAmountInHuman]);// an ED goes to rewardId

  useEffect(() => {
    if (stakeAmountInHuman && minStakeable <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman) <= maxStakeable) {
      setNextToStakeButtonDisabled(false);
    } else {
      setNextToStakeButtonDisabled(true);
    }
  }, [minStakeable, maxStakeable, stakeAmountInHuman]);

  useEffect(() => {
    if (!decimals) {
      return;
    }

    const balanceIsInsufficient = staker?.balanceInfo?.available && staker.balanceInfo.available <= amountToMachine(stakeAmountInHuman, decimals);

    if (balanceIsInsufficient || !Number(stakeAmountInHuman)) {
      setNextToStakeButtonDisabled(true);
    }

    if (Number(stakeAmountInHuman) && balanceIsInsufficient) {
      setAlert(t('Insufficient Balance'));
    }

    if (Number(stakeAmountInHuman) && Number(stakeAmountInHuman) < minStakeable) {
      setNextToStakeButtonDisabled(true);
    }
  }, [stakeAmountInHuman, t, minStakeable, staker?.balanceInfo?.available, decimals]);

  useEffect(() => {
    decimals && setStakeAmount(realStakingAmount);
  }, [decimals, realStakingAmount, setStakeAmount]);

  useEffect(() => {
    if (!realStakingAmount) {
      return;
    }

    api && api.tx.nominationPools.create(String(realStakingAmount), rootId, nominatorId, stateTogglerId).paymentInfo(staker.address).then((i) => {
      const createFee = i?.partialFee;

      api.tx.nominationPools.setMetadata(nextPoolId, poolName).paymentInfo(staker.address)
        .then((i) => setEstimatedFee(api.createType('Balance', createFee.add(i?.partialFee))))
        .catch(console.error);
    });

    api && api.tx.nominationPools.create(String(staker?.balanceInfo?.available ?? realStakingAmount), rootId, nominatorId, stateTogglerId).paymentInfo(staker.address).then((i) => {
      const createFee = i?.partialFee;

      api.tx.nominationPools.setMetadata(nextPoolId, poolName).paymentInfo(staker.address)
        .then((i) => setEstimatedMaxFee(api.createType('Balance', createFee.add(i?.partialFee))))
        .catch(console.error);
    });
  }, [api, nextPoolId, nominatorId, poolName, rootId, staker.address, realStakingAmount, stateTogglerId, staker?.balanceInfo?.available]);

  useEffect(() => {
    if (!poolStakingConsts || !decimals || existentialDeposit === undefined || !estimatedMaxFee || !staker?.balanceInfo?.available) {
      return;
    }

    // 3ED: one goes to pool rewardId, 2 others remain as my account ED + some fee (FIXME: ED is lowerthan fee in some chains like KUSAMA)
    const max = new BN(staker.balanceInfo.available.toString()).sub(existentialDeposit.muln(3)).sub(new BN(estimatedMaxFee));
    const min = poolStakingConsts.minCreationBond;

    let maxInHuman = Number(amountToHuman(max.toString(), decimals));
    let minInHuman = Number(amountToHuman(min.toString(), decimals));

    if (min.gt(max)) {
      const temp = api ? api.createType('Balance', min).toHuman() : min;

      setAlert(t('Balance isn\'t enough to create pool (min: {{min}} plus fee)!', { replace: { min: temp } }));
      minInHuman = maxInHuman = 0;
    }

    setMaxStakeable(maxInHuman);
    setMinStakeable(minInHuman);
  }, [api, availableBalanceInHuman, poolStakingConsts, decimals, existentialDeposit, staker?.balanceInfo?.available, t, estimatedMaxFee]);

  useEffect(() => {
    setNewPool({
      bondedPool: {
        memberCounter: 0,
        points: realStakingAmount,
        roles: {
          depositor: staker.address,
          nominator: nominatorId,
          root: rootId,
          stateToggler: stateTogglerId
        },
        state: 'Creating'
      },
      metadata: poolName ?? null,
      poolId: nextPoolId,
      rewardPool: null
    });
  }, [nominatorId, poolName, rootId, setNewPool, staker.address, stateTogglerId, realStakingAmount, nextPoolId]);

  useEffect(() => {
    if (!staker?.balanceInfo?.available) {
      return;
    }

    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker, staker?.balanceInfo?.available]);

  const handlePoolStakingModalClose = useCallback(() => {
    setCreatePoolModalOpen(false);
    setState('');
  }, [setCreatePoolModalOpen, setState]);

  const handleStakeAmountInput = useCallback((value: string): void => {
    setAlert('');

    if (value && Number(value) < minStakeable) {
      setAlert(t(`Staking amount is too low, it must be at least ${minStakeable} ${token}`));
    }

    if (Number(value) > maxStakeable && Number(value) < Number(availableBalanceInHuman)) {
      setAlert(t('Your account might be reaped!'));
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

  return (
    <>
      <Popup handleClose={handlePoolStakingModalClose} showModal={showCreatePoolModal}>
        <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<PoolIcon fontSize='small' />} title={'Create Pool'} />
        <Grid container sx={{ pt: 2 }}>
          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, px: '40px' }}>
            <Grid item sx={{ pr: '5px' }} xs={9}>
              <TextField
                InputLabelProps={{ shrink: true }}
                autoFocus
                color='warning'
                fullWidth
                helperText={''}
                inputProps={{ style: { padding: '12px' } }}
                label={t('Pool name')}
                name='poolName'
                onChange={(e) => setPoolName(e.target.value)}
                placeholder='enter a pool name'
                sx={{ height: '20px' }}
                type='text'
                value={poolName}
                variant='outlined'
              />
            </Grid>
            <Grid item xs>
              <TextField
                InputLabelProps={{ shrink: true }}
                disabled
                fullWidth
                inputProps={{ style: { padding: '12px', textAlign: 'center' } }}
                label={t('Pool Id')}
                name='nextPoolId'
                type='text'
                value={String(nextPoolId)}
                variant='outlined'
              />
            </Grid>
          </Grid>
          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, p: '15px 40px 1px' }}>
            <Grid item sx={{ pr: '5px' }} xs={9}>
              <TextField
                InputLabelProps={{ shrink: true }}
                InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
                color='warning'
                fullWidth
                // error={zeroBalanceAlert}
                inputProps={{ step: '.01', style: { padding: '12px' } }}
                // helperText={zeroBalanceAlert ? t('No available fund to stake') : ''}
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
          <Grid container item spacing={'10px'} sx={{ fontSize: 12, p: '18px 40px 5px' }}>
            <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, pl: '40px', textAlign: 'center' }} xs={12}>
              <Divider textAlign='left'> {t('Roles')}</Divider>
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} disabled freeSolo selectedAddress={staker?.address} title={t('Depositor')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} disabled freeSolo selectedAddress={rootId} setSelectedAddress={setRootId} title={t('Root')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={nominatorId} setSelectedAddress={setNominatorId} title={t('Nominator')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={stateTogglerId} setSelectedAddress={setStateTogglerId} title={t('State toggler')} />
            </Grid>
          </Grid>
          <Grid container item sx={{ p: '10px 34px' }} xs={12}>
            <Grid item xs={1}>
              <BackButton onClick={handlePoolStakingModalClose} />
            </Grid>
            <Grid item sx={{ pl: 1 }} xs>
              <NextStepButton
                data-button-action='next to stake'
                // isBusy={nextToStakeButtonBusy}
                isDisabled={!rootId || !nominatorId || !stateTogglerId || !poolName || nextToStakeButtonDisabled}
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

export default styled(CreatePool)`
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
