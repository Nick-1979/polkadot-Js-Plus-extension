// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CheckRounded as CheckRoundedIcon, Clear as ClearIcon, ContentPasteGo as ContentPasteGoIcon } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback } from 'react';

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
    fontWeight: 300,
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

  const pastAddress = useCallback(async () => {
    setAddress(await navigator.clipboard.readText());
  }, [setAddress]);

  return (
    <CssTextField
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            {address
              ? <IconButton
                onClick={() => setAddress('')}
              >
                <ClearIcon sx={{ fontSize: '13px' }} />
              </IconButton>
              : <IconButton
                onClick={() => pastAddress('')}
              >
                <ContentPasteGoIcon sx={{ fontSize: '16px', transform: 'scaleX(-1)' }} />
              </IconButton>
            }
          </InputAdornment>
        ),
        startAdornment: (
          <InputAdornment position='start' sx={{ ml: '4px' }}>
            {isValidAddress(address) ? <CheckRoundedIcon sx={{ fontSize: '15px' }} /> : ''}
          </InputAdornment>
        ),
        // style: { fontSize: 14 }
      }}
      autoComplete='off'
      color='primary'
      fullWidth
      // placeholder={t('Search, Public address')}
      onChange={_onChange}
      size='small'
      sx={{ pt: '6px' }}
      // variant='outlined'
      type='string'
      value={address ?? ''}
    />
  );
}
