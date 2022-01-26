/* eslint-disable camelcase */

// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { BLOCK_RATE, FLOATING_POINT_DIGIT } from './constants';
import { AccountsBalanceType, savedMetaData, TransactionDetail } from './plusTypes';

import type { Text } from '@polkadot/types';


interface Meta {
  docs: Text[];
}
export function fixFloatingPoint(_number: number | string, decimalDigit = FLOATING_POINT_DIGIT): string {
  const sNumber = String(_number);
  const dotIndex = sNumber.indexOf('.');

  if (dotIndex < 0) {
    // if (sNumber === '0') { return '0.00'; }

    return sNumber;
  }

  return sNumber.slice(0, dotIndex) + sNumber.slice(dotIndex, dotIndex + decimalDigit + 1);
}

export function balanceToHuman(_balance: AccountsBalanceType | null, _type: string): string {
  if (!_balance || !_balance.balanceInfo) return '';

  const balance = _balance.balanceInfo;
  const x = 10 ** balance.decimals;

  switch (_type) {
    case 'total':
      return fixFloatingPoint(Number(balance.total) / x);
    case 'available':
      return fixFloatingPoint(Number(balance.available) / x);
    default:
      console.log('_type is unknown in balanceToHuman!');

      return '';
  }
}

export function amountToHuman(_amount: string | undefined, _decimals: number, decimalDigits?: number): string {
  if (!_amount) return '';

  _amount = String(_amount).replaceAll(',', '');

  const x = 10 ** _decimals;

  // return Number(fixFloatingPoint(Number(_amount) / x, decimalDigits)).toLocaleString();
  return fixFloatingPoint(Number(_amount) / x, decimalDigits);
}

export function amountToMachine(_amount: string | undefined, _decimals: number): bigint {
  if (!_amount || !Number(_amount)) return BigInt(0);

  const dotIndex = _amount.indexOf('.');

  if (dotIndex > 0) {
    const decimalsOfAmount = _amount.length - dotIndex - 1;

    _amount = _amount.slice(0, dotIndex) + _amount.slice(dotIndex + 1, _amount.length);
    _decimals -= decimalsOfAmount;
    if (_decimals < 0) throw new Error("_decimals should be more than _amount's decimals digits");
  }

  const x = 10 ** _decimals;

  return BigInt(_amount) * BigInt(x);
}

export function getFormattedAddress(_address: string | null | undefined, _chain: Chain | null | undefined, settingsPrefix: number): string {
  const publicKey = decodeAddress(_address);
  const prefix = _chain ? _chain.ss58Format : (settingsPrefix === -1 ? 42 : settingsPrefix);

  return encodeAddress(publicKey, prefix);
}

export function handleAccountBalance(balance: any): { available: bigint, feeFrozen: bigint, miscFrozen: bigint, reserved: bigint, total: bigint } {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    available: BigInt(String(balance.free)) - BigInt(String(balance.miscFrozen)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    feeFrozen: BigInt(String(balance.feeFrozen)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    miscFrozen: BigInt(String(balance.miscFrozen)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    reserved: BigInt(String(balance.reserved)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    total: BigInt(String(balance.free)) + BigInt(String(balance.reserved))
  };
}

export function getSubstrateAddress(address: string): string {
  const publicKey = decodeAddress(address);

  return encodeAddress(publicKey, 42);
}

export function prepareMetaData(chain: Chain | null, label: string, metaData: any, _chainName?: string): string {
  const chainName = chain ? chain.name.replace(' Relay Chain', '') : _chainName;

  return JSON.stringify({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    [label]: JSON.stringify({ chainName: chainName, metaData: metaData })
  });
}

export function getTransactionHistoryFromLocalStorage(
  chain: Chain | null,
  hierarchy: AccountWithChildren[],
  accountSubstrateAddress: string,
  _chainName?: string): TransactionDetail[] {
  const account = hierarchy.find((h) => h.address === accountSubstrateAddress);

  if (!account) {
    console.log('something went wrong while looking for the account in accounts!!');

    return [];
  }

  const chainName = chain ? chain.name.replace(' Relay Chain', '') : _chainName;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const transactionHistoryFromLocalStorage: savedMetaData = account?.history ? JSON.parse(String(account.history)) : null;

  if (transactionHistoryFromLocalStorage) {
    if (transactionHistoryFromLocalStorage.chainName === chainName) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return transactionHistoryFromLocalStorage.metaData;
    }
  }

  return [];
}

export const getWebsiteFavico = (url: string | undefined): string => {
  if (!url) return '';

  return 'https://s2.googleusercontent.com/s2/favicons?domain=' + url;
}

export function remainingTime(currentBlockNumber: number, end: number): string {
  end = Number(end.toString())
  let mins = Math.floor((end - currentBlockNumber) * BLOCK_RATE / 60);

  if (!mins) return 'finished';

  let hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  let time = '';

  mins -= hrs * 60;

  if (mins) { time += mins + ' mins '; }

  hrs -= days * 24;

  if (hrs) { time = hrs + ' hours ' + time; }

  if (days) { time = days + ' days ' + time; }


  return time;
}


function splitSingle (value: string[], sep: string): string[] {
  return value.reduce((result: string[], value: string): string[] => {
    return value.split(sep).reduce((result: string[], value: string) => result.concat(value), result);
  }, []);
}

function splitParts (value: string): string[] {
  return ['[', ']'].reduce((result: string[], sep) => splitSingle(result, sep), [value]);
}

export function formatMeta (meta?: Meta): string [] {
  if (!meta || !meta.docs.length) {
    return null;
  }

  const strings = meta.docs.map((d) => d.toString().trim());
  const firstEmpty = strings.findIndex((d) => !d.length);
  const combined = (
    firstEmpty === -1
      ? strings
      : strings.slice(0, firstEmpty)
  ).join(' ').replace(/#(<weight>| <weight>).*<\/weight>/, '');
  const parts = splitParts(combined.replace(/\\/g, '').replace(/`/g, ''));

  return parts;
}



