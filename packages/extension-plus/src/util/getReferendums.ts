// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from './getChainInfo';

export default async function getReferendums(
  _chain: string): Promise<any> {

    const { api } = await getChainInfo(_chain);
  const info = await api.derive.democracy.referendums()

  console.log(info);

  return info;
}
