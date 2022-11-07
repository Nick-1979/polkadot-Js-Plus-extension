// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  shows a simple address text box or an address selection box depending on the value of addresesOnThisChain
*/

import { NoAccounts as NoAccountsIcon } from '@mui/icons-material';
import { Autocomplete, Avatar, Grid, SxProps, TextField, Theme } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { NameAddress } from '../../util/plusTypes';
import isValidAddress from '../../util/validateAddress';

interface Props {
  autoFocus?: boolean;
  chain: Chain;
  addresesOnThisChain?: NameAddress[];
  label: string;
  address: string | undefined;
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>
  style?: SxProps<Theme>;
}

export default function AddressTextBox({ addresesOnThisChain, address, autoFocus = true, style = {}, chain, label, setAddress }: Props) {
  const { t } = useTranslation();

  const handleAddress = useCallback((value: string | null) => {
    if (!value) {
      setAddress(undefined);

      return;
    }

    const indexOfDots = value?.indexOf(':');
    let mayBeAddress: string | undefined = value?.slice(indexOfDots + 1)?.trim();

    mayBeAddress = mayBeAddress && isValidAddress(mayBeAddress) ? mayBeAddress : undefined;

    if (mayBeAddress) {
      setAddress(mayBeAddress);
    }
  }, [setAddress]);

  const handleAutoComplateChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    handleAddress(value);
  }, [handleAddress]);

  const handleInputChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: string) => {
    setAddress(value);
  }, [setAddress]);

  return (
    <Grid alignItems='center' container sx={style}>
      <Grid item xs>
        <Autocomplete
          ListboxProps={{ sx: { fontSize: 12 } }}
          // defaultValue={address}
          freeSolo
          inputValue={address}
          onChange={handleAutoComplateChange}
          onInputChange={handleInputChange}
          options={addresesOnThisChain?.map((option) => `${option?.name} :    ${option.address}`)}
          // eslint-disable-next-line react/jsx-no-bind
          renderInput={(params) =>
            <TextField
              {...params}
              InputLabelProps={{ style: { fontSize: 16 } }}
              autoFocus={autoFocus}
              // error={!address}
              label={label}
              placeholder={t('Enter the address of your account')}
            />
          }
          sx={{ '& .MuiAutocomplete-input, & .MuiInputLabel-root': { fontSize: 13 } }}
        />
      </Grid>
      <Grid item sx={{ pt: '5px', pl: '5px' }} xs={1.2}>
        <Avatar alt={'logo'} sx={{ height: 38, width: 38 }} >
          {isValidAddress(address)
            ? <Identicon
              prefix={chain?.ss58Format ?? 42}
              size={38}
              theme={chain?.icon || 'polkadot'}
              value={address}
            />
            : <NoAccountsIcon sx={{ color: grey[400], fontSize: 46 }} />
          }
        </Avatar>
      </Grid>
    </Grid>
  );
}
