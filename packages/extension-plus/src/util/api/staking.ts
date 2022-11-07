// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { MyPoolInfo, TxInfo, ValidatorsFromSubscan, Proxy } from '../plusTypes';

import { KeyringPair } from '@polkadot/keyring/types';
import { BN } from '@polkadot/util';

import getChainInfo from '../getChainInfo';
import { postData } from '../postData';
import { signAndSend } from './signAndSend';

export async function getAllValidatorsFromSubscan(_chain: Chain): Promise<{ current: ValidatorsFromSubscan[] | null, waiting: ValidatorsFromSubscan[] | null } | null> {
  if (!_chain) {
    return null;
  }

  const allInfo = await Promise.all([
    getCurrentValidatorsFromSubscan(_chain),
    getWaitingValidatorsFromSubscan(_chain)
  ]);

  return { current: allInfo[0], waiting: allInfo[1] };
}

// TODO: get from blockchain too
export async function getCurrentValidatorsFromSubscan(_chain: Chain): Promise<ValidatorsFromSubscan[] | null> {
  return new Promise((resolve) => {
    try {
      const network = _chain.name.replace(' Relay Chain', '');

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData(
        'https://' + network + '.api.subscan.io/api/scan/staking/validators',
        {}
      ).then((data: { message: string; data: { count: number, list: ValidatorsFromSubscan[] | null; }; }) => {
        if (data.message === 'Success') {
          const validators = data.data.list;

          resolve(validators);
        } else {
          console.log(`Fetching message ${data.message}`);
          resolve(null);
        }
      });
    } catch (error) {
      console.log('something went wrong while getting getCurrentValidators ');
      resolve(null);
    }
  });
}

export async function getWaitingValidatorsFromSubscan(_chain: Chain): Promise<ValidatorsFromSubscan[] | null> {
  return new Promise((resolve) => {
    try {
      const network = _chain ? _chain.name.replace(' Relay Chain', '') : 'westend';

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData('https://' + network + '.api.subscan.io/api/scan/staking/waiting', { key: 20 })
        .then((data: { message: string; data: { count: number, list: ValidatorsFromSubscan[] | null; }; }) => {
          console.log(data);

          if (data.message === 'Success') {
            const validators = data.data.list;

            resolve(validators);
          } else {
            console.log(`Fetching message ${data.message}`);
            resolve(null);
          }
        });
    } catch (error) {
      console.log('something went wrong while getting getWaitinValidators, err: ', error);
      resolve(null);
    }
  });
}

export async function getBonded(_chain: Chain, _address: string): Promise<ValidatorsFromSubscan[] | null> {
  return new Promise((resolve) => {
    try {
      const network = _chain ? _chain.name.replace(' Relay Chain', '') : 'westend';

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData('https://' + network + '.api.subscan.io/api/wallet/bond_list',
        {
          // key: 21,
          // page: 1,
          status: 'bonded',
          address: _address
        })

        .then((data: any
          // : { message: string; data: { count: number, list: ValidatorsFromSubscan[] | null; }; }
        ) => {
          console.log('getBonded', data);

          // if (data.message === 'Success') {
          //   const validators = data.data.list;

          //   resolve(validators);
          // } else {
          //   console.log(`Fetching message ${data.message}`);
          //   resolve(null);
          // }
        });
    } catch (error) {
      console.log('something went wrong while getting getWaitinValidators, err: ', error);
      resolve(null);
    }
  });
}

export async function getStakingReward(_chain: Chain | null | undefined, _stakerAddress: string | null): Promise<string | null> {
  if (!_stakerAddress) {
    console.log('_stakerAddress is null in getting getStakingReward ');

    return null;
  }

  return new Promise((resolve) => {
    try {
      const network = _chain ? _chain.name.replace(' Relay Chain', '') : 'westend';

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData('https://' + network + '.api.subscan.io/api/scan/staking_history',
        {
          address: _stakerAddress,
          page: 0,
          row: 20
        })
        .then((data: { message: string; data: { sum: string; }; }) => {
          if (data.message === 'Success') {
            const reward = data.data.sum;

            console.log('# reward:', reward);

            resolve(reward);
          } else {
            console.log(`Fetching message ${data.message}`);
            resolve(null);
          }
        });
    } catch (error) {
      console.log('something went wrong while getting getStakingReward ');
      resolve(null);
    }
  });
}

export async function getCurrentEraIndex(_chain: Chain | null | undefined): Promise<number | null> {
  try {
    console.log('getCurrentEraIndex is called!');

    if (!_chain) {
      console.log('no _chain in getCurrentEraIndex');

      return null;
    }

    const { api } = await getChainInfo(_chain);

    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      api.query.staking.currentEra().then((index) => {
        resolve(Number(index));
      });
    });
  } catch (error) {
    console.log('Something went wrong while bond/nominate', error);

    return null;
  }
}

export async function bondOrBondExtra(
  api: ApiPromise,
  stashAccountId: string | null,
  signer: KeyringPair,
  value: bigint,
  alreadyBondedAmount: bigint,
  proxy: Proxy | undefined,
  payee = 'Staked'
): Promise<TxInfo> {
  try {
    console.log('bondOrBondExtra is called!');

    if (!stashAccountId) {
      console.log('bondOrBondExtra:  controller is empty!');

      return { status: 'failed' };
    }

    /** Since this is Easy staking we are using payee = Staked, will be changed in the advanced version **/
    /** payee:
     * Staked - Pay into the stash account, increasing the amount at stake accordingly.
     * Stash - Pay into the stash account, not increasing the amount at stake.
     * Account - Pay into a custom account.
     * Controller - Pay into the controller account.
     */

    const bonded = Number(alreadyBondedAmount) > 0 ? api.tx.staking.bondExtra(value) : api.tx.staking.bond(stashAccountId, value, payee);
    const tx = proxy ? api.tx.proxy.proxy(stashAccountId, proxy.proxyType, bonded) : bonded;

    return signAndSend(api, tx, signer, proxy?.delegate ?? stashAccountId);
  } catch (error) {
    console.log('Something went wrong while bond/nominate', error);

    return { status: 'failed' };
  }
}

//* *******************************POOL STAKING********************************************/

export async function poolJoinOrBondExtra(
  _api: ApiPromise,
  _stashAccountId: string | null,
  _signer: KeyringPair,
  _value: BN,
  _nextPoolId: BN,
  _alreadyBondedAmount: boolean): Promise<TxInfo> {
  try {
    console.log('poolJoinOrBondExtra is called! nextPoolId:', _nextPoolId);

    if (!_stashAccountId) {
      console.log('polBondOrBondExtra:  _stashAccountId is empty!');

      return { status: 'failed' };
    }

    let tx: SubmittableExtrinsic<'promise', ISubmittableResult>;

    if (_alreadyBondedAmount) {
      tx = _api.tx.nominationPools.bondExtra({ FreeBalance: _value });
    } else {
      tx = _api.tx.nominationPools.join(_value, _nextPoolId);
    }

    return signAndSend(_api, tx, _signer, _stashAccountId);
  } catch (error) {
    console.log('Something went wrong while bond/nominate', error);

    return { status: 'failed' };
  }
}

export async function createPool(
  api: ApiPromise,
  depositor: string | null,
  signer: KeyringPair,
  value: BN,
  poolId: number,
  roles: any,
  poolName: string,
  proxy?: Proxy
): Promise<TxInfo> {
  try {
    console.log('createPool is called!');

    if (!depositor) {
      console.log('createPool:  _depositor is empty!');

      return { status: 'failed' };
    }

    const created = api.tx.utility.batch([
      api.tx.nominationPools.create(value, roles.root, roles.nominator, roles.stateToggler),
      api.tx.nominationPools.setMetadata(poolId, poolName)
    ]);

    const tx = proxy ? api.tx.proxy.proxy(depositor, proxy.proxyType, created) : created;

    return signAndSend(api, tx, signer, depositor);
  } catch (error) {
    console.log('Something went wrong while createPool', error);

    return { status: 'failed' };
  }
}

export async function editPool(
  api: ApiPromise,
  depositor: string | null,
  signer: KeyringPair,
  pool: MyPoolInfo,
  basePool: MyPoolInfo,
  proxy?: Proxy
): Promise<TxInfo> {
  try {
    console.log('editPool is called!');

    if (!depositor) {
      console.log('editPool:  _depositor is empty!');

      return { status: 'failed' };
    }

    const getRole = (role: string) => {
      if (!pool.bondedPool.roles[role]) {
        return 'Remove';
      }

      if (pool.bondedPool.roles[role] === basePool.bondedPool.roles[role]) {
        return 'Noop';
      }

      return { set: pool.bondedPool.roles[role] };
    };

    const calls = [];

    basePool.metadata !== pool.metadata &&
      calls.push(api.tx.nominationPools.setMetadata(pool.member.poolId, pool.metadata));
    JSON.stringify(basePool.bondedPool.roles) !== JSON.stringify(pool.bondedPool.roles) &&
      calls.push(api.tx.nominationPools.updateRoles(pool.member.poolId, getRole('root'), getRole('nominator'), getRole('stateToggler')))

    const updated = api.tx.utility.batch(calls);
    const tx = proxy ? api.tx.proxy.proxy(depositor, proxy.proxyType, updated) : updated;

    return signAndSend(api, tx, signer, depositor);
  } catch (error) {
    console.log('Something went wrong while editPool', error);

    return { status: 'failed' };
  }
}
