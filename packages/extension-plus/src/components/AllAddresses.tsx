// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';

import Identicon from '@polkadot/react-identicon';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { AccountContext, SettingsContext } from '../../../extension-ui/src/components/contexts';
import useMetadata from '../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { Chain } from '../../../extension-chains/src/types';

interface Props {
  chain: Chain;
  setSelectedAddress: React.Dispatch<React.SetStateAction<string>>;
  selectedAddress: string;
  text:string;
}

export default function AllAddresses({ chain, selectedAddress, setSelectedAddress, text }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const [allAddresesOnThisChain, setAllAddresesOnThisChain] = useState<string[]>([]);
//   const chain = useMetadata(genesisHash, true);

  function showAlladdressesOnThisChain(prefix: number): void {
    const allAddresesOnSameChain = accounts.map((acc): string => {
      const publicKey = decodeAddress(acc.address);

      return encodeAddress(publicKey, prefix);
    });

    setAllAddresesOnThisChain(allAddresesOnSameChain);
  };

  useEffect(() => {
    const prefix: number = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    if (prefix !== undefined) { showAlladdressesOnThisChain(prefix); }
  }, [chain, settings]);

  useEffect(() => {
    if (allAddresesOnThisChain.length) { setSelectedAddress(allAddresesOnThisChain[0]); }
  }, [allAddresesOnThisChain]);

  const handleAddressChange = (event: SelectChangeEvent) => {
    setSelectedAddress(event.target.value);
  };

  return (
    <Grid container sx={{ padding: '20px 40px 0px' }}>
      <FormControl fullWidth>
        <InputLabel id='selec-address'>{t('Account')}</InputLabel>
        <Select value={selectedAddress}
          label='Select address'
          onChange={handleAddressChange}
          sx={{ height: 50 }}

        >
          {allAddresesOnThisChain?.map((address) => (
            <MenuItem key={address} value={address}>
              <Grid container alignItems='center' justifyContent='space-between'>
                <Grid item>
                  <Identicon
                    size={25}
                    theme={'polkadot'}
                    value={address}
                  />
                </Grid>
                <Grid item sx={{ fontSize: 13 }}>
                  {address}
                </Grid>
              </Grid>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormHelperText>{text}</FormHelperText>
    </Grid>
  );
}
