// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @description
 * find endpoints based on chainName and also omit light client which my be add later
 */
import { useEffect, useMemo, useState } from 'react';

import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/settings/types';
import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';
import useTranslation from '@polkadot/extension-ui/hooks/useTranslation';

interface Option {
  text: string;
  value: string | number;
}

export default function (genesisHash: string | null | undefined): Option[] {
  const { t } = useTranslation();
  const genesisOptions = useGenesisHashOptions();

  const [allEndpoints, setAllEndpoints] = useState<LinkOption[] | undefined>();

  useEffect(() => {
    const wsEndpoints = t && createWsEndpoints(t);

    setAllEndpoints(wsEndpoints);
  }, [t]);

  const endpoints: Option[] | undefined = useMemo(() => {
    if (!genesisHash) return [];
    const option = genesisOptions?.find((o) => o.value === genesisHash);
    const chainName = option?.text?.replace(' Relay Chain', '')?.replace(' Network', '');

    const endpoints = allEndpoints?.filter((e) => String(e.text)?.toLowerCase() === chainName?.toLowerCase());

    return endpoints?.filter((e) => String(e.value).startsWith('wss')).map((e) => ({ text: e.textBy, value: e.value }));
  }, [allEndpoints, genesisHash, genesisOptions]);

  return endpoints ?? [];
}
