// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@polkadot/extension-chains/types';

import Memoize from 'memoize-one';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';// added for plus, useContext

import { ApiPromise, WsProvider } from '@polkadot/api';
import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountContext } from '@polkadot/extension-ui/components';

import { ChainInfo } from '../util/plusTypes';

export default function (searchKeyWord: Chain | string | null | undefined, address?: string): ChainInfo | undefined {

  console.log('useChainInfo')

  if (!searchKeyWord) return undefined;
  const { accounts } = useContext(AccountContext);
  const [api, setApi] = useState<ApiPromise | undefined>();

  const endpoint = useMemo(() => {
    const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);
    const chainName = (searchKeyWord as Chain)?.name?.replace(' Relay Chain', '') ?? searchKeyWord as string;
    const condition = (input: LinkOption) => String(input.text)?.toLowerCase() === chainName?.toLowerCase() || input.genesisHash === searchKeyWord;

    const endpoints = allEndpoints.filter((e) => condition(e));

    const endpoint = endpoints[0];

    // console.log('endpoint:', endpoint);

    return endpoint;
  }, [searchKeyWord]);

  console.log('endpoint before useEffect :', endpoint);

  useEffect(() => {
    const wsProvider = new WsProvider(endpoint?.value);

    ApiPromise.create({ provider: wsProvider }).then((api) => {
      console.log('api useEffect :', endpoint);

      setApi(api)
    }).catch(console.error);
  }, [endpoint]);

  const chainInfo = useMemo(() => (api && {
    api: api,
    chainName: String(endpoint?.text),
    coin: api.registry.chainTokens[0],
    decimals: api.registry.chainDecimals[0],
    genesisHash: endpoint?.genesisHash as string,
    url: endpoint?.value
  }), [api, endpoint]);

  console.log('chainInfochainInfochainInfo', chainInfo)

  return chainInfo;
}
