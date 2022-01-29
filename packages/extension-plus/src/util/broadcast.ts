// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { KeyringPair } from '@polkadot/keyring/types';

import { Chain } from '../../../extension-chains/src/types';
import getChainInfo from './getChainInfo';
import { TxInfo } from './plusTypes';
import { signAndSend } from './signAndSend';

export default async function broadcast(api, tx, params, signer): Promise<Promise<TxInfo>> {
  console.log('broadcasting a tx ....');
  
  const b = tx(...params);

  return signAndSend(api, b, signer);
}