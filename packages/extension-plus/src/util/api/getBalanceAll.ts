// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { Chain } from '@polkadot/extension-chains/types';

import { DeriveBalancesAll } from '@polkadot/api-derive/types';

import getChainInfo from '../getChainInfo';

export default async function getBalanceAll(
  _address: string, _chain: Chain | null | undefined): Promise<DeriveBalancesAll> {
  const { api } = await getChainInfo(_chain);
  const allBalances = await api.derive.balances?.all(_address);

  console.log('allBalances', allBalances);

  return allBalances;
}
