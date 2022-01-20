// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from './getChainInfo';
import { CouncilInfo } from './plusTypes';

export default async function getCouncil(_chain: string): Promise<CouncilInfo> {
  const { api } = await getChainInfo(_chain);
  const info = await api.derive.elections.info();

  const ids = info.members.map((m) => m[0].toString())
    .concat(info.runnersUp.map((c) => c[0].toString()))
    .concat(info.candidates.map((c) => c[0].toString()));

  // eslint-disable-next-line dot-notation
  info['accountInfos'] = await Promise.all(ids.map((a) => api.derive.accounts.info(a)));

  console.log('council ids:', ids);

  return info as CouncilInfo;
}
