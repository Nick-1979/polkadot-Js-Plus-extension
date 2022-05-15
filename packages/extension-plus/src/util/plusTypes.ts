// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable camelcase */

// eslint-disable-next-line simple-import-sort/imports
import type { DeriveAccountInfo, DeriveCollectiveProposal, DeriveElectionsInfo, DeriveProposal, DeriveReferendumExt, DeriveStakingQuery } from '@polkadot/api-derive/types';
import type { Option } from '@polkadot/types';
import type { BN } from '@polkadot/util';
import type { FrameSystemAccountInfo, PalletNominationPoolsBondedPoolInner, PalletNominationPoolsPoolMember, PalletNominationPoolsRewardPool, PalletStakingNominations } from '@polkadot/types/lookup';
import type { StakingLedger } from '@polkadot/types/interfaces';

import { ApiPromise } from '@polkadot/api';
import { Balance } from '@polkadot/types/interfaces';

export interface TransactionStatus {
  blockNumber: string | null;
  success: boolean | null;
  text: string | null;
}

export interface BalanceType {
  coin: string;
  available: bigint;
  total: bigint;
  reserved?: bigint;
  miscFrozen?: bigint;
  feeFrozen?: bigint;
  decimals: number
}

export const DEFAULT_ACCOUNT_BALANCE = { address: null, balanceInfo: null, chain: null, name: null };

export interface AccountsBalanceType {
  address: string; // formatted address
  chain: string | null; // chainName actually
  balanceInfo?: BalanceType;
  name: string | null;
  txHistory?: string;
}

export interface StakingConsts {
  existentialDeposit: bigint;
  maxNominations: number;
  maxNominatorRewardedPerValidator: number;
  minNominatorBond: bigint;
  unbondingDuration: number
}

export interface NominatorInfo {
  minNominated: bigint;
  isInList: boolean // is Nominator in top 22500 elected
}

export interface ValidatorInfo extends DeriveStakingQuery {
  accountInfo?: DeriveAccountInfo;
}

export interface AllValidators {
  current: ValidatorInfo[];
  waiting: ValidatorInfo[];
  currentEraIndex?: number
}

export interface Validators {
  current: DeriveStakingQuery[];
  waiting: DeriveStakingQuery[];
  currentEraIndex?: number
}

export interface AllValidatorsFromSubscan {
  current: ValidatorsFromSubscan[];
  waiting: ValidatorsFromSubscan[]
}

export interface ValidatorsName {
  address: string;
  name: string;
}

export interface SavedMetaData {
  chainName: string;
  metaData: any
}

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
  amount?: string;
  date: number;
  hash: string;
  fee: string;
  to: string;
  status: string; // failed, success
}

export interface TxInfo {
  block?: number;
  fee?: string;
  status: string;
  txHash?: string;
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

export interface TipsRequest {
  code: number;
  data: {
    count: number;
    list: Tip[];
  };
  generated_at: number;
  message: string;
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

interface AccountDisplay {
  address: string;
  display: string;
  judgements: string;
  account_index: string;
  identity: boolean;
  parent: any;
}

export interface CouncilInfo extends DeriveElectionsInfo {
  accountInfos: DeriveAccountInfo[];
}

export interface PersonsInfo {
  desiredSeats?: number;
  backed?: string[];
  infos: DeriveAccountInfo[]
}

export interface MotionsInfo {
  proposals: DeriveCollectiveProposal[];
  proposalInfo: any[];
  accountInfo: DeriveAccountInfo[]
}

export interface ChainInfo {
  api: ApiPromise;
  coin: string;
  decimals: number;
  url: string;
  genesisHash: string;
  chainName?: string;
}

export interface ProposalsInfo {
  proposals: DeriveProposal[];
  accountsInfo: DeriveAccountInfo[];
  minimumDeposit?: string;
}

export interface Conviction {
  text: string;
  value: number
}

type TransactionType = 'chill' | 'bond' | 'unbond' | 'nominate' | 'bondExtra' | 'slashingSpans' | 'withdrawUnbonded';

export interface TransactionFee {
  transactionType: TransactionType;
  estimatedFee: Balance;
}

export interface Referendum extends DeriveReferendumExt {
  proposerInfo: DeriveAccountInfo;
}

export interface RebagInfo {
  shouldRebag?: boolean;
  currentBagThreshold?: string;
}

export interface PutInFrontInfo {
  shouldPutInFront?: boolean;
  lighter?: string;
}

export interface AddressState {
  genesisHash: string;
  address: string;
}

export interface nameAddress {
  name?: string;
  address: string;
}

interface Judgment {
  index: number;
  judgement: string;
}

interface AccountInfo {
  address: string;
  display: string;
  judgements: Judgment[] | null;
  account_index: string;
  identity: boolean;
  parent: string | null
}

export interface Tip {
  block_num: number;
  reason: string;
  hash: string;
  extrinsic_index: string;
  status: string;
  amount: string;
  close_block_num: number;
  tipper_num: number;
  finder: AccountInfo;
  beneficiary: AccountInfo;
}

export interface Option {
  text: string;
  value: string;
}

export interface PoolStakingConsts {
  lastPoolId: BN;
  maxPoolMembers: number;
  maxPoolMembersPerPool: number;
  maxPools: number;
  minCreateBond: BN;
  minJoinBond: BN;
  minNominatorBond: BN
}

export interface PoolInfo {
  bondedPool: PalletNominationPoolsBondedPoolInner | null;
  metadata: string | null;
  rewardPool: PalletNominationPoolsRewardPool | null
}

export interface MyPoolInfo extends PoolInfo {
  member?: PalletNominationPoolsPoolMember;
  accounts?: PoolAccounts;
  poolId?: BN;
  nominators?: string[];
  myClaimable?: BN;
  redeemable?: BN;
  rewardClaimable?: BN;
  ledger?: StakingLedger | null;
  rewardIdBalance?: any;
  stashIdAccount?: any;
}

export interface PoolAccounts {
  rewardId: string;
  stashId: string;
}

export interface MembersMapEntry {
  accountId: string;
  member: PalletNominationPoolsPoolMember;
}