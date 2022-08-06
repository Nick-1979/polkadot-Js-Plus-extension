// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { Close, Initiation, Voucher } from '../plusTypes';
import { getUrl, postReq } from './util';

export async function getVouchers(chainName: string, lost: string | AccountId, rescuer: string | AccountId): Promise<Voucher[]> {
  const url = getUrl(chainName);

  const query = `query {
    recoveryVoucheds (filter:
     {lost:{equalTo:"${lost}"},
      rescuer:{equalTo:"${rescuer}"}
    }){ 
      nodes 
      {id,
       blockNumber,
       lost,
       rescuer,
       friend
      }}}`;
  const res = await postReq(url, { query });

  console.log('res:', res.data.recoveryVoucheds.nodes);

  return res.data.recoveryVoucheds.nodes as Voucher[];
}

type AccountType = 'rescuer' | 'lost';

export async function getInitiations(chainName: string, account: string | AccountId, accountType: AccountType, last = false): Promise<Initiation | Initiation[] | null> {
  if (!chainName || !account) {
    console.error('no chain name or account is defined in getInitiations');

    return null;
  }

  const url = getUrl(chainName);

  const query = `query {
    recoveryInitiateds (${last ? 'last:1,' : ''} filter:{
  ${accountType}: { equalTo: "${account}" }}) {
  nodes
  {
    id,
    blockNumber,
    lost,
    rescuer,
      }
    }}`;

  const res = await postReq(url, { query });

  const mayBeInitiations = res.data.recoveryInitiateds.nodes as Initiation[];

  return mayBeInitiations?.length ? last ? mayBeInitiations[0] : mayBeInitiations : null;
}

export async function getCloses(chainName: string, lost: string | AccountId): Promise<Close[] | null> {
  if (!chainName || !lost) {
    console.error('no chain name or lost account is defined in getCloses');

    return null;
  }

  const url = getUrl(chainName);

  const query = `query {
    recoveryCloseds (filter:{
  lost: { equalTo: "${lost}" }}) {
  nodes
  {
    id,
    blockNumber,
    lost,
    rescuer,
      }
    }}`;

  const res = await postReq(url, { query });

  const mayBeCloses = res.data.recoveryCloseds.nodes as Close[];

  return mayBeCloses?.length ? mayBeCloses : null;
}