// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

import getChainInfo from './getChainInfo';
import { CouncilInfo } from './plusTypes';

async function getAccountInfo(_chainName: string, _address: string[]): Promise<DeriveAccountInfo[]> {
  const { api } = await getChainInfo(_chainName);

  return await Promise.all(
    _address.map((a) => api.derive.accounts.info(a))
  );
}

export default async function getCouncil(_chain: string, type: string): Promise<CouncilInfo> {
  const { api } = await getChainInfo(_chain);

  const info = await api.derive.elections.info();
  
  console.log( JSON.parse(JSON.stringify(await api.derive.council?.proposals())))
  console.log( JSON.parse(JSON.stringify(await api.derive.council?.proposal("0xe96a7b5cc01645c7eb9e408a5176628a428591a014f4baa2857b68744244e651"))))

  console.log( JSON.parse(JSON.stringify(await   api.query.treasury.proposals(85))))

  const ids = info.members.map((m) => m[0].toString()).concat(info.runnersUp.map((c) => c[0].toString()));

  const accountInfo = await getAccountInfo(_chain, ids);

  // eslint-disable-next-line dot-notation
  info['accountInfos'] = accountInfo;

  return info as CouncilInfo;
}
