// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { DeriveReferendumExt, DeriveProposal } from '@polkadot/api-derive/types';
import getChainInfo from '../getChainInfo';

export default async function getReferendums(_chain: string): Promise<DeriveReferendumExt[] > {

  const { api } = await getChainInfo(_chain);

 const  referendums = await api.derive.democracy.referendums();
 
  console.log('referendums:', referendums)

  return referendums;
}
