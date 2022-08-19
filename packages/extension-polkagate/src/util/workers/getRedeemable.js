// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function getRedeemable (stashAccountId, endpoint) {
  console.log(`getRedeemable is called for ${stashAccountId} endpoint:${endpoint}`);

  const api = await getApi(endpoint);

  const stakingAccount = await api.derive.staking.account(stashAccountId);

  if (!stakingAccount?.redeemable?.gtn(0)) {
    return null;
  }

  return JSON.stringify(stakingAccount);//, { forceUnit: '-', withSi: false }, decimals);
}

onmessage = (e) => {
  const { address, endpoint } = e.data;

  // eslint-disable-next-line no-void
  void getRedeemable(address, endpoint).then((redeemable) => {
    postMessage(redeemable);
  });
};
