// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/**
 * @description
 * This hook will cleans the accounts data saved in the local store,
 * because some new versions may change the stored data formats
 */

import { useCallback, useEffect } from 'react';

import { AccountJson } from '@polkadot/extension-base/background/types';

import { updateMeta } from '../../../extension-ui/src/messaging';
import { PLUS_VERSION } from '../util/constants';
import { SavedMetaData } from '../util/plusTypes';
import { prepareMetaData } from '../util/utils';

export default function useCleanUp(accounts: AccountJson[] | undefined, address: string | null | undefined): void {
  const history: string[] = [];

  const clearSavedMetaData = useCallback((clear: boolean) => {
    console.log(`cleaning saved meta data for ${address} ...`);
    const cleanUps = clear ? { nominatedValidators: '', validatorsInfo: '' } : {};

    const metaData = { ...cleanUps, plusVersion: PLUS_VERSION };

    // eslint-disable-next-line no-void
    address && void updateMeta(address, JSON.stringify(metaData));
  }, [address]);

  useEffect(() => {
    if (!accounts?.length || !address) { return; }

    const account = accounts?.find((acc) => acc.address === address);

    if (!account) {
      console.log('no coresponding account found!');

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const plusVersion: string = account?.plusVersion;

    console.log(`plusVersion Saved:${plusVersion} last:${PLUS_VERSION}`);

    clearSavedMetaData(!plusVersion || plusVersion !== PLUS_VERSION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts?.length, address, clearSavedMetaData]);
}
