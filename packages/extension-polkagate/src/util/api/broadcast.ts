// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { AccountId } from '@polkadot/types/interfaces';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import { TxInfo } from '../plusTypes';
import { signAndSend } from './signAndSend';

export default async function broadcast(
  api: ApiPromise,
  tx: ((...args: any[]) => SubmittableExtrinsic<'promise'>),
  params: unknown[] | (() => unknown[]),
  signer: KeyringPair,
  senderAddress: string | AccountId
): Promise<Promise<TxInfo>> {
  try {
    console.log('Broadcasting a tx ....');

    const b = tx(...params);

    return signAndSend(api, b, signer, senderAddress);
  } catch (e) {
    console.log('something went wrong while broadcasting', e);

    return { status: 'failed' };
  }
}
