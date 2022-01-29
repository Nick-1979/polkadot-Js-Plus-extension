// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo.ts';
import { handleAccountBalance } from '../plusUtils.ts';

async function subscribeToBalance (_address, _chain, _formattedAddress) {
  const { api, coin, decimals } = await getChainInfo(_chain);

  await api.query.system.account(_formattedAddress, ({ data: balance }) => {
    if (balance) {
      const result = {
        coin: coin,
        decimals: decimals,
        ...handleAccountBalance(balance)
      };

      const changes = {
        address: _address,
        balanceInfo: result,
        subscribedChain: _chain
      };

      postMessage(changes);
    }
  });
}

onmessage = (e) => {
  const { address, chain, formattedAddress } = e.data;

  // eslint-disable-next-line no-void
  void subscribeToBalance(address, chain, formattedAddress);
};
