// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { ApiPromise, WsProvider } from '@polkadot/api';

export function useApi(endpoint: string | undefined): ApiPromise | undefined {
  const [api, setApi] = useState<ApiPromise | undefined>();

  useEffect(() => {
    if (!endpoint) { return; }

    const wsProvider = new WsProvider(endpoint);

    ApiPromise.create({ provider: wsProvider }).then((api) => setApi(api)).catch(console.error);
  }, [endpoint]);

  return api;
}
