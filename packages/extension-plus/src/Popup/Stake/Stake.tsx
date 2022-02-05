// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Alert, Box, Button as MuiButton, FormControl, FormControlLabel, FormLabel, Grid, InputAdornment, Radio, RadioGroup, TextField } from '@mui/material';
import React, {  } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';

interface Props {
  zeroBalanceAlert: boolean,
  handleStakeAmount: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  stakeAmountInHuman: string;
  minStakeable: string;
  coin: string;
  maxStake: string;
  handleMinStakeClicked: () => void;
  handleMaxStakeClicked: () => void;
  alert: string;
  handleValidatorSelectionType: (event: React.ChangeEvent<HTMLInputElement>) => void;
  validatorSelectionType: string;
  nextToStakeButtonDisabled: boolean;
  nextToStakeButtonBusy: boolean;
  handleNextToStake: () => void;
  nextButtonCaption: string;
  nominatedValidators: DeriveStakingQuery[];
}

export default function Stake({ alert, coin, handleNextToStake, validatorSelectionType, nominatedValidators, zeroBalanceAlert, maxStake, nextButtonCaption, nextToStakeButtonDisabled, nextToStakeButtonBusy, handleStakeAmount, handleMinStakeClicked, handleValidatorSelectionType, handleMaxStakeClicked, stakeAmountInHuman, minStakeable }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container>
      <Grid item sx={{ padding: '10px 30px 0px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          error={zeroBalanceAlert}
          fullWidth
          helperText={zeroBalanceAlert ? t('Available balance is zero.') : ''}
          inputProps={{ step: '.01' }}
          label={t('Amount')}
          name='stakeAmount'
          onChange={handleStakeAmount}
          placeholder='0.0'
          type='number'
          value={stakeAmountInHuman}
          variant='outlined'
        />
      </Grid>
      {!zeroBalanceAlert &&
        <Grid container item justifyContent='space-between' sx={{ padding: '0px 30px 10px' }} xs={12}>
          <Grid item sx={{ fontSize: 12 }}>
            {minStakeable &&
              <>
                {t('Min')}  :
                <MuiButton onClick={handleMinStakeClicked} variant='text'>
                  {`${minStakeable} ${coin}`}
                </MuiButton>
              </>
            }
          </Grid>
          <Grid item sx={{ fontSize: 12 }}>
            {maxStake &&
              <>
                {t('Max')}:
                <MuiButton onClick={handleMaxStakeClicked} variant='text'>
                  {`${maxStake} ${coin}`}
                </MuiButton>
              </>
            }
          </Grid>
        </Grid>
      }
      <Grid container item sx={{ fontSize: 13, fontWeight: '600', textAlign: 'center', padding: '5px 30px 5px' }} xs={12}>
        {alert
          ? <Grid item xs={12}>
            <Alert severity='error' sx={{ fontSize: 12 }}>
              {alert}
            </Alert>
          </Grid>
          : <Grid item sx={{ paddingTop: '45px' }} xs={12}></Grid>
        }
      </Grid>
      <Grid item justifyContent='center' sx={{ textAlign: 'center' }} xs={12}>
        <FormControl fullWidth>
          <Grid alignItems='center' container justifyContent='center'>
            <Grid item sx={{ fontSize: 12 }} xs={3}>
              <FormLabel sx={{ fontSize: 12, fontWeight: '500', color: 'black' }}>{t('Validator selection')}:</FormLabel>
            </Grid>
            <Grid item sx={{ textAlign: 'right' }} xs={9}>
              <RadioGroup
                defaultValue='Auto'
                onChange={handleValidatorSelectionType}
                row
                value={validatorSelectionType}
              >
                <FormControlLabel
                  control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
                  label={
                    <Box fontSize={12}>
                      {t('Auto')}
                      <Box component='span' sx={{ color: 'gray' }}>
                        {t('best return')}
                      </Box>
                    </Box>}
                  value='Auto'
                />
                <FormControlLabel
                  control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
                  label={
                    <Box fontSize={12}>
                      {t('Manual')}
                    </Box>}
                  sx={{ fontSize: 12 }}
                  value='Manual'
                />
                {nominatedValidators &&
                  <FormControlLabel
                    control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
                    label={
                      <Box fontSize={12}>
                        {t('Keep nominated')}
                      </Box>}
                    sx={{ fontSize: 12 }}
                    value='KeepNominated'
                  />
                }
              </RadioGroup>
            </Grid>
          </Grid>
        </FormControl>
      </Grid>
      <Grid item sx={{ padding: '20px 10px 0px' }} xs={12}>
        <Grid item xs={12}>
          <NextStepButton
            data-button-action='next to stake'
            isBusy={nextToStakeButtonBusy}
            isDisabled={nextToStakeButtonDisabled}
            onClick={handleNextToStake}
          >
            {nextButtonCaption}
          </NextStepButton>
        </Grid>
      </Grid>
    </Grid>
  );

}
