// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IconButton, InputAdornment, TextField } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputBase from '@mui/material/InputBase';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import NativeSelect from '@mui/material/NativeSelect';
import Select from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import React, { useCallback } from 'react';
import { ArrowBackIosRounded, CheckRounded as CheckRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';
import { isValidAddress } from '../util/utils';

const CssTextField = styled(TextField)(({ theme }) => ({
  // '& label.Mui-focused': {
  //   color: 'green',
  // },
  // '& .MuiInput-underline:after': {
  //   borderBottomColor: 'green',
  // },
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
    },
    // '&.Mui-focused fieldset': {
    //   borderColor: 'green',
    // },
  },
}));

interface Props {
  setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  value: string | undefined;
  token: string | undefined;
}

export default function CustomizedTextField({ value, setValue, token }: Props) {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) =>
      setValue(value.trim()),
    [setValue]
  );

  return (
    <CssTextField
      InputProps={{
        endAdornment: (
          <InputAdornment position='end' sx={{ pr: '10px', fontweight: 400, fontSize: '18px', letterSpacing: '-0.015em' }}>
            {token ?? ''}
          </InputAdornment>
        )
      }}
      color='primary'
      fullWidth
      onChange={_onChange}
      size='small'
      sx={{ pt: '6px' }}
      // variant='outlined'
      type='string'
      value={value ?? ''}
    />
  );
}
