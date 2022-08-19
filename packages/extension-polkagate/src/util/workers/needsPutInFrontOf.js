// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function needsPutInFrontOf(endpoint, target) {
  console.log(` needsPutInFrontOf is running for ${target}`);

  const api = await getApi(endpoint);
  const at = await api.rpc.chain.getFinalizedHead();
  const apiAt = await api.at(at);

  const targetAccount = api.createType('AccountId', target);
  const unwrappedTargetCtrl = await apiAt.query.staking.bonded(targetAccount);
  const targetCtrl = unwrappedTargetCtrl.isSome ? unwrappedTargetCtrl.unwrap() : undefined;

  if (!targetCtrl) {
    // account does not have staked yet

    return undefined;
  }

  const renameConsistentApi = apiAt.query?.bagsList || apiAt.query?.voterList;

  const targetWeight = api.createType('Balance', (await apiAt.query.staking.ledger(targetCtrl)).unwrapOrDefault().active);
  const unWrappedTargetNode = await renameConsistentApi.listNodes(targetCtrl);
  const targetNode = unWrappedTargetNode.isSome ? unWrappedTargetNode.unwrap() : undefined;

  if (!targetNode) {
    // account probably has done stopNominated
    return undefined;
  }

  const targetBag = (await renameConsistentApi.listBags(targetNode.bagUpper)).unwrap();

  let lighterUnwrapped = targetBag.head;

  while (lighterUnwrapped.isSome) {
    const mayLighter = lighterUnwrapped.unwrap();

    if (mayLighter.eq(targetAccount)) {
      console.log('No lighter ');

      return undefined;
    }

    const mayLighterCtrl = (await apiAt.query.staking.bonded(mayLighter)).unwrap();
    const mayLighterWeight = api.createType('Balance', (await apiAt.query.staking.ledger(mayLighterCtrl)).unwrapOrDefault().active);

    // console.log(` ${mayLighterCtrl}  : ${mayLighterWeight.toHuman()}`);

    if (mayLighterWeight.lt(targetWeight)) {
      return mayLighter?.toHuman();
    }

    lighterUnwrapped = (await renameConsistentApi.listNodes(mayLighter)).unwrap().next;
  }

  return undefined;
}

onmessage = (e) => {
  const { endpoint, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void needsPutInFrontOf(endpoint, stakerAddress).then((lighter) => {
    postMessage(lighter);
  });
};
