// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

import getChainInfo from '../getChainInfo';

export default async function getCouncilMembersInfo(_chain: string): Promise<DeriveAccountInfo[]> {
  const { api } = await getChainInfo(_chain);
  const info = await api.derive.elections?.info();

  const ids = info.members.map((m) => m[0].toString())

  // eslint-disable-next-line dot-notation
  const accountInfos = await Promise.all(ids.map((a) => api.derive.accounts.info(a)));

  return accountInfos;
}
