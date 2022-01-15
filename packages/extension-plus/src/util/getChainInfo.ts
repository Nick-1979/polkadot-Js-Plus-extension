// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { Chain } from '@polkadot/extension-chains/types';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { createWsEndpoints } from '@polkadot/apps-config';

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);


interface chainInfo {
  api: ApiPromise;
  coin: string;
  decimals: number;
  url: string;
}

export default async function getChainInfo(_chain: Chain | string): Promise<chainInfo> {
  const chainName = (_chain as Chain)?.name?.replace(' Relay Chain', '') ?? _chain as string;
  const { value } = allEndpoints.find((e) => (String(e.text).toLowerCase() === chainName.toLowerCase()));

  const wsProvider = new WsProvider(value as string);

  const api = await ApiPromise.create({ provider: wsProvider });

  return {
    api: api,
    coin: api.registry.chainTokens[0],
    decimals: api.registry.chainDecimals[0],
    url: value as string
  };
}
