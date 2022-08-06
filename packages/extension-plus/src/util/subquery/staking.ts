// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { MAX_REWARDS_TO_SHOW } from '../constants';
import { SubQueryRewardInfo } from '../plusTypes';
import { getUrl, postReq } from './util';

export async function getRewards(chainName: string, controller: string | AccountId): Promise<SubQueryRewardInfo[]> {
  const url = getUrl(chainName);

  const query = `query {
    historyElements (last:${MAX_REWARDS_TO_SHOW},filter:
      {reward:{isNull:false},
        address:{equalTo:"${String(controller)}"}
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

  console.log('getRewards from subquery:', res.data.historyElements.nodes);

  return res.data.historyElements.nodes as SubQueryRewardInfo[];
}