// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Alert, Button as MuiButton, Grid, InputAdornment, TextField } from '@mui/material';
import React, { } from 'react';
import type { StakingLedger } from '@polkadot/types/interfaces';

import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';

interface Props {
  alert: string;
  coin: string;
  handleUnstakeAmount: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  unstakeAmountInHuman: string;
  currentlyStakedInHuman: string;
  ledger: StakingLedger | null;
  handleMaxUnstakeClicked: () => void;
  nextToUnStakeButtonDisabled: boolean;
  nextToUnStakeButtonBusy: boolean;
  handleNextToUnstake: () => void;
}

export default function Unstake({ alert, coin, currentlyStakedInHuman, unstakeAmountInHuman, nextToUnStakeButtonBusy, handleUnstakeAmount, handleNextToUnstake, nextToUnStakeButtonDisabled, ledger, handleMaxUnstakeClicked }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container title='Unstake'>
      <Grid item sx={{ padding: '10px 30px 0px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
          autoFocus
          color='info'
          error={!currentlyStakedInHuman || Number(unstakeAmountInHuman) > Number(currentlyStakedInHuman)}
          fullWidth
          helperText={currentlyStakedInHuman === null
            ? t('Fetching data from blockchain ...')
            : (Number(currentlyStakedInHuman) === 0 && t('Nothing to unstake'))
          }
          inputProps={{ step: '.01' }}
          label={t('Amount')}
          name='unstakeAmount'
          onChange={handleUnstakeAmount}
          placeholder='0.0'
          type='number'
          value={unstakeAmountInHuman}
          variant='outlined'
        />
      </Grid>
      {/* {!!ledger?.total && */}
      <Grid container item justifyContent='flex-end' sx={{ padding: '0px 30px 10px' }} xs={12}>
        <Grid item sx={{ fontSize: 12 }}>
          {!!ledger?.active &&
            <>
              {t('Max')}:
              <MuiButton
                onClick={handleMaxUnstakeClicked}
                variant='text'
              >
                {`${String(currentlyStakedInHuman)} ${coin}`}
              </MuiButton>
            </>
          }
        </Grid>
      </Grid>
      {/* } */}
      <Grid container item sx={{ fontSize: 13, fontWeight: '600', padding: '5px 30px 5px', textAlign: 'center' }} xs={12}>
        {alert
          ? <Grid item xs={12}>
            <Alert severity='error' sx={{ fontSize: 12 }}>
              {alert}
            </Alert>
          </Grid>
          : <Grid item sx={{ paddingTop: '45px' }} xs={12}></Grid>
        }
      </Grid>
      <Grid item sx={{ padding: '50px 10px 0px' }} xs={12}>
        <NextStepButton
          data-button-action='next to unstake'
          isBusy={nextToUnStakeButtonBusy}
          isDisabled={nextToUnStakeButtonDisabled}
          onClick={handleNextToUnstake}
        >
          {t('Next')}
        </NextStepButton>
      </Grid>
    </Grid>
  );

}
