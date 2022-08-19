// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import request from 'umi-request';

import { TipsRequest } from '../plusTypes';

export default function getTips(chainName: string, pageNum: number, pageSize: number): Promise<TipsRequest> {
  return postReq(`https://${chainName}.api.subscan.io/api/scan/treasury/tips`, {
    // from_block: 8658091,
    // to_block: 8684569,
    page: pageNum,
    row: pageSize
  });
}

function postReq(api: string, data: Record<string, any> = {}, option?: Record<string, any>): Promise<TipsRequest> {
  return request.post(api, {
    data,
    ...option
  });
}
