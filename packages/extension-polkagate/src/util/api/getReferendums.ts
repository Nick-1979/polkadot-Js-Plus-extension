// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo';
import { Referendum } from '../plusTypes';

export default async function getReferendums(_chain: string): Promise<Referendum[] | null> {
  const { api } = await getChainInfo(_chain);

  if (!api.derive.democracy?.referendums) return null;
  const referendums = await api.derive.democracy.referendums();
  const accountInfo = await Promise.all(referendums?.map((i) => i.image?.proposer && api.derive.accounts.info(i.image.proposer)))

  return referendums.map((r, index) => ({ ...r, proposerInfo: accountInfo[index] }));
}
