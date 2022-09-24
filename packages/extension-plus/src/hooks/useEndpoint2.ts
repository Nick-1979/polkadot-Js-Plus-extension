// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useContext, useMemo } from 'react';

import { createWsEndpoints } from '@polkadot/apps-config';

import { AccountContext } from '../../../extension-ui/src/components/contexts';
import useMetadata from '../../../extension-ui/src/hooks/useMetadata';
import { SavedMetaData } from '../util/plusTypes';
import { getSubstrateAddress } from '../util/plusUtils';

export default function useEndpoint2(formatted: string, genesisHash: string): string | undefined {
  const { accounts } = useContext(AccountContext);
  const chain = useMetadata(genesisHash, true);

  const endpoint = useMemo(() => {
    const chainName = chain?.name?.replace(' Relay Chain', '')?.replace(' Network', '');
    const address = getSubstrateAddress(formatted);
    const account = accounts.find((account) => account.address === address);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const endPointFromStore: SavedMetaData = account?.endpoint ? JSON.parse(account.endpoint) : null;

    if (endPointFromStore && endPointFromStore?.chainName === chainName) {
      return endPointFromStore.metaData as string;
    }

    const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

    const endpoints = allEndpoints?.filter((e) => String(e.text)?.toLowerCase() === chainName?.toLowerCase());

    return endpoints?.length ? endpoints[0].value : undefined;
  }, [accounts, formatted, chain?.name]);

  return endpoint;
}