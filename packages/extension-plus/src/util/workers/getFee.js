// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo';

async function getFee (_senderKeyring, _receiverAddress, _amount, _chain) {
  const { api, decimals } = await getChainInfo(_chain);

  const transferValue = _amount * BigInt(10 ** decimals);

  const info = await api.tx.balances
    .transfer(_receiverAddress, transferValue)
    .paymentInfo(_senderKeyring);

  console.log(`
  class=${info.class.toString()},
  weight=${info.weight.toString()},
  partialFee=${info.partialFee},
  partialFeeInHuman=${info.partialFee.toHuman()}
`);

  return info.partialFee.toString();
}

onmessage = (e) => {
  const { amount, chain, receiverAddress, senderKeyring } = e.data;

  // eslint-disable-next-line no-void
  void getFee(senderKeyring, receiverAddress, amount, chain).then((fee) => {
    postMessage(fee);
  });
};
