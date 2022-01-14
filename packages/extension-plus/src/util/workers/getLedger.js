// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo.ts';

async function getLedger (_address, _chain) {
  if (!_address) {
    return null;
  }

  const defaultOutput = {
    active: 0n,
    claimedRewards: [],
    stash: '',
    total: 0n,
    unlocking: []
  };

  const { api } = await getChainInfo(_chain);

  const data = await api.query.staking.ledger(_address);

  if (data.toString() == '') {
    return defaultOutput;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(data.toString());
}

onmessage = (e) => {
  const { address, chain } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getLedger(address, chain).then((ledger) => {
    postMessage(ledger);
  });
};
