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
    height: '31px',
    fontWeight: 400,
    fontSize: '16px',
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
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>;
  address: string | undefined;
}

export default function CustomizedTextField({ address, setAddress }: Props) {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) =>
      setAddress(value.trim()),
    [setAddress]
  );

  return (
    <CssTextField
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <IconButton
              onClick={() => setAddress('')}
            >
              {address !== null ? <ClearIcon sx={{ fontSize: '13px' }} /> : ''}
            </IconButton>
          </InputAdornment>
        ),
        startAdornment: (
          <InputAdornment position='start' sx={{ ml: '4px' }}>
            {isValidAddress(address) ? <CheckRoundedIcon sx={{ fontSize: '15px' }} /> : ''}
          </InputAdornment>
        ),
        // style: { fontSize: 14 }
      }}
      fullWidth
      onChange={_onChange}
      // placeholder={t('Search, Public address')}
      size='small'
      type='string'
      value={address ?? ''}
      // variant='outlined'
      color='primary'
      sx={{ pt: '6px' }}
    />
  );
}
