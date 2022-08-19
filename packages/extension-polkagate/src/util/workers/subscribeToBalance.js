// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';
import { handleAccountBalance } from '../plusUtils.ts';

async function subscribeToBalance (_address, endpoint, _formattedAddress) {
  const api = await getApi(endpoint);

  await api.query.system.account(_formattedAddress, ({ data: balance }) => {
    if (balance) {
      const result = {
        coin: api.registry.chainTokens[0],
        decimals: api.registry.chainDecimals[0],
        ...handleAccountBalance(balance)
      };

      const changes = {
        address: _address,
        balanceInfo: result,
        // subscribedChain: _chain
      };

      postMessage(changes);
    }
  });
}

onmessage = (e) => {
  const { address, endpoint, formattedAddress } = e.data;

  // eslint-disable-next-line no-void
  void subscribeToBalance(address, endpoint, formattedAddress);
};
