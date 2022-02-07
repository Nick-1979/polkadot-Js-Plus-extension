// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveAccountInfo, DeriveCollectiveProposal } from '@polkadot/api-derive/types';

import getChainInfo from '../getChainInfo';
import { MotionsInfo } from '../plusTypes';


export default async function getMotions(_chain: string): Promise<MotionsInfo> {
  const { api } = await getChainInfo(_chain);

  const proposals = await api.derive.council?.proposals();
  const proposalIds = proposals.map((i: DeriveCollectiveProposal) => i.proposal.args);
  const proposalInfo = await api.query.treasury.proposals.multi(proposalIds);

  const parsedProposalInfo = JSON.parse(JSON.stringify(proposalInfo));

  const ids = parsedProposalInfo.map((p): string | null => p?.proposer);

  const accountInfo: DeriveAccountInfo[] = await Promise.all(
    ids.map((a) => api.derive.accounts.info(a))
  );

  // eslint-disable-next-line no-void
  // void api.disconnect();

  return {
    accountInfo: accountInfo,
    proposalInfo: proposalInfo,
    proposals: proposals
  };
}
