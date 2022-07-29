// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows some general staking informathion including minNominatorBond, maxNominatorRewardedPerValidator, etc.
 * */

import type { PoolStakingConsts } from '../../../util/plusTypes';

import { Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useMemo } from 'react';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { ShowBalance2, ShowValue } from '../../../components';

interface Props {
  api: ApiPromise | undefined;
  info: PoolStakingConsts | undefined;
}

function InfoTab({ api, info }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const token = api && api.registry.chainTokens[0];

  return (
    <Grid container data-testid='info' sx={{ paddingTop: '15px', textAlign: 'center' }}>
      <Grid sx={{ color: grey[600], fontSize: 15, fontWeight: '600' }} xs={12}>
        {t('Welcome to pool Staking')}
      </Grid>
      <Grid sx={{ fontSize: 11, pt: '5px', pb: 2 }} xs={12}>
        {t('Information you need to know about')}
        <Divider light />
      </Grid>
      <Grid container item sx={{ p: '15px 5px' }} xs={12}>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowBalance2 api={api} balance={info?.minJoinBond} direction='row' title={`${t('Minimum {{token}}s needed to join a pool', { replace: { token: token } })}:`} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowBalance2 api={api} balance={info?.minCreationBond} direction='row' title={`${t('Minimum {{token}}s needed to create a pool', { replace: { token: token } })}:`} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowValue title={`${t('The number of currenttly existing pools')}:`} value={info?.lastPoolId?.toString()} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowValue title={`${t('Maximum possible pools')}:`} value={info?.maxPools === -1 ? t('unlimited') : info?.maxPools} />
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <ShowValue title={`${t('Maximum possible pool members')}:`} value={info?.maxPoolMembers === -1 ? t('unlimited') : info?.maxPoolMembers} />
        </Grid>
        {info && info?.maxPoolMembersPerPool !== -1 &&
          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            <ShowValue title={`${t('Maximum pool members per pool')}:`} value={info?.maxPoolMembersPerPool} />
          </Grid>
        }
        {/* <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200],fontSize: 12, paddingBottom: '5px' }} xs={12}>
            <ShowBalance2 api={api} balance={info?.minNominatorBond} title={`${t('Minimum nominator bond')}:`}/>
        </Grid> */}
      </Grid>
    </Grid>
  );
}

export default React.memo(InfoTab);
