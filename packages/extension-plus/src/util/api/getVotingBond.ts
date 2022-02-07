// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Chain } from '../../../../extension-chains/src/types';
import getChainInfo from '../getChainInfo';

export default async function getVotingBond(_chain: Chain): Promise<any> {
  const { api } = await getChainInfo(_chain);

  const location = api.consts.elections || api.consts.phragmenElection || api.consts.electionsPhragmen;

  if (!location) return;

  return Promise.all([
    location.votingBondBase,
    location.votingBondFactor // will be muliplied in votes.length
  ]);
}
