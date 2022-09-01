// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/**
 * @description
 * get all information regarding a pool
 * 
 * rewardPool.balance: The pool balance at the time of the last payout
 * rewardPpool.totalEarnings: The total earnings ever at the time of the last payout
 */
import { BN, BN_ZERO, bnMax } from '@polkadot/util';

import getApi from '../getApi.ts';
import getPoolAccounts from '../getPoolAccounts';

const DEFAULT_MEMBER_INFO = {
  points: BN_ZERO,
  poolId: BN_ZERO,
  rewardPoolTotalEarnings: BN_ZERO,
  unbondingEras: []
};

async function getPool(endpoint, stakerAddress, id = undefined) {
  console.log(`getPool is called for ${stakerAddress} id:${id}`);
  const api = await getApi(endpoint);

  const membersUnwrapped = !id && await api.query.nominationPools.poolMembers(stakerAddress);
  const member = membersUnwrapped?.isSome ? membersUnwrapped.unwrap() : undefined;

  if (!member && !id) {
    console.log(`can not find member for ${stakerAddress} or id is :${id}`);

    return null; // user does not joined a pool yet. or pool id does not exist
  }

  const poolId = member?.poolId ?? id;
  const accounts = getPoolAccounts(api, poolId);

  if (!accounts) {
    console.log(`can not find a pool with id:${id}`);

    return null;
  }

  const [metadata, bondedPools, rewardPools, rewardIdBalance, stashIdAccount] = await Promise.all([
    api.query.nominationPools.metadata(poolId),
    api.query.nominationPools.bondedPools(poolId),
    api.query.nominationPools.rewardPools(poolId),
    api.query.system.account(accounts.rewardId),
    api.derive.staking.account(accounts.stashId)
  ]);

  const unwrappedRewardPools = rewardPools.isSome ? rewardPools.unwrap() : null;
  const unwrappedBondedPool = bondedPools.isSome ? bondedPools.unwrap() : null;
  console.log('rewardPools:', JSON.parse(JSON.stringify(unwrappedRewardPools)))

  const poolRewardClaimable = bnMax(BN_ZERO, rewardIdBalance.data.free.sub(api.consts.balances.existentialDeposit));
  const lastTotalEarnings = unwrappedRewardPools?.totalEarnings ?? BN_ZERO;
  const currTotalEarnings = bnMax(BN_ZERO, poolRewardClaimable.sub(unwrappedRewardPools?.balance ?? BN_ZERO)).add(unwrappedRewardPools?.totalEarnings ?? BN_ZERO);
  const newEarnings = bnMax(BN_ZERO, currTotalEarnings.sub(lastTotalEarnings));
  const newPoints = unwrappedBondedPool.points.mul(newEarnings);
  const currentPoints = (unwrappedRewardPools?.points ?? BN_ZERO).add(newPoints);
  console.log('currTotalEarnings', currTotalEarnings)
  console.log('member.member', member)
  console.log('member.rewardPoolTotalEarnings', member.rewardPoolTotalEarnings)
  const newEarningsSinceLastClaim = member ? bnMax(BN_ZERO, currTotalEarnings.sub(member?.rewardPoolTotalEarnings ?? BN_ZERO)) : BN_ZERO;
  const delegatorVirtualPoints = member ? member.points.mul(newEarningsSinceLastClaim) : BN_ZERO;
  const myClaimable = delegatorVirtualPoints.isZero() || currentPoints.isZero() || poolRewardClaimable.isZero()
    ? BN_ZERO
    : delegatorVirtualPoints.mul(poolRewardClaimable).div(currentPoints);

  const rewardPool = {};

  if (unwrappedRewardPools) {
    rewardPool.balance = unwrappedRewardPools?.balance ? String(unwrappedRewardPools.balance) : undefined;
    rewardPool.points = unwrappedRewardPools?.points ? String(unwrappedRewardPools.points) : undefined;
    rewardPool.totalEarnings = unwrappedRewardPools?.totalEarnings ? String(unwrappedRewardPools.totalEarnings) : undefined;
  }

  const poolInfo = {
    accounts,
    bondedPool: unwrappedBondedPool,
    ledger: stashIdAccount?.stakingLedger,
    member,
    metadata: metadata.length
      ? metadata.isUtf8
        ? metadata.toUtf8()
        : metadata.toString()
      : null,
    myClaimable: Number(myClaimable),
    // nominators: nominators.unwrapOr({ targets: [] }).targets.map((n) => n.toString()),
    poolId: id,
    redeemable: Number(stashIdAccount?.redeemable),
    rewardClaimable: Number(poolRewardClaimable),
    rewardIdBalance: rewardIdBalance.data,
    rewardPool,
    stashIdAccount
  };

  return JSON.stringify(poolInfo);
}

onmessage = (e) => {
  const { endpoint, stakerAddress, id } = e.data;

  // eslint-disable-next-line no-void
  void getPool(endpoint, stakerAddress, id).then((poolInfo) => {
    postMessage(poolInfo);
  });
};
