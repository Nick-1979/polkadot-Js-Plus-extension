// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { KeyringPair } from '@polkadot/keyring/types';

import { Chain } from '../../../extension-chains/src/types';
import getChainInfo from './getChainInfo';
import { TxInfo } from './plusTypes';
import { signAndSend } from './signAndSend';

export default async function voteReferenda(_chain: Chain, refIndex: string, vote: string, signer: KeyringPair): Promise<Promise<TxInfo>> {
  const { api } = await getChainInfo(_chain);
  const v = api.tx.democracy.vote(refIndex, vote);

  return signAndSend(api, v, signer);
}
