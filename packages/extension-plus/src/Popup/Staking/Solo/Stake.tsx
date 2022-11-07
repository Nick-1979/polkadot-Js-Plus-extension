// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 * render stake tab in easy staking component 
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { Alert, Box, Button as MuiButton, FormControl, FormControlLabel, FormLabel, Grid, InputAdornment, Radio, RadioGroup, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { MIN_EXTRA_BOND } from '../../../util/constants';
import { AccountsBalanceType, StakingConsts } from '../../../util/plusTypes';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../../util/plusUtils';

interface Props {
  api: ApiPromise | undefined;
  nextToStakeButtonBusy: boolean;
  nominatedValidators: DeriveStakingQuery[] | null;
  setStakeAmount: React.Dispatch<React.SetStateAction<bigint>>
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker?: AccountsBalanceType;
  state: string;
  ledger: StakingLedger | null;
  stakingConsts: StakingConsts | undefined;
  handleConfirmStakingModalOpen: () => void;
  handleSelectValidatorsModalOpen: (arg0?: boolean) => void;
}

export default function Stake({ api, handleConfirmStakingModalOpen, handleSelectValidatorsModalOpen, ledger, nextToStakeButtonBusy, nominatedValidators, setStakeAmount, setState, staker, stakingConsts, state }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<string>('');
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>();
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);
  const [validatorSelectionType, setValidatorSelectionType] = useState<string>('Auto');
  const [minStakeable, setMinStakeable] = useState<number>(0);
  const [maxStake, setMaxStake] = useState<number>(0);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');

  const decimals = api && api.registry.chainDecimals[0];
  const token = api && api.registry.chainTokens[0];

  useEffect(() => {
    decimals && setStakeAmount(amountToMachine(stakeAmountInHuman, decimals));
  }, [decimals, setStakeAmount, stakeAmountInHuman]);

  useEffect(() => {
    if (!staker?.balanceInfo?.available) { return; }

    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker, staker?.balanceInfo?.available]);

  const handleStakeAmountInput = useCallback((value: string): void => {
    setAlert('');

    if (value && Number(value) < minStakeable) {
      setAlert(t(`Staking amount is too low, it must be at least ${minStakeable} ${token}`));
    }

    if (Number(value) > maxStake && Number(value) < Number(availableBalanceInHuman)) {
      setAlert(t('Your account may be reaped!'));
    }

    setStakeAmountInHuman(fixFloatingPoint(value));
  }, [availableBalanceInHuman, maxStake, minStakeable, t, token]);

  const handleStakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(value);
  }, [handleStakeAmountInput]);

  const handleValidatorSelectionType = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setValidatorSelectionType(event.target.value);
    // setConfirmStakingModalOpen(false);
  }, [setValidatorSelectionType]);

  const handleNextToStake = useCallback((): void => {
    if (Number(stakeAmountInHuman) >= minStakeable) {
      switch (validatorSelectionType) {
        case ('Auto'):
          handleConfirmStakingModalOpen();
          if (!state) setState('stakeAuto');
          break;
        case ('Manual'):
          handleSelectValidatorsModalOpen();
          if (!state) setState('stakeManual');
          break;
        case ('KeepNominated'):
          handleConfirmStakingModalOpen();
          if (!state) setState('stakeKeepNominated');
          break;
        default:
          console.log('unknown validatorSelectionType !!');
      }
    }
  }, [stakeAmountInHuman, minStakeable, validatorSelectionType, handleConfirmStakingModalOpen, state, setState, handleSelectValidatorsModalOpen]);

  useEffect(() => {
    if (!stakingConsts || !decimals) return;
    const ED = Number(amountToHuman(stakingConsts?.existentialDeposit.toString(), decimals));
    let max = Number(fixFloatingPoint(Number(availableBalanceInHuman) - 2 * ED));
    let min = Number(amountToHuman(stakingConsts?.minNominatorBond, decimals));

    if (Number(ledger?.active)) { // TODO: check if it is below minNominatorBond
      min = MIN_EXTRA_BOND;
    }

    if (min > max) {
      min = max = 0;
    }

    setMaxStake(max);
    setMinStakeable(min);
  }, [availableBalanceInHuman, ledger, stakingConsts, decimals]);

  useEffect(() => {
    if (stakeAmountInHuman && minStakeable <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman) <= maxStake) {
      setNextToStakeButtonDisabled(false);
    }
  }, [minStakeable, maxStake, stakeAmountInHuman]);

  useEffect(() => {
    if (!decimals) { return; }

    if (!staker?.balanceInfo?.available) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    setNextButtonCaption(t('Next'));

    const balanceIsInsufficient = staker?.balanceInfo?.available <= amountToMachine(stakeAmountInHuman, decimals);

    if (balanceIsInsufficient || !Number(stakeAmountInHuman)) {
      setNextToStakeButtonDisabled(true);
    }

    if (Number(stakeAmountInHuman) && balanceIsInsufficient) {
      setNextButtonCaption(t('Insufficient Balance'));
    }

    if (Number(stakeAmountInHuman) && Number(stakeAmountInHuman) < minStakeable) {
      setNextToStakeButtonDisabled(true);
    }
  }, [stakeAmountInHuman, t, minStakeable, staker?.balanceInfo?.available, decimals]);

  const handleMinStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(minStakeable));
  }, [handleStakeAmountInput, minStakeable]);

  const handleMaxStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(maxStake));
  }, [handleStakeAmountInput, maxStake]);

  const ValidatorSelectionRadionButtons = () => (
    <FormControl fullWidth>
      <Grid alignItems='center' container justifyContent='center'>
        <Grid item sx={{ fontSize: 12 }} xs={3}>
          <FormLabel sx={{ fontSize: 12, fontWeight: '500', color: 'black' }}>{t('Validator selection')}:</FormLabel>
        </Grid>
        <Grid item sx={{ textAlign: 'right' }} xs={9}>
          <RadioGroup defaultValue='Auto' onChange={handleValidatorSelectionType} row value={validatorSelectionType}>
            <FormControlLabel
              control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
              label={
                <Box fontSize={12}> {t('Auto')}
                  <Box component='span' sx={{ color: 'gray' }}>
                    ({t('best return')})
                  </Box>
                </Box>
              }
              value='Auto'
            />
            <FormControlLabel
              control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
              label={<Box fontSize={12}> {t('Manual')} </Box>}
              sx={{ fontSize: 12 }}
              value='Manual'
            />
            <FormControlLabel
              control={<Radio disabled={!nominatedValidators?.length} sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
              label={
                <Box fontSize={12}>
                  {t('Keep nominated')}
                </Box>}
              sx={{ fontSize: 12 }}
              value='KeepNominated'
            />
          </RadioGroup>
        </Grid>
      </Grid>
    </FormControl>
  );

  return (
    <>
      <Grid item sx={{ p: '10px 30px 0px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
          autoFocus
          color='warning'
          error={zeroBalanceAlert}
          fullWidth
          helperText={zeroBalanceAlert ? t('No available fund to stake') : ''}
          inputProps={{ step: '.01' }}
          label={t('Amount')}
          name='stakeAmount'
          onChange={handleStakeAmount}
          placeholder='0.0'
          sx={{ height: '50px' }}
          type='number'
          value={stakeAmountInHuman}
          variant='outlined'
        />
      </Grid>
      <Grid container sx={{ height: '128px' }}>
        <Grid container item xs={12}>
          {!zeroBalanceAlert && token &&
            <Grid container item justifyContent='space-between' sx={{ px: '30px' }} xs={12}>
              <Grid item sx={{ fontSize: 12 }}>
                {t('Min')}:
                <MuiButton onClick={handleMinStakeClicked} variant='text'>
                  {`${minStakeable} ${token}`}
                </MuiButton>
              </Grid>
              <Grid item sx={{ fontSize: 12 }}>
                {t('Max')}{': ~ '}
                <MuiButton onClick={handleMaxStakeClicked} variant='text'>
                  {`${maxStake} ${token}`}
                </MuiButton>
              </Grid>
            </Grid>
          }
          <Grid container item sx={{ fontSize: 13, fontWeight: '600', textAlign: 'center', p: '15px 30px 5px' }} xs={12}>
            {alert &&
              <Grid item xs={12}>
                <Alert severity='error' sx={{ fontSize: 12 }}>
                  {alert}
                </Alert>
              </Grid>
            }
          </Grid>
        </Grid>
      </Grid>
      <Grid item justifyContent='center' sx={{ textAlign: 'center' }} xs={12}>
        <ValidatorSelectionRadionButtons />
      </Grid>
      <Grid item sx={{ px: '10px' }} xs={12}>
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
    </>
  );
}
