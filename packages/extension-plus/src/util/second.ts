// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { KeyringPair } from '@polkadot/keyring/types';

import { Chain } from '../../../extension-chains/src/types';
import getChainInfo from './getChainInfo';
import { TxInfo } from './plusTypes';
import { signAndSend } from './signAndSend';

export default async function second(_chain: Chain, proposalId: string, depositorsLength: number, signer: KeyringPair): Promise<Promise<TxInfo>> {
  const { api } = await getChainInfo(_chain);
  const params = api.tx.democracy.second.meta.args.length === 2 ? [proposalId, depositorsLength] : [proposalId];

  const seconding = api.tx.democracy.second(params);

  return signAndSend(api, seconding, signer);
}