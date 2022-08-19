// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { MAX_NOMINATIONS } from '../constants';
import getApi from '../getApi.ts';

async function getStackingConsts(endpoint) {
  try {
    const api = await getApi(endpoint);
    const at = await api.rpc.chain.getFinalizedHead();
    const apiAt = await api.at(at);
    const maxNominations = apiAt.consts.staking.maxNominations?.toNumber() || MAX_NOMINATIONS;
    const maxNominatorRewardedPerValidator = apiAt.consts.staking.maxNominatorRewardedPerValidator.toNumber();
    const existentialDeposit = apiAt.consts.balances.existentialDeposit.toString();
    const bondingDuration = apiAt.consts.staking.bondingDuration.toNumber();
    const sessionsPerEra = apiAt.consts.staking.sessionsPerEra.toNumber();
    const epochDuration = apiAt.consts.babe.epochDuration.toNumber();
    const expectedBlockTime = api.consts.babe.expectedBlockTime.toNumber();
    const epochDurationInHours = epochDuration * expectedBlockTime / 3600000; // 1000miliSec * 60sec * 60min
    const minNominatorBond = await apiAt.query.staking.minNominatorBond();

    return {
      existentialDeposit: BigInt(existentialDeposit),
      maxNominations,
      maxNominatorRewardedPerValidator,
      minNominatorBond: BigInt(minNominatorBond),
      unbondingDuration: bondingDuration * sessionsPerEra * epochDurationInHours / 24 // unboundingDuration in days
    };
  } catch (error) {
    console.log('something went wrong while getStackingConsts. err: ' + error);

    return null;
  }
}

onmessage = (e) => {
  const { endpoint } = e.data;

  getStackingConsts(endpoint)
    .then((consts) => {
      console.log(`StackingConsts in worker using:${endpoint}: %o`, consts);
      postMessage(consts);
    }).catch(console.error);
};
