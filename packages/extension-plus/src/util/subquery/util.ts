// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import request from 'umi-request';

export const getUrl = (chainName: string): string => {
  if (chainName?.toLowerCase() === 'westend') {
    return 'https://api.subquery.network/sq/Nick-1979/westend';
  }

  return `https://api.subquery.network/sq/PolkaGate/${chainName.toLowerCase()}`;
};

export function postReq(api: string, data: Record<string, unknown> = {}, option?: Record<string, unknown>): Promise<Record<string, any>> {
  return request.post(api, {
    data,
    ...option
  });
}
