// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  shows a simple address text box or an address selection box depending on the value of addresesOnThisChain
*/

import CameraIcon from '@mui/icons-material/Camera';
import { Avatar, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useCallback, useState } from 'react';

import getLogo from '../../util/getLogo';

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

export default function SelectChain({ defaultValue, label, onChange, options }: Props): React.ReactElement<Props> {
  const [chainName, setChainName] = useState<string | undefined>();

  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
      onChange && onChange(value.trim());
      const chainName = options.find((o) => o.value === value)?.text?.trim()?.split(' ')[0];

      setChainName(chainName);
    },
    [onChange, options]
  );

  return (
    <Grid alignItems='center' container>
      <Grid item xs>
        <FormControl
          // variant='standard'
          sx={{ width: '100%' }}>
          <InputLabel
            htmlFor='selectChain'
          // sx={{ transformOrigin: 'left bottom', fontWeight: 300, letterSpacing: '-0.015em' }}
          >
            {label}
          </InputLabel>
          <Select
            defaultValue={defaultValue}
            id='selectChain'
            label={label}
            // input={<BootstrapInput />}
            onChange={_onChange}
          // sx={{ width: '100%', height: 31 }}
          // value={defaultValue}
          >
            {options.map(({ text, value }): React.ReactNode => (
              <MenuItem key={value} sx={{ fontSize: '14px', fontWeight: 300, letterSpacing: '-0.015em' }} value={value}>
                {text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item container justifyContent='center' xs={2}>
        <Avatar
          alt={'logo'}
          src={getLogo(chainName)}
          sx={{ height: 38, width: 38 }}
        >
          {!chainName && <CameraIcon />}
        </Avatar>
      </Grid>
    </Grid >
  );
}
