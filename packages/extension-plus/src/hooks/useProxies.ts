// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';

import { Proxy } from '../util/plusTypes';

export default function useProxies(api: ApiPromise | undefined, proxiedAddress: string): Proxy[] | undefined {
  const [proxies, setProxies] = useState<Proxy[] | undefined>();

  useEffect(() => {
    proxiedAddress && api && api.query.proxy?.proxies(proxiedAddress)
      .then((p) => setProxies(JSON.parse(JSON.stringify(p[0]))) as unknown as Proxy[]);
  }, [api, proxiedAddress]);

  return proxies;
}
