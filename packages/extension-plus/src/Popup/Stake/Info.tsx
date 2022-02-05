// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Box, Grid } from '@mui/material';
import React, { } from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { StakingConsts } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';
import { Progress } from '../../components';

interface Props {
  coin: string;
  decimals: number;
  stakingConsts: StakingConsts;
}

export default function Info({ coin, decimals, stakingConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container sx={{ paddingTop: '20px', textAlign: 'center' }}>
      <Grid sx={{ fontSize: 15 }} xs={12}>
        {t('Welcome to Staking')}
      </Grid>
      <Grid sx={{ fontSize: 12, paddingBottom: '40px' }} xs={12}>
        {t('Information you need to know about')}
      </Grid>
      {stakingConsts
        ? <>
          <Grid sx={{ fontSize: 11, paddingBottom: '5px' }} xs={12}>
            {t('Maximum validators you can select: ')}<Box component='span' sx={{ fontWeight: 'bold' }}>  {stakingConsts?.maxNominations}</Box>
          </Grid>
          <Grid sx={{ fontSize: 11, paddingBottom: '5px' }} xs={12}>
            {t('Minimum')} {coin}s {t('to be a staker: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {stakingConsts?.minNominatorBond}</Box> {coin}s
          </Grid>
          <Grid sx={{ fontSize: 11, paddingBottom: '5px' }} xs={12}>
            {t('Maximum stakers of a validator, who receives rewards: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {stakingConsts?.maxNominatorRewardedPerValidator}</Box>
          </Grid>
          <Grid sx={{ fontSize: 11, paddingBottom: '5px' }} xs={12}>
            {t('Days it takes to receive your funds back after unstaking:  ')}<Box component='span' sx={{ fontWeight: 'bold' }}>  {stakingConsts?.bondingDuration}</Box>  {t('days')}
          </Grid>
          <Grid sx={{ fontSize: 11, paddingBottom: '5px' }} xs={12}>
            {t('Minimum')} {coin}s {t('that must remain in you account: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {amountToHuman(String(stakingConsts?.existentialDeposit), decimals)}</Box> {coin}s {t('plus some fees')}
          </Grid>
        </>
        : <Progress title={'Loading information ...'} />
      }
    </Grid>
  );

}
