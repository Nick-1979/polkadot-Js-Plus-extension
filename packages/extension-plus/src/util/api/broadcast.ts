// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { SubmittableExtrinsic } from '@polkadot/api/types';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import { TxInfo } from '../plusTypes';
import { signAndSend } from './signAndSend';

export default async function broadcast(
  api: ApiPromise,
  tx: ((...args: any[]) => SubmittableExtrinsic<'promise'>) | null,
  params: unknown[] | (() => unknown[]) | null,
  signer: KeyringPair
): Promise<Promise<TxInfo>> {
  try {
    console.log('broadcasting a tx ....');

    const b = tx(...params);

    return signAndSend(api, b, signer);
  } catch (e) {
    console.log('something went wrong while broadcasting', e);

    return { status: 'failed' };
  }
}
