// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveElectionsInfo } from '@polkadot/api-derive/types';

import { hexToBn, hexToString } from '@polkadot/util';

import getChainInfo from './getChainInfo';

const DEFAULT_IDENTITY = {
  display: null,
  legal: null,
  web: null,
  email: null,
  twitter: null
};

interface identity {
  display: string;
  legal: string;
  web: string;
  email: string;
  twitter: string;
}

interface councilInfo extends DeriveElectionsInfo {
  identities: identity[];
}

async function getIdentities(_chainName, _address) {
  console.log(`getting identities of .... on ${_chainName}`);

  const { api } = await getChainInfo(_chainName);

  const identities = await api.query.identity.identityOf.multi(_address);

  const ids = identities.map((id) => {
    if (!id.toString()) {
      return DEFAULT_IDENTITY;
    }

    const jId = JSON.parse(id.toString());
    // console.log('jId:', jId)

    const info = {
      // 'judgements': [],
      //  'deposit':202580000000,
      info: {
        // 'additional':[],
        display: jId?.info?.display?.raw && hexToString(jId?.info?.display?.raw),
        legal: jId?.info?.legal?.raw && hexToString(jId?.info?.legal?.raw),
        web: jId?.info?.web?.raw && hexToString(jId?.info?.web?.raw),
        //  'riot':{'none':null},
        email: jId?.info?.email?.raw && hexToString(jId?.info?.email?.raw),
        //  'pgpFingerprint':null,
        //  'image':{'none':null},
        twitter: jId?.info?.twitter?.raw && hexToString(jId?.info?.twitter?.raw)
      }
    };

    return info;
  });

  console.log(ids)
  return ids;
}


export default async function getCouncil(_chain: string, type: string): Promise<councilInfo> {
  const { api } = await getChainInfo(_chain);

  let info = await api.derive.elections.info();
  const ids = info.members.map((m) => m[0]).concat(info.runnersUp.map((c) => c[0]));

  const identities = await getIdentities(_chain, ids);

  info['identities'] = identities;

  console.log('info:', info);

  return info as councilInfo;
}
