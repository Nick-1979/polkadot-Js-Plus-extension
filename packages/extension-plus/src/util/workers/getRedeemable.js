// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo.ts';

async function getRedeemable (_chain, _stashAccountId) {
  console.log(`getRedeemable is called for ${_stashAccountId}`);

  const { api } = await getChainInfo(_chain);

  const stakingAccount = await api.derive.staking.account(_stashAccountId);

  if (!stakingAccount?.redeemable?.gtn(0)) {
    return null;
  }

  console.log('stakingAccount.redeemable', String(stakingAccount.redeemable));

  return JSON.stringify(stakingAccount);//, { forceUnit: '-', withSi: false }, decimals);
}

onmessage = (e) => {
  const { address, chain } = e.data;

  // eslint-disable-next-line no-void
  void getRedeemable(chain, address).then((redeemable) => {
    postMessage(redeemable);
  });
};
