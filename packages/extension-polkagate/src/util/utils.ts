// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Text } from '@polkadot/types';
import type { AccountId } from '@polkadot/types/interfaces';
import type { Compact, u128 } from '@polkadot/types-codec';

import { ApiPromise } from '@polkadot/api';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { BLOCK_RATE, FLOATING_POINT_DIGIT, SHORT_ADDRESS_CHARACTERS } from './constants';
import { AccountsBalanceType, SavedMetaData, TransactionDetail } from './types';

interface Meta {
  docs: Text[];
}

export function isValidAddress(_address: string | undefined): boolean {
  try {
    encodeAddress(
      isHex(_address)
        ? hexToU8a(_address)
        : decodeAddress(_address)
    );

    return true;
  } catch (error) {
    return false;
  }
}

export function fixFloatingPoint(_number: number | string, decimalDigit = FLOATING_POINT_DIGIT, commify?: boolean): string {
  // make number positive if it is negative
  const sNumber = Number(_number) < 0 ? String(-Number(_number)) : String(_number);

  const dotIndex = sNumber.indexOf('.');

  if (dotIndex < 0) {
    return sNumber;
  }

  let integerDigits = sNumber.slice(0, dotIndex);

  integerDigits = commify ? Number(integerDigits).toLocaleString() : integerDigits;
  const fractionalDigits = sNumber.slice(dotIndex, dotIndex + decimalDigit + 1);

  return integerDigits + fractionalDigits;
}

export function balanceToHuman(_balance: AccountsBalanceType | null, _type: string, decimalDigits?: number, commify?: boolean): string {
  if (!_balance || !_balance.balanceInfo) { return ''; }

  const balance = _balance.balanceInfo;

  switch (_type.toLowerCase()) {
    case 'total':
      return amountToHuman(String(balance.total), balance.decimals, decimalDigits, commify);
    case 'available':
      return amountToHuman(String(balance.available), balance.decimals, decimalDigits, commify);
    case 'reserved':
      return amountToHuman(String(balance.reserved), balance.decimals, decimalDigits, commify);
    default:
      console.log('_type is unknown in balanceToHuman!');

      return '';
  }
}

export const toHuman = (api: ApiPromise, value: unknown) => api.createType('Balance', value).toHuman();

export function amountToHuman(_amount: string | number | bigint | Compact<u128> | undefined, _decimals: number, decimalDigits?: number, commify?: boolean): string {
  if (!_amount) { return ''; }

  _amount = String(_amount).replace(/,/g, '');

  const x = 10 ** _decimals;

  return fixFloatingPoint(Number(_amount) / x, decimalDigits, commify);
}

export function amountToMachine(_amount: string | undefined, _decimals: number): bigint {
  if (!_amount || !Number(_amount) || !_decimals) { return BigInt(0); }

  const dotIndex = _amount.indexOf('.');

  if (dotIndex >= 0) {
    const decimalsOfAmount = _amount.length - dotIndex - 1;

    _amount = _amount.slice(0, dotIndex) + _amount.slice(dotIndex + 1, _amount.length);
    _decimals -= decimalsOfAmount;

    if (_decimals < 0) {
      throw new Error("_decimals should be more than _amount's decimals digits");
    }
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
    available: BigInt(String(balance.free)) - BigInt(String(balance.miscFrozen)),
    feeFrozen: BigInt(String(balance.feeFrozen)),
    miscFrozen: BigInt(String(balance.miscFrozen)),
    reserved: BigInt(String(balance.reserved)),
    total: BigInt(String(balance.free)) + BigInt(String(balance.reserved))
  };
}

export function getSubstrateAddress(address: string): string {
  const publicKey = decodeAddress(address);

  return encodeAddress(publicKey, 42);
}

export function prepareMetaData(chain: Chain | null | string, label: string, metaData: any): string {
  const chainName = (chain as Chain)?.name?.replace(' Relay Chain', '') ?? chain;

  return JSON.stringify({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    [label]: JSON.stringify({ chainName: chainName, metaData: metaData })
  });
}

export function getTransactionHistoryFromLocalStorage(
  chain: Chain | null,
  hierarchy: AccountWithChildren[],
  address: string,
  _chainName?: string): TransactionDetail[] {
  const accountSubstrateAddress = getSubstrateAddress(address);

  console.log('hierarchy:', hierarchy);
  const account = hierarchy.find((h) => h.address === accountSubstrateAddress);

  if (!account) {
    console.log('something went wrong while looking for the account in accounts!!');

    return [];
  }

  const chainName = chain ? chain.name.replace(' Relay Chain', '') : _chainName;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const transactionHistoryFromLocalStorage: SavedMetaData = account?.history ? JSON.parse(String(account.history)) : null;

  if (transactionHistoryFromLocalStorage) {
    if (transactionHistoryFromLocalStorage.chainName === chainName) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return transactionHistoryFromLocalStorage.metaData;
    }
  }

  return [];
}

export const getWebsiteFavico = (url: string | undefined): string => {
  if (!url) { return ''; }

  return 'https://s2.googleusercontent.com/s2/favicons?domain=' + url;
};

export function remainingTime(blocks: number): string {
  let mins = Math.floor(blocks * BLOCK_RATE / 60);

  if (!mins) { return ''; }

  if (mins <= 0) { return 'finished'; }

  let hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  let time = '';

  mins -= hrs * 60;

  if (mins) { time += mins + ' mins '; }

  hrs -= days * 24;

  if (hrs === 1) { time = hrs + ' hour ' + time; }

  if (hrs && hrs !== 1) { time = hrs + ' hours ' + time; }

  if (days === 1) { time = days + ' day ' + time; }

  if (days && days !== 1) { time = days + ' days ' + time; }

  return time;
}

export function remainingTimeCountDown(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) { return 'finished'; }

  const days = Math.floor(seconds / (60 * 60 * 24));
  const [hour, min, sec] = new Date(seconds * 1000).toISOString().substring(11, 19).split(':');

  const d = days ? `${days} day ` : '';
  const h = hour ? `${hour} hour ` : '';
  const m = min ? `${min} min ` : '';
  const s = sec ? `${sec} sec` : '';

  return d + h + m + s;
}

function splitSingle(value: string[], sep: string): string[] {
  return value.reduce((result: string[], value: string): string[] => {
    return value.split(sep).reduce((result: string[], value: string) => result.concat(value), result);
  }, []);
}

function splitParts(value: string): string[] {
  return ['[', ']'].reduce((result: string[], sep) => splitSingle(result, sep), [value]);
}

export function formatMeta(meta?: Meta): string[] | null {
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

export function toShortAddress(address: string | AccountId, count = SHORT_ADDRESS_CHARACTERS): string {
  address = String(address);

  return `${address.slice(0, count)}...${address.slice(-1 * count)}`;
}

export const isEqual = (a1: any[] | null, a2: any[] | null): boolean => {
  if (!a1 && !a2) {
    return true;
  }

  if (!(a1 || a2)) {
    return false;
  }

  const a1Sorted = a1?.slice().sort();
  const a2Sorted = a2?.slice().sort();

  return JSON.stringify(a1Sorted) === JSON.stringify(a2Sorted);
};

export function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail, _chainName?: string): [string, string] {
  const accountSubstrateAddress = getSubstrateAddress(address);
  const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress, _chainName);

  savedHistory.push(currentTransactionDetail);

  return [accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory)];
}

// export function median(values: number[]): number {
//   if (values.length === 0) { return 0; }

//   values.sort(function (a, b) {
//     return a - b;
//   });

//   const half = Math.floor(values.length / 2);

//   if (values.length % 2) { return values[half]; }

//   return (values[half - 1] + values[half]) / 2.0;
// }