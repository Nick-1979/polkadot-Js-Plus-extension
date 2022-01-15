// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from './getChainInfo';

export default async function getGenesishash(_chainName: string): Promise<string> {
  const { api } = await getChainInfo(_chainName);
  return api.genesisHash.toHex();
}
