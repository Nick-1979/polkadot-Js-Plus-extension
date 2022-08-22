// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { BN } from '@polkadot/util';

export const EXTENSION_NAME = 'Polkadot js plus ❤️';
export const PREFERED_POOL_NAME = EXTENSION_NAME;
export const PLUS_VERSION = '0.42.8.13';
export const ENVIREONMENT = 'production'; //developement or production
export const PPREFERED_POOL_ID_ON_WESTEND = new BN(6)
export const PPREFERED_POOL_ID_ON_KUSAMA = undefined;
export const PPREFERED_POOL_ID_ON_POLKADOT = undefined;
export const DEVELOPEMENT_ENDPOINT = 'wss://109.109.36.23:443'
export const SELECTED_COLOR = '#fffbed';
export const POLKADOT_COLOR = '#E6007A';
export const AUCTION_GRACE_PERIOD = 27000;// BLOCKS
export const MAX_NOMINATIONS = 16;
export const FLOATING_POINT_DIGIT = 4;
export const BLOCK_RATE = 6 //sec
export const DEFAULT_TOKEN_DECIMALS = 12;
export const MIN_EXTRA_BOND = 1 / (10 ** FLOATING_POINT_DIGIT);
export const DEFAULT_COIN = 'WND';
export const DEFAULT_CHAIN_NAME = 'Westend';
export const DEFAULT_VALIDATOR_COMMISION_FILTER = 20;
export const TRANSACTION_HISTROY_DEFAULT_ROWS = 6;
export const MAX_ACCEPTED_COMMISSION = 20;
export const SHORT_ADDRESS_CHARACTERS = 4;
export const MAX_VOTES = 16;
export const MAX_REWARDS_TO_SHOW = 20;
export const MAX_AMOUNT_LENGTH = 15;
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

export const CROWDLOANS_CHAINS = [
  '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3', // POLKADOT
  '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe' // KUSAMA
];

export const GOVERNANCE_CHAINS = [
  '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3', // POLKADOT
  '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe' // KUSAMA
];

export const SOCIAL_RECOVERY_CHAINS = [
  '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e', // WESTEND
  '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe' // KUSAMA
];

// used to enable/disable staking icon in acount page
export const SUPPORTED_CHAINS = ['Polkadot', 'Kusama', 'Westend'];

// used in history to categorize transactions
export const STAKING_ACTIONS = ['bond', 'unbond', 'bond_extra', 'nominate', 'redeem', 'stop_nominating', 'chill', 'tuneUp'];

// used in confirm page
export const STATES_NEEDS_MESSAGE = ['withdrawUnbound', 'unstake', 'stopNominating', 'tuneUp'];
export const CONFIRMING_STATE = ['fail', 'success', 'confirming'];

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

