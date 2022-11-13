// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi';

async function isEligibleToFastUnstake(endpoint, stakerAddress) {
  console.log(`fastUnstake eligibility is checking for ${stakerAddress}`);
  const api = await getApi(endpoint);

  const erasToCheck = (await api.query.fastUnstake.erasToCheckPerBlock()).toNumber();

  if (!erasToCheck) {
    return undefined;
  }

  const currentEra = (await api.query.staking.currentEra()).unwrap();

  const erasStakers = await Promise.all(
    [...Array(erasToCheck)].map((_, i) =>
      api.query.staking.erasStakers.entries(currentEra - i)
    )
  );

  return !erasStakers.flat().map((x) => x[1].others).flat().find((x) => String(x.who) === stakerAddress);
}

onmessage = (e) => {
  const { endpoint, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void isEligibleToFastUnstake(endpoint, stakerAddress).then((eligibility) => {
    postMessage(eligibility);
  });
};
