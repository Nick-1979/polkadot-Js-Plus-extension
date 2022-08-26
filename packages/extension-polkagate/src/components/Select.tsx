// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import FormControl from '@mui/material/FormControl';
import InputBase from '@mui/material/InputBase';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import NativeSelect from '@mui/material/NativeSelect';
import Select from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import React, { useCallback } from 'react';

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(3),
    fontWeight: '300',
    fontSize: '10px',
    letterSpacing: '-0.015em'
  },
  '& .MuiInputBase-input': {
    borderRadius: 0,
    // position: 'relative',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.primary.main}`,
    fontSize: '14px',
    fontWeight: '300',
    letterSpacing: '-0.015em',
    padding: '5px 10px 0px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:focus': {
      // borderRadius: 4,
      borderColor: theme.palette.secondary.main,
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)'
    }
  }
}));

interface DropdownOption {
  text: string;
  value: string;
}


interface Props {
  defaultValue: string | undefined;
  onChange?: (value: string) => void;
  options: DropdownOption[];
  label: string;
}

export default function CustomizedSelect({ defaultValue, label, onChange, options }: Props) {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) =>
      onChange && onChange(value.trim()),
    [onChange]
  );

  return (
    <FormControl variant='standard' sx={{ width: '100%' }}>
      <InputLabel
        htmlFor='selectChain'
        variant='standard'
        sx={{ transformOrigin: 'left bottom', fontWeight: 300, letterSpacing: '-0.015em' }}

      >
        {label}
      </InputLabel>
      <Select
        defaultValue={defaultValue}
        id='selectChain'
        input={<BootstrapInput />}
        onChange={_onChange}
        sx={{ width: '100%', height: 31 }}
      // value={defaultValue}
      >
        {options.map(({ text, value }): React.ReactNode => (
          <MenuItem key={value} sx={{ fontSize: '14px', fontWeight: 300, letterSpacing: '-0.015em' }} value={value}>
              {text}
          </MenuItem>
        ))}
      </Select>
    </FormControl >
  );
}
