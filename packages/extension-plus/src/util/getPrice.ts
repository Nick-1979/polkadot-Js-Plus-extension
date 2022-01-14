/* eslint-disable camelcase */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
// eslint-disable-next-line header/header
import { Chain } from '@polkadot/extension-chains/types';
import request from 'umi-request';

export async function getPriceInUsd(chain: Chain,): Promise<number> {
  const chainName = chain.name.replace(' Relay Chain', '').toLocaleLowerCase();
  const price= await getReq(`https://api.coingecko.com/api/v3/simple/price?ids=${chainName}&vs_currencies=usd`, {});
  
  return  price[chainName]?.usd as number;
}

function getReq(api: string, data: Record<string, any> = {}, option?: Record<string, any>): Promise< Record<string, any>> {
  return request.get(api, {
    data,
    ...option
  });
}
