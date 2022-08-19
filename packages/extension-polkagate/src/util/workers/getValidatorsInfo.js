// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function getAllValidators (endpoint) {
  console.log('getting validators info from ', endpoint);

  try {
    const api = await getApi(endpoint);

    const at = await api.rpc.chain.getFinalizedHead();
    const apiAt = await api.at(at);
    const [elected, waiting, currentEra] = await Promise.all([

      api.derive.staking.electedInfo({ withController: true, withDestination: true, withExposure: true, withPrefs: true, withNominations: true, withLedger: true }),
      api.derive.staking.waitingInfo({ withController: true, withDestination: true, withExposure: true, withPrefs: true, withNominations: true, withLedger: true }),
      apiAt.query.staking.currentEra()
    ]);
    const nextElectedInfo = elected.info.filter((e) =>
      elected.nextElected.find((n) =>
        String(n) === String(e.accountId)
      ));

    return JSON.parse(JSON.stringify({
      current: nextElectedInfo,
      currentEraIndex: Number(currentEra),
      waiting: waiting.info
    }));
  } catch (error) {
    console.log('something went wrong while getting validators info, err:', error);

    return null;
  }
}

onmessage = (e) => {
  const { endpoint } = e.data;

  // eslint-disable-next-line no-void
  void getAllValidators(endpoint).then((info) => { postMessage(info); });
};
