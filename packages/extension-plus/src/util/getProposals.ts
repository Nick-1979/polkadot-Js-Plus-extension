// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { DeriveReferendumExt, DeriveProposal } from '@polkadot/api-derive/types';
import getChainInfo from './getChainInfo';

export default async function getProposals(_chain: string): Promise< DeriveProposal[]> {

  const { api } = await getChainInfo(_chain);

  const proposals = await api.derive.democracy.proposals();

  console.log('proposals:', proposals)

  return proposals;
}
