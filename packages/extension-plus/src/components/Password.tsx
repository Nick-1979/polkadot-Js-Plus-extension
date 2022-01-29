// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CheckRounded, Clear } from '@mui/icons-material';
import { Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import React from 'react';

import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { PASS_MAP } from '../util/constants';

interface Props {
  handleClearPassword: () => void;
  password: string;
  passwordStatus: number;
  handleSavePassword: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleIt: () => void;
  isDisabled?: boolean;
  autofocus?: boolean;
}

export default function Password({ autofocus = false, handleClearPassword, handleIt, handleSavePassword, isDisabled = false, password, passwordStatus }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid item sx={{ m: 1 }} xs={12}>
      <TextField
        InputLabelProps={{
          shrink: true
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                onClick={handleClearPassword}
              >
                {password !== '' ? <Clear /> : ''}
              </IconButton>
            </InputAdornment>
          ),
          startAdornment: (
            <InputAdornment position='start'>
              {passwordStatus === PASS_MAP.CORRECT ? <CheckRounded color='success' /> : ''}
            </InputAdornment>
          ),
          style: { fontSize: 16 }
        }}
        autoFocus={autofocus}
        color='warning'
        disabled={isDisabled}
        error={passwordStatus === PASS_MAP.INCORRECT}
        fullWidth
        helperText={passwordStatus === PASS_MAP.INCORRECT ? t('Password is not correct') : t('Please enter the account password')}
        label={t('Password')}
        onChange={handleSavePassword}
        onKeyPress={(event) => {
          if (event.key === 'Enter') { handleIt(); }
        }}
        size='medium'
        type='password'
        value={password}
        variant='outlined'
      />
    </Grid>
  );
}
