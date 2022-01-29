// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { Chain } from '@polkadot/extension-chains/types';

import getChainInfo from '../getChainInfo';

export default async function getCurrentBlockNumber(_chain: Chain | string): Promise<number> {
  const { api } = await getChainInfo(_chain);
  const currentBlockNumber = await api.rpc.chain.getHeader();

  console.log(`currentBlockNumber:${currentBlockNumber.number}`);

  return Number(currentBlockNumber.number);
}
