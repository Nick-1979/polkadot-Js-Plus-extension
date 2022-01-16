// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from './getChainInfo';
import { hexToBn, hexToString } from '@polkadot/util';

const DEFAULT_IDENTITY = {
  // 'judgements': [],
  //  'deposit':202580000000,
  info: {
    // 'additional':[],
    display: null,
    legal: null,
    web: null,
    //  'riot':{'none':null},
    email: null,
    //  'pgpFingerprint':null,
    //  'image':{'none':null},
    twitter: null
  }
};

async function getIdentities (_chainName, _address) {
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


export default async function getCouncil(_chain: string, type: string): Promise<any> {

  const { api } = await getChainInfo(_chain);

  
   const council = await api.derive.council.members();
   getIdentities(_chain,council)

  console.log('council:', council.toString())

  return council;
}
