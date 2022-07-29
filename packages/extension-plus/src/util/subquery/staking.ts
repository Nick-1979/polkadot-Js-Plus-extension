// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { Voucher } from '../plusTypes';
import { getUrl, postReq } from './util';

export async function getRewards(chainName: string, controller: string | AccountId): Promise<Voucher[]> {
  const url = getUrl(chainName);

  const query = `query {
    historyElements (filter:
      {reward:{isNull:false},
        address:{equalTo:"${controller}"}
      }) {
        nodes {
          blockNumber
          timestamp
          extrinsicHash
          address
          reward
        }
    }
}`;
  const res = await postReq(url, { query });

  console.log('res of getRewards:', res.data.historyElements.nodes);

  return res.data.historyElements.nodes as Voucher[];
}