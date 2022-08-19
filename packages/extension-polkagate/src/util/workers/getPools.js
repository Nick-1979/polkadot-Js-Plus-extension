// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function getPools(endpoint) {
  const api = await getApi(endpoint);

  const lastPoolId = await api.query.nominationPools.lastPoolId();

  console.log('gepools for lastPoolId.toNumber()', lastPoolId.toNumber());

  if (!lastPoolId) { 
    return null;
  }

  const queries = [];

  for (let poolId = 1; poolId <= lastPoolId.toNumber(); poolId++) {
    queries.push(Promise.all([
      api.query.nominationPools.metadata(poolId),
      api.query.nominationPools.bondedPools(poolId),
      api.query.nominationPools.rewardPools(poolId)
    ]));
  }

  const info = await Promise.all(queries);

  const poolsInfo = info.map((i, index) => {
    if (i[1].isSome) {
      return {
        bondedPool: i[1].isSome ? i[1].unwrap() : null,
        metadata: i[0]?.length
          ? i[0]?.isUtf8
            ? i[0]?.toUtf8()
            : i[0]?.toString()
          : null,
        poolId: index + 1,
        rewardPool: i[2]?.isSome ? i[2].unwrap() : null
      };
    } else {
      return undefined; 
    }
  })?.filter((f) => f !== undefined);

  return JSON.stringify({ info: poolsInfo, nextPoolId: lastPoolId.addn(1).toString() });
}

onmessage = (e) => {
  const { endpoint } = e.data;

  // eslint-disable-next-line no-void
  void getPools(endpoint).then((poolsInfo) => {
    postMessage(poolsInfo);
  });
};
