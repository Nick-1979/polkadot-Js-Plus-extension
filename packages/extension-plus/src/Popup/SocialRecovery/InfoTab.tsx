// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 *  this component shows some general recovery informathion including maxFriends, configDepositBase, etc.
 * */

import type { ApiPromise } from '@polkadot/api';

import { Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useMemo } from 'react';

import { BN } from '@polkadot/util';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ShowBalance2, ShowValue } from '../../components';
import { RecoveryConsts } from '../../util/plusTypes';

interface Props {
  api: ApiPromise | undefined;
  recoveryConsts: RecoveryConsts | undefined;
}

function InfoTab({ api }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const token = api && api.registry.chainTokens[0];
  const recoveryConsts = useMemo(() => {
    if (!api) {
      return undefined;
    }

    return {
      configDepositBase: api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: api.consts.recovery.recoveryDeposit as unknown as BN
    };
  }, [api]);

  return (
    <Grid container data-testid='info' sx={{ fontFamily: 'sans-serif', paddingTop: '75px', textAlign: 'center' }}>
      <Grid sx={{ color: grey[600], fontSize: 15, fontWeight: '600' }} xs={12}>
        {t('Welcome to social recovery')}
      </Grid>
      <Grid sx={{ fontSize: 11, pt: '5px', pb: 2 }} xs={12}>
        {t('Information you need to know')}
        <Divider light />
      </Grid>
      <Grid container item sx={{ p: '35px 5px' }} xs={12}>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, py: '5px' }} xs={12}>
          <Grid item>
            {t('The base {{token}}s needed to reserve to make an account recoverable', { replace: { token } })}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={recoveryConsts?.configDepositBase} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, py: '5px' }} xs={12}>
          <Grid item>
            {t('{{token}}s needed to be reserved per added friend', { replace: { token } })}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={recoveryConsts?.friendDepositFactor} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, py: '5px' }} xs={12}>
          <Grid item>
            {t('The maximum number of friends allowed in a recovery configuration')}:
          </Grid>
          <Grid item>
            <ShowValue value={recoveryConsts?.maxFriends} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, py: '5px' }} xs={12}>
          <Grid item>
            {t('The base amount of {{token}}s needed to reserve for initiating a recovery', { replace: { token } })}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={recoveryConsts?.recoveryDeposit} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default React.memo(InfoTab);
