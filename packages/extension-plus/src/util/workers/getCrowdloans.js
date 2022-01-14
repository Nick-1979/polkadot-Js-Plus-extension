// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { hexToBn, hexToString } from '@polkadot/util';

import getChainInfo from '../getChainInfo.ts';

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

  return ids;
}

async function getCrowdloans (_chainName) {
  console.log('getting crowdloans ...');
  const { api } = await getChainInfo(_chainName);
  const allParaIds = (await api.query.paras.paraLifecycles.entries()).map(([key, _]) => key.args[0]);

  const [auctionInfo, auctionCounter, funds, leases, header] = await Promise.all([
    api.query.auctions.auctionInfo(),
    api.query.auctions.auctionCounter(),
    api.query.crowdloan.funds.multi(allParaIds),
    api.query.slots.leases.multi(allParaIds),
    api.rpc.chain.getHeader()
  ]);

  const hasLease = [];

  leases.forEach((lease, index) => {
    if (lease.length) {
      hasLease.push(allParaIds[index].toString());
    }
  }
  );

  const fundsWithParaId = funds.map((fund, index) => {
    if (fund.toString()) {
      const jpFund = JSON.parse(fund.toString());

      jpFund.raised = hexToBn(jpFund.raised).toString();
      jpFund.cap = hexToBn(jpFund.cap).toString();
      jpFund.deposit = (jpFund.deposit).toString();
      jpFund.paraId = String(allParaIds[index]);
      jpFund.hasLeased = hasLease.includes(jpFund.paraId);

      return jpFund;
    }

    return null;
  }); // console.log('funds with paradId:%o', fundsWithParaId)

  const nonEmtyFunds = fundsWithParaId.filter((fund) => fund);

  // console.log('nonEmtyFunds  :%o', nonEmtyFunds);

  const depositors = nonEmtyFunds.map((d) => d.depositor);// console.log('depositors:', depositors)

  const identities = await getIdentities(_chainName, depositors);

  // console.log('identities:', identities);

  const crowdloansWithIdentity = nonEmtyFunds.map((fund, index) => {
    return {
      fund: fund,
      identity: identities[index]
    };
  });// console.log('%o', crowdloansWithIdentity)

  const winning = await api.query.auctions.winning(funds);

  const auction = {
    auctionCounter: Number(auctionCounter),
    auctionInfo: auctionInfo.toString() ? JSON.parse(auctionInfo.toString()) : null,
    blockchain: _chainName,
    crowdloans: crowdloansWithIdentity,
    currentBlockNumber: Number(String(header.number)),
    minContribution: api.consts.crowdloan.minContribution.toString(),
    winning: winning.toString() ? Array.from(winning.toHuman()) : []
  };

  // console.log('%o', auction);

  return auction;
}

onmessage = (e) => {
  const { chain } = e.data;

  // eslint-disable-next-line no-void
  void getCrowdloans(chain).then((crowdloans) => {
    // console.log('crowdloans in worker',crowdloans);
    postMessage(crowdloans);
  });
};
