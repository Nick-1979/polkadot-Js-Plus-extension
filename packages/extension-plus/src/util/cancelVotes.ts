// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { KeyringPair } from '@polkadot/keyring/types';
import { Chain } from '../../../extension-chains/src/types';

import getChainInfo from './getChainInfo';
import { TxInfo } from './plusTypes';
import { signAndSend } from './signAndSend';

export default async function cancelVotes(_chain: Chain, voter: string, signer: KeyringPair): Promise<Promise<TxInfo>> {
  const { api } = await getChainInfo(_chain);
  const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;

  console.log('electionApi:', electionApi);

  const removeVoter = electionApi.removeVoter();

  return signAndSend(api, removeVoter, signer);
}