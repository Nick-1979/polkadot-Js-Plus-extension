// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { KeyringPair } from '@polkadot/keyring/types';

import { Chain } from '../../../extension-chains/src/types';
import getChainInfo from './getChainInfo';
import { TxInfo } from './plusTypes';
import { signAndSend } from './signAndSend';

export default async function voteElection(_chain: Chain, candidates: string[], value: string, signer: KeyringPair): Promise<Promise<TxInfo>> {
  const { api } = await getChainInfo(_chain);
  const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;

  const vote = electionApi.vote(candidates, value);

  return signAndSend(api, vote, signer);
}
