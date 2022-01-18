// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable camelcase */

import type { DeriveAccountInfo,DeriveElectionsInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';

export interface TransactionStatus {
  blockNumber: string | null;
  success: boolean | null;
  text: string | null;
}

export interface BalanceType {
  coin: string,
  available: bigint,
  total: bigint,
  reserved?: bigint,
  miscFrozen?: bigint,
  feeFrozen?: bigint,
  decimals: number
}

export const DEFAULT_ACCOUNT_BALANCE = { address: null, balanceInfo: null, chain: null, name: null };

export interface AccountsBalanceType {
  address: string; // formatted address
  chain: string | null;// TODO: actually it is chainName
  balanceInfo?: BalanceType;
  name: string | null;
  txHistory?: string;
}

export interface StakingConsts {
  existentialDeposit: bigint,
  maxNominations: number,
  maxNominatorRewardedPerValidator: number,
  minNominatorBond: number,
  bondingDuration: number
}

export interface Validators {
  current: DeriveStakingQuery[],
  waiting: DeriveStakingQuery[],
  // currentEraIndex: number
}

export interface AllValidatorsFromSubscan {
  current: ValidatorsFromSubscan[],
  waiting: ValidatorsFromSubscan[]
}

export interface ValidatorsName {
  address: string;
  name: string;
}

export interface savedMetaData { chainName: string; metaData: any }

export interface ValidatorsFromSubscan {
  bonded_nominators: string;
  bonded_owner: string;
  bonded_total?: string;
  controller_account_display?: stashAccountDisplay;
  count_nominators: number;
  grandpa_vote?: number;
  latest_mining?: number;
  node_name: string;
  rank_validator?: number;
  reward_account: string;
  reward_point?: number;
  reward_pot_balance: string;
  session_key?: any;
  stash_account_display: stashAccountDisplay;
  validator_prefs_value: number;
}

interface stashAccountDisplay {
  account_index: string;
  address: string;
  display: string;
  identity: boolean;
  judgements: any;
  parent: any;
}

export interface TransactionDetail {
  action: string; // send, bond, bond_extra, unbound, nominate ...
  block?: number;
  from: string;
  amount: string;
  date: number;
  hash: string;
  fee: string;
  to: string;
  status: string; // failed, success
}

export interface TxInfo {
  block?: number,
  fee?: string,
  status: string,
  txHash?: string,
  failureText?: string
}

export interface Auction {
  auctionCounter: number;
  auctionInfo: [string, string];
  blockchain: string;
  crowdloans: Crowdloan[];
  currentBlockNumber: number;
  minContribution: string;
  winning: string[];
}
export interface Crowdloan {
  fund: Fund;
  identity: Identity;
}

interface Fund {
  depositor: string;
  verifier: string | null;
  deposit: string;
  raised: string;
  end: number;
  cap: string;
  lastContribution: { ending: bigint };
  firstPeriod: number;
  lastPeriod: number;
  trieIndex: number;
  paraId: string;
  hasLeased: boolean;
}

interface Identity {
  // 'judgements': [],
  //  'deposit':202580000000,
  'info': {
    // 'additional':[],
    'display'?: string;
    'legal'?: string;
    'web'?: string;
    //  'riot':{'none':null},
    'email'?: string;
    //  'pgpFingerprint':null,
    //  'image':{'none':null},
    'twitter'?: string;
  }
}

export interface TransferRequest {
  code: number;
  data: {
    count: number;
    transfers: Transfers[];
  };
  generated_at: number;
  message: string;
}

interface AccountDisplay {
  address: string;
  display: string;
  judgements: string;
  account_index: string;
  identity: boolean;
  parent: any;
}

export interface Transfers {
  amount: string;
  asset_symbol: string;
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  fee: string;
  from: string;
  from_account_display: AccountDisplay;
  hash: string;
  module: string;
  nonce: number;
  success: boolean
  to: string;
  to_account_display: AccountDisplay;
}

export interface CouncilInfo extends DeriveElectionsInfo {
  accountInfos: DeriveAccountInfo[];
}
