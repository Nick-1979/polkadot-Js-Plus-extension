// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { BN } from '@polkadot/util';

import getApi from '../getApi.ts';

async function getPoolStackingConsts(endpoint) {
  try {
    const api = await getApi(endpoint);
    const at = await api.rpc.chain.getFinalizedHead();
    const apiAt = await api.at(at);

    const [maxPoolMembers, maxPoolMembersPerPool, maxPools, minCreateBond, minJoinBond, minNominatorBond, lastPoolId] =
      await Promise.all([
        apiAt.query.nominationPools.maxPoolMembers(),
        apiAt.query.nominationPools.maxPoolMembersPerPool(),
        apiAt.query.nominationPools.maxPools(),
        apiAt.query.nominationPools.minCreateBond(),
        apiAt.query.nominationPools.minJoinBond(),
        apiAt.query.staking.minNominatorBond(),
        apiAt.query.nominationPools.lastPoolId()
      ]);

    return {
      lastPoolId: BigInt(lastPoolId),
      maxPoolMembers: maxPoolMembers.isSome ? maxPoolMembers.unwrap().toNumber() : -1,
      maxPoolMembersPerPool: maxPoolMembersPerPool.isSome ? maxPoolMembersPerPool.unwrap().toNumber() : -1,
      maxPools: maxPools.isSome ? maxPools.unwrap().toNumber() : -1,
      minCreateBond: BigInt(minCreateBond),
      minJoinBond: BigInt(minJoinBond),
      minNominatorBond: BigInt(minNominatorBond)
    };
  } catch (error) {
    console.log('something went wrong while getStackingConsts. err: ' + error);

    return null;
  }
}

onmessage = (e) => {
  const { endpoint } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getPoolStackingConsts(endpoint).then((consts) => {
    console.log(`poolStackingConsts in worker using:${endpoint}: %o`, consts);
    postMessage(consts);
  });
};
