// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo.ts';

async function getStackingConsts (_chain) {
  try {
    const { api, decimals } = await getChainInfo(_chain);

    const maxNominations = api.consts.staking.maxNominations.toHuman();
    const maxNominatorRewardedPerValidator = api.consts.staking.maxNominatorRewardedPerValidator.toHuman();
    const existentialDeposit = api.consts.balances.existentialDeposit;//.toHuman();
    const bondingDuration = api.consts.staking.bondingDuration.toHuman();
    const minNominatorBond = await api.query.staking.minNominatorBond();

    // console.log('maxNominations in worker:', maxNominations);
    // console.log('maxNominatorRewardedPerValidator:', maxNominatorRewardedPerValidator);
    console.log('existentialDeposit in worker:', existentialDeposit);

    return {
      bondingDuration: bondingDuration,
      existentialDeposit: Number(existentialDeposit) / (10 ** decimals),
      maxNominations: maxNominations,
      maxNominatorRewardedPerValidator: maxNominatorRewardedPerValidator,
      minNominatorBond: Number(minNominatorBond) / (10 ** decimals)
    };
  } catch (error) {
    console.log('something went wrong while getStackingConsts ');

    return null;
  }
}

onmessage = (e) => {
  const { chain } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getStackingConsts(chain).then((consts) => {
    console.log('StackingConsts in worker: %o', consts);
    postMessage(consts);
  });
};
