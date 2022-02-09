// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { StopCircle as StopCircleIcon, TrackChanges as TrackChangesIcon } from '@mui/icons-material';
import { Button as MuiButton,Grid } from '@mui/material';
import React, { } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import { AccountsBalanceType, StakingConsts, Validators,ValidatorsName } from '../../util/plusTypes';
import ValidatorsList from './ValidatorsList';

interface Props {
  activeValidator: DeriveStakingQuery;
  currentlyStakedInHuman: string;
  nominatedValidators: DeriveStakingQuery[];
  stakingConsts: StakingConsts;
  noNominatedValidators: boolean;
  chain: Chain;
  staker: AccountsBalanceType;
  validatorsName: ValidatorsName[];
  validatorsInfo: Validators;
  state: string;
  handleSelectValidatorsModaOpen: () => void;
  handleStopNominating: () => void;
}

export default function Nominations({ activeValidator, chain, currentlyStakedInHuman, handleSelectValidatorsModaOpen, handleStopNominating, noNominatedValidators, nominatedValidators, staker, stakingConsts, state, validatorsInfo, validatorsName }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      {nominatedValidators?.length && stakingConsts && !noNominatedValidators
        ? <Grid container>
          <Grid item sx={{ paddingBottom: '20px' }} xs={12}>
            <ValidatorsList
              activeValidator={activeValidator}
              chain={chain}
              staker={staker}
              stakingConsts={stakingConsts}
              validatorsInfo={nominatedValidators}
              validatorsName={validatorsName}
            />
          </Grid>
          <Grid container item justifyContent='space-between' sx={{ padding: '20px 10px 0px' }} xs={12}>
            <Grid item xs={5}>
              <MuiButton startIcon={<StopCircleIcon />} sx={{ color: 'black' }} onClick={handleStopNominating} size='medium' variant='text'>
                {t('Stop nominating')}
              </MuiButton>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <MuiButton
                color='warning'
                onClick={handleSelectValidatorsModaOpen}
                size='medium'
                startIcon={<TrackChangesIcon />}
                variant='text'>
                {t('Change validators')}
              </MuiButton>
            </Grid>
          </Grid>
        </Grid>
        : !noNominatedValidators
          ? <Progress title={'Loading ...'} />
          : <Grid container justifyContent='center'>
            <Grid sx={{ fontSize: 13, margin: '60px 10px 30px', textAlign: 'center' }} xs={12}>
              {t('No nominated validators found')}
            </Grid>
            <Grid item>
              {Number(currentlyStakedInHuman) > stakingConsts?.minNominatorBond &&
                <NextStepButton
                  data-button-action='Set Nominees'
                  isBusy={validatorsInfo && state === 'changeValidators'}
                  // isDisabled={}
                  onClick={handleSelectValidatorsModaOpen}
                >
                  {t('Set nominees')}
                </NextStepButton>
              }
            </Grid>
          </Grid>
      }
    </>
  );
}
