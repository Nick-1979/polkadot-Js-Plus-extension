// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi';

const bigIntMin = (...args) => args.reduce((m, e) => e < m ? e : m);

async function getNominatorInfo (endpoint, _nominatorAddress) {
  const api = await getApi(endpoint);

  // a map of all nominators
  const assignments = new Map();
  const currentEra = (await api.query.staking.currentEra()).unwrap();
  const stakers = await api.query.staking.erasStakers.entries(currentEra);

  stakers.map((x) => x[1].others).flat().forEach((x) => {
    const nominatorAddress = String(x.who);
    const amount = BigInt(x.value);

    if (assignments.get(nominatorAddress)) {
      assignments.set(nominatorAddress, amount + (assignments.get(nominatorAddress)));
    } else {
      assignments.set(nominatorAddress, amount);
    }
  });

  return {
    isInList: !!assignments.get(_nominatorAddress),
    minNominated: bigIntMin(...assignments.values())
  };
}

onmessage = (e) => {
  const { endpoint, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void getNominatorInfo(endpoint, stakerAddress).then((info) => {
    postMessage(info);
  });
};
