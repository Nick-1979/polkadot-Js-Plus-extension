// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function needsRebag(endpoint, currentAccount) {
  console.log(`needsRebag is running for ${currentAccount}`);

  const api = await getApi(endpoint);
  const at = await api.rpc.chain.getFinalizedHead();
  const apiAt = await api.at(at);

  const unwrappedCurrentCtrl = await apiAt.query.staking.bonded(currentAccount);
  const currentCtrl = unwrappedCurrentCtrl.isSome ? unwrappedCurrentCtrl.unwrap() : undefined;

  if (!currentCtrl) {
    // account does not have staked yet
    return { currentBagThreshold: '0.00 DOT', shouldRebag: false };
  }

  const renameConsistentApi = apiAt.query?.bagsList || apiAt.query?.voterList;

  const currentWeight = api.createType('Balance', (await apiAt.query.staking.ledger(currentCtrl)).unwrapOrDefault().active);
  const unwrapedCurrentNode = await renameConsistentApi.listNodes(currentCtrl);
  const currentNode = unwrapedCurrentNode.isSome ? unwrapedCurrentNode.unwrap() : undefined;

  if (!currentNode) {
    // account probably has done stopNominated
    return { currentBagThreshold: '0.00 DOT', shouldRebag: false };
  }

  const currentUpper = api.createType('Balance', currentNode.bagUpper);

  if (currentWeight.gt(currentUpper)) {
    console.log(`\t ☝️ ${currentAccount} needs a rebag from ${currentUpper.toHuman()} to a higher [real weight = ${currentWeight.toHuman()}]`);

    return { currentBagThreshold: currentUpper.toHuman(), shouldRebag: true };
  } else {
    console.log(`\t ${currentAccount} doesn't need a rebag. Its weight is ${currentWeight.toHuman()} and its upper's weight is ${currentUpper.toHuman()}`);

    return { currentBagThreshold: currentUpper.toHuman(), shouldRebag: false };
  }
}

onmessage = (e) => {
  const { endpoint, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void needsRebag(endpoint, stakerAddress).then((rebag) => {
    postMessage(rebag);
  });
};
