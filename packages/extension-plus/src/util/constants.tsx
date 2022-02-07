// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

export const FLOATING_POINT_DIGIT = 5;
export const BLOCK_RATE = 6 //sec
export const DEFAULT_TOKEN_DECIMALS = 12;
export const MIN_EXTRA_BOND = 1 / (10 ** FLOATING_POINT_DIGIT);
export const DEFAULT_COIN = 'WND';
export const DEFAULT_CHAIN_NAME = 'Westend';
export const DEFAULT_VALIDATOR_COMMISION_FILTER = 20;
export const TRANSACTION_HISTROY_DEFAULT_ROWS = 6;
export const MAX_ACCEPTED_COMMISSION = 50;
export const SHORT_ADDRESS_CHARACTERS = 6;
export const MAX_VOTES = 16;
export const RELAY_CHAINS = [
  {
    name: 'Polkadot',
    symbol: 'DOT'
  },
  {
    name: 'Kusama',
    symbol: 'KSM'
  },
  {
    name: 'Westend',
    symbol: 'WND'
  }
];

export const SUPPORTED_CHAINS = ['Polkadot', 'Kusama', 'Westend'];


export const DEFAULT_IDENTITY = {
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

export const VOTE_MAP = {
  AYE: 1,
  NAY: 0
};

export const PASS_MAP = {
  EMPTY: 0,
  INCORRECT: -1,
  // eslint-disable-next-line sort-keys
  CORRECT: 1
};
