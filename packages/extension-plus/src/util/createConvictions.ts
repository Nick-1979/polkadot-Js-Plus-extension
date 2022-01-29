// Copyright 2017-2022 @polkadot/app-democracy authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { TFunction } from 'i18next';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_THOUSAND, BN_TWO } from '@polkadot/util';

import { Chain } from '../../../extension-chains/src/types';
import getChainInfo from './getChainInfo';

const DEFAULT_TIME = new BN(6_000);

// Some chains incorrectly use these, i.e. it is se to values such as 0 or even 2
// Use a low minimum validity threshold to check these against
const THRESHOLD = BN_THOUSAND.div(BN_TWO);
const CONVICTIONS: [number, number, BN][] = [1, 2, 4, 8, 16, 32].map((lock, index) => [index + 1, lock, new BN(lock)]);
const SEC_DAY = 60 * 60 * 24;

async function getBlockTime(api: ApiPromise): Promise<number> {

  const blockTime = (
    // Babe
    api.consts.babe?.expectedBlockTime ||
    // POW, eg. Kulupu
    api.consts.difficulty?.targetBlockTime ||
    // Subspace
    api.consts.subspace?.expectedBlockTime || (
      // Check against threshold to determine value validity
      api.consts.timestamp?.minimumPeriod.gte(THRESHOLD)
        // Default minimum period config
        ? api.consts.timestamp.minimumPeriod.mul(BN_TWO)
        : api.query.parachainSystem
          // default guess for a parachain
          ? DEFAULT_TIME.mul(BN_TWO)
          // default guess for others
          : DEFAULT_TIME
    )
  );

  return blockTime.toNumber();
}

export default async function createConvictions(chain: Chain, t: TFunction): Promise<{ text: string; value: number; }[]> {
  const { api } = await getChainInfo(chain);
  const blockTime = await getBlockTime(api);

  return [
    { text: t<string>('0.1x voting balance, no lockup period'), value: 0 },
    ...CONVICTIONS.map(([value, lock, bnLock]): { text: string; value: number } => ({
      text: t<string>('{{value}}x voting balance, locked for {{lock}}x enactment ({{period}} days)', {
        replace: {
          lock,
          period: (
            bnLock.mul(
              api.consts.democracy.voteLockingPeriod ||
              api.consts.democracy.enactmentPeriod
            ).muln(blockTime).div(BN_THOUSAND).toNumber() / SEC_DAY
          ).toFixed(2),
          value
        }
      }),
      value
    }))
  ];
}
