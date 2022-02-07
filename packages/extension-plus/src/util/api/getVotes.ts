// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveCouncilVote } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import getChainInfo from '../getChainInfo';

export default async function getVotes(_chain: Chain, _address: string): Promise<DeriveCouncilVote> {
  if (!_chain || !_address) return;
  const { api } = await getChainInfo(_chain);

  // _address = '14mSXQeHpF8NT1tMKu87tAbNDNjm7q9qh8hYa7BY2toNUkTo';

  const votesOf = await api.derive.council.votesOf(_address);
  console.log('votes: ', votesOf.votes.toString());

  // eslint-disable-next-line no-void
  // void api.disconnect();

  return votesOf;
}
