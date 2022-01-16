// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { DeriveReferendumExt, DeriveProposal } from '@polkadot/api-derive/types';
import getChainInfo from './getChainInfo';

export default async function getDemocracy(_chain: string, type: string): Promise<DeriveReferendumExt[] | DeriveProposal[]> {

  const { api } = await getChainInfo(_chain);

  let democracy: DeriveReferendumExt[] | DeriveProposal[];
  
  if (type === 'referendums')
    democracy = await api.derive.democracy.referendums();
  else
    democracy = await api.derive.democracy.proposals();

  console.log('democracy:', democracy)

  return democracy;
}
