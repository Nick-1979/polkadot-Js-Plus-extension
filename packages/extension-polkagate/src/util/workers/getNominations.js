// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

// get all nominated/elected validators of an address
export async function getNominations (endpoint, _address) {
  try {
    const api = await getApi(endpoint);
    const at = await api.rpc.chain.getFinalizedHead();
    const apiAt = await api.at(at);
    const nominators = await apiAt.query.staking.nominators(_address);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedNominators = JSON.parse(JSON.stringify(nominators));

    if (!parsedNominators) return null;

    return parsedNominators.targets;
  } catch (error) {
    console.log('something went wrong while getting nominators ', error);

    return null;
  }
}

onmessage = (e) => {
  const { endpoint, stakerAddress } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getNominations(endpoint, stakerAddress).then((targets) => {
    postMessage(targets);
  });
};
