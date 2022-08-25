// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useState } from 'react';

const CssTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    height: '52px',
    fontWeight: 400,
    fontSize: '26px',
    letterSpacing: '-0.015em',
    padding: 0,
    '& fieldset': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.secondary.main,
    }
  }
}));

interface Props {
  setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  value: string | undefined;
}

export default function CustomizedTextField({ setValue, value }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);

  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) =>
      setValue(value.trim()),
    [setValue]
  );

  return (
    <CssTextField
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <IconButton
              aria-label='toggle password visibility'
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )
      }}
      autoComplete='off'
      color='primary'
      fullWidth
      onChange={_onChange}
      size='small'
      sx={{ pt: '6px' }}
      type={showPassword ? 'text' : 'password'}
    />
  );
}
