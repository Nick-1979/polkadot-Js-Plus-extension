// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 *  this component shows some general staking informathion including minNominatorBond, maxNominatorRewardedPerValidator, etc.
 * */

import { Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import { ApiPromise } from '@polkadot/api';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { ShowBalance2, ShowValue } from '../../../components';
import { StakingConsts } from '../../../util/plusTypes';

interface Props {
  api: ApiPromise | undefined;
  stakingConsts: StakingConsts | undefined;
  minNominated: bigint | undefined;
  currentEraIndex: number | undefined;
}

function InfoTab({ api, currentEraIndex, minNominated, stakingConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const token = api && api.registry.chainTokens[0];

  return (
    <Grid container data-testid='info' sx={{ paddingTop: '15px', textAlign: 'center' }}>
      <Grid sx={{ color: grey[600], fontSize: 15, fontWeight: '600' }} xs={12}>
        {t('Welcome to Staking')}
      </Grid>
      <Grid sx={{ fontSize: 11, pt: '5px', pb: 2 }} xs={12}>
        {t('Information you need to know about')}
        <Divider light />
      </Grid>
      <Grid container item sx={{ px: '5px' }} xs={12}>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowValue title={t('Maximum validators you can select: ')} value={stakingConsts?.maxNominations} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowBalance2 api={api} balance={stakingConsts?.minNominatorBond} direction='row' title={t('Minimum {{symbol}}s to be a staker (threshold): ', { replace: { symbol: token } })} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowBalance2 api={api} balance={minNominated} direction='row' title={t('Minimum {{symbol}}s to recieve rewards today (era: {{eraIndex}}):', { replace: { symbol: token, eraIndex: currentEraIndex } })} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowValue title={t('Maximum nominators of a validator, who may receive rewards: ')} value={stakingConsts?.maxNominatorRewardedPerValidator} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowValue title={t('Days it takes to receive your funds back after unstaking:  ')} unit={t('days')} value={stakingConsts?.unbondingDuration} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowBalance2 api={api} balance={stakingConsts?.existentialDeposit} direction='row' title={t('Minimum {{symbol}}s that must remain in your account (ED): ', { replace: { symbol: token } })} />
        </Grid>
      </Grid>
    </Grid>
  );
}

export default React.memo(InfoTab);
