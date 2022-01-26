// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from './getChainInfo';
import { ProposalsInfo } from './plusTypes';



export default async function getProposals(_chain: string): Promise<ProposalsInfo> {

  const { api } = await getChainInfo(_chain);

  const proposals = await api.derive.democracy.proposals();
  const accountsInfo = await Promise.all(proposals.map((p) => api.derive.accounts.info(p.proposer)));
  const proposalInfo = { proposals: proposals, accountsInfo: accountsInfo }

  console.log('proposalInfo:', JSON.parse(JSON.stringify(proposalInfo)));

  return proposalInfo;
}
