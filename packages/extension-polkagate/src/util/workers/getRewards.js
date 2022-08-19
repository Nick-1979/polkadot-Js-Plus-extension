// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo';

async function getRewards (_chain, _stakerAddress) {
  console.log(` rewards worker is called for ${_stakerAddress}`);

  const { api } = await getChainInfo(_chain);
  const rewards = await api.derive.staking.stakerRewards(_stakerAddress, true);
  const nonEmptyRewards = rewards.filter((e) => !e.isEmpty);

  console.log('rewards in worker:', JSON.parse(JSON.stringify(rewards)));

  return nonEmptyRewards?.map((ne) => {
    let rewardInEra = 0n;

    for (const validator in ne.validators) {
      rewardInEra += ne.validators[validator]?.value?.toBigInt() || 0n;
    }

    return { era: ne.era.toNumber(), reward: rewardInEra };
  });
}

onmessage = (e) => {
  const { chain, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void getRewards(chain, stakerAddress).then((myRewards) => {
    postMessage(myRewards);
  });
};
