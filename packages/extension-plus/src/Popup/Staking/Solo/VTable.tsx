// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description render a table which is used to show validators info 
 * */
import { Box, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { StakingConsts } from '../../../util/plusTypes';
import ShowValidator from './ShowValidator';

interface Props {
  api: ApiPromise;
  activeValidator?: DeriveStakingQuery;
  chain: Chain;
  validators: DeriveStakingQuery[];
  stakingConsts: StakingConsts | undefined;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  setInfo: React.Dispatch<React.SetStateAction<DeriveStakingQuery | null>>;
  setShowValidatorInfoModal: React.Dispatch<React.SetStateAction<boolean>>;
  height?: number;
}

export default function VTable({ activeValidator, api, chain, height = 180, setInfo, setShowValidatorInfoModal, stakingConsts, validators, validatorsIdentities }: Props) {
  const { t } = useTranslation();

  const handleMoreInfo = useCallback((info: DeriveStakingQuery) => {
    setShowValidatorInfoModal(true);
    setInfo(info);
  }, [setInfo, setShowValidatorInfoModal]);

  return (
    <>
      <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 15px 5px' }}>
        <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
          <Grid alignItems='center' item xs={1}>
            {t('More')}
          </Grid>
          <Grid item sx={{ textAlign: 'left' }} xs={6}>
            {t('Identity')}
          </Grid>
          <Grid item sx={{ textAlign: 'left' }} xs={2}>
            {t('Staked')}
          </Grid>
          <Grid item sx={{ textAlign: 'left' }} xs={1}>
            {t('Comm.')}
          </Grid>
          <Grid item sx={{ textAlign: 'center' }} xs={2}>
            {t('Nominators')}
          </Grid>
        </Grid>
      </Paper>
      <Box sx={{ bgcolor: 'background.paper', height: height, overflowY: 'auto', scrollbarWidth: 'none', width: '100%' }}>
        <Grid id='body' item xs={12}>
          {validators.slice().map((v, index) =>
            <ShowValidator
              activeValidator={activeValidator}
              api={api}
              chain={chain}
              handleMoreInfo={handleMoreInfo}
              key={index}
              showSocial={false}
              stakingConsts={stakingConsts}
              t={t}
              validator={v}
              validatorsIdentities={validatorsIdentities}
            />
          )}
        </Grid>
      </Box>
    </>
  );
}
