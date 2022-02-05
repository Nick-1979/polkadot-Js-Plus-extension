// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Grid, Button as MuiButton } from '@mui/material';
import React, { } from 'react';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import {StopCircle as StopCircleIcon} from '@mui/icons-material';
import { Button, NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { AccountsBalanceType, StakingConsts, ValidatorsName, Validators } from '../../util/plusTypes';
import { Chain } from '../../../../extension-chains/src/types';
import ValidatorsList from './ValidatorsList';
import { Progress } from '../../components';

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
}

export default function NominatedValidators({ activeValidator, chain, nominatedValidators, currentlyStakedInHuman, handleSelectValidatorsModaOpen, stakingConsts, state, validatorsInfo, staker, validatorsName, noNominatedValidators }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      {nominatedValidators?.length && stakingConsts && !noNominatedValidators
        ? <Grid container>
          <Grid item sx={{ paddingBottom: '20px' }} xs={12}>
            <ValidatorsList
              chain={chain}
              staker={staker}
              activeValidator={activeValidator}
              stakingConsts={stakingConsts}
              validatorsInfo={nominatedValidators}
              validatorsName={validatorsName}
            />
          </Grid>
          <Grid container item justifyContent='space-between' sx={{ padding: '20px 10px 0px' }} xs={12}>
            <Grid item xs={5}>
              <MuiButton startIcon={<StopCircleIcon />} color='warning' onClick={() => { }} size='large' variant='text'>
                {t('Stop nominating')}
              </MuiButton>
            </Grid>
            <Grid item xs={6}>
              <NextStepButton
                data-button-action='Change Nominated Validators'
                isBusy={validatorsInfo && state === 'changeValidators'}
                // isDisabled={}
                onClick={handleSelectValidatorsModaOpen}
              >
                {t('Change validators').toUpperCase()}
              </NextStepButton>
            </Grid>
          </Grid>
        </Grid>
        : !noNominatedValidators
          ? <Progress title={'Loading ...'} />
          : <Grid container justifyContent='center'>
            <Grid sx={{ fontSize: 13, margin: '60px 10px 30px', textAlign: 'center' }} xs={12}>
              {t('No nominated validators found.')}
            </Grid>
            <Grid item>
              {Number(currentlyStakedInHuman) > 0 &&
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
