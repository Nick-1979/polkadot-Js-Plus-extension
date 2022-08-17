// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { ApiPromise } from '@polkadot/api';
import type { BN } from '@polkadot/util';
import type { PoolAccounts } from '../util/plusTypes';

import { useMemo } from 'react';

import { bnToU8a, stringToU8a, u8aConcat } from '@polkadot/util';

const EMPTY_H256 = new Uint8Array(32);
const ADDR_PREFIX = stringToU8a('modlpy/npols');
const ADDR_PREFIX_WST = stringToU8a('modlpy/nopls');

export function createAccount(api: ApiPromise, poolId: BN, index: number): string {
  return api.registry.createType(
    'AccountId32',
    u8aConcat(
      api.runtimeVersion.specName.eq('westend')
        ? ADDR_PREFIX_WST
        : ADDR_PREFIX,
      new Uint8Array([index]),
      bnToU8a(poolId, { bitLength: 32 }),
      EMPTY_H256
    )
  ).toString();
}

export default function (api: ApiPromise, poolId: BN): PoolAccounts {
  return useMemo(
    () => ({
      rewardId: createAccount(api, poolId, 1),
      stashId: createAccount(api, poolId, 0)
    }),
    [api, poolId]
  );
}
