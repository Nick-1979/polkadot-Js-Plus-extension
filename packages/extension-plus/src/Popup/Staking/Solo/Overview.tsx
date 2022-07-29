// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */
/* eslint-disable react/jsx-first-prop-new-line */

/**
 * @description
 *  render an overview of current staking state of an account like currently staked/redemmable amount,
 *  total reward received, etc.
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { BarChart as BarChartIcon, MoreVert as MoreVertIcon, Redeem as RedeemIcon } from '@mui/icons-material';
import { Grid, Menu, MenuItem, Paper, Skeleton, Tooltip } from '@mui/material';
import React from 'react';

import { ApiPromise } from '@polkadot/api';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { amountToHuman } from '../../../util/plusUtils';

interface Props {
  availableBalanceInHuman: string,
  api: ApiPromise | undefined;
  ledger: StakingLedger | null;
  redeemable: bigint | null;
  currentlyStakedInHuman: string | null;
  totalReceivedReward: string | undefined;
  handleWithdrowUnbound: () => void;
  handleViewChart: () => void;
  unlockingAmount: bigint;
  rewardsInfo: any | undefined;
}

interface BalanceProps {
  label: string | Element;
  amount: string | null;
  coin: string;
}

function Balance({ amount, coin, label }: BalanceProps): React.ReactElement<BalanceProps> {
  return (<>
    <Grid item sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.8px', lineHeight: '16px' }} xs={12}>
      {label}
    </Grid>
    {amount === null || amount === 'NaN' || amount === undefined
      ? <Skeleton sx={{ display: 'inline-block', fontWeight: '400', lineHeight: '16px', width: '70px' }} />
      : <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', lineHeight: '16px' }}>
        {amount === '0' ? '0.00' : Number(amount).toLocaleString()}{' '}  {coin}
      </div>
    }
  </>);
}

export default function Overview({ api, availableBalanceInHuman, currentlyStakedInHuman, handleViewChart, handleWithdrowUnbound, ledger, redeemable, rewardsInfo, totalReceivedReward, unlockingAmount }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const decimals = api && api.registry.chainDecimals[0];
  const token = api?.registry?.chainTokens[0] ?? '';

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAdvanceMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Paper elevation={4} sx={{ borderRadius: '10px', fontSize: 12, height: 95, margin: '25px 30px 10px', p: 2, width: '90%' }}>
        <Grid container>
          <Grid item sx={{ flexGrow: 1 }}>
            <Grid alignItems='center' container item justifyContent='space-between' sx={{ pb: '20px', textAlign: 'center' }}>
              <Grid item xs={4}>
                <Balance amount={availableBalanceInHuman} coin={token} label={t('Available')} />
              </Grid>
              <Grid item xs={4}>
                <Balance amount={currentlyStakedInHuman} coin={token} label={t('Staked')} />
              </Grid>
            </Grid>
            <Grid container item justifyContent='space-between' sx={{ textAlign: 'center' }}>
              <Grid item xs={4}>
                <Balance amount={totalReceivedReward} coin={token}
                  label={
                    <Grid container item justifyContent='center'>
                      <Grid item>
                        {t('Rewards')}
                      </Grid>
                      <Grid item>
                        <Tooltip id='rewards' placement='top' title={t('View chart')}>
                          <BarChartIcon color={rewardsInfo?.length ? 'warning' : 'disabled'} onClick={handleViewChart} sx={{ cursor: 'pointer', fontSize: 15 }} />
                        </Tooltip>
                      </Grid>
                    </Grid>
                  }
                />
              </Grid>
              <Grid container item justifyContent='center' xs={4}>
                <Grid container item justifyContent='center' xs={12}>
                  <Balance
                    amount={amountToHuman(String(redeemable), decimals)}
                    coin={token}
                    label={
                      <Grid container item justifyContent='center'>
                        <Grid item>
                          {t('Redeemable')}
                        </Grid>
                        <Grid item>
                          <Tooltip placement='top' title={t('Withdraw unbounded')}>
                            <RedeemIcon color={redeemable ? 'warning' : 'disabled'} onClick={handleWithdrowUnbound} sx={{ cursor: 'pointer', fontSize: 15 }} />
                          </Tooltip>
                        </Grid>
                      </Grid>
                    }
                  />
                </Grid>
              </Grid>
              <Grid item xs={4}>
                <Balance amount={amountToHuman(String(unlockingAmount), decimals)} coin={token} label={t('Unstaking')} />
              </Grid>
            </Grid>
          </Grid>
          {/* <Grid alignItems='center' direction='column' item>
            <Tooltip placement='top' title={t('Advanced')}>
              <MoreVertIcon onClick={handleAdvanceMenuClick} sx={{ cursor: 'pointer', fontSize: 15 }} />
            </Tooltip>
          </Grid> */}
        </Grid>
      </Paper>
      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={open}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleClose}  sx={{ fontSize: 12 }}>Set payee</MenuItem>
        <MenuItem onClick={handleClose}  sx={{ fontSize: 12 }}>Set controller</MenuItem>
      </Menu></>
  );
}
