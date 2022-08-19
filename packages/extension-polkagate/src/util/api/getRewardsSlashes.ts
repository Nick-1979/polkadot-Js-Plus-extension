// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import request from 'umi-request';

import { TransferRequest } from '../plusTypes';

export default function getRewardsSlashes(chainName: string, pageNum: number, pageSize: number, address: string): Promise<TransferRequest> {
  return postReq(`https://${chainName}.api.subscan.io/api/v2/scan/account/reward_slash`, {
    page: pageNum,
    row: pageSize,
    address: address
  });
}

function postReq(api: string, data: Record<string, any> = {}, option?: Record<string, any>): Promise<TransferRequest> {
  return request.post(api, {
    data,
    ...option
  });
}
