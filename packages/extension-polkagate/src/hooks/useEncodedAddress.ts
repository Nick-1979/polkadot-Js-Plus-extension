// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { useContext, useMemo } from 'react';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Chain } from '../../../extension-chains/src/types';
import { AccountContext, SettingsContext } from '../../../extension-ui/src/components/contexts';

export default function useEncodedAddress(address: string, chain: Chain): string {
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);

  const encodedAddress = useMemo(() => {
    const prefix: number = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    if (prefix !== undefined) {
      const selectedAddressJson = accounts.find((acc) => acc.address === address);

      if (!selectedAddressJson) {
        throw new Error(' address not found in accounts!');
      }

      const publicKey = decodeAddress(selectedAddressJson.address);

      return encodeAddress(publicKey, prefix);
    }

    return '';
  }, [accounts, chain, address, settings]);

  return encodedAddress;
}
