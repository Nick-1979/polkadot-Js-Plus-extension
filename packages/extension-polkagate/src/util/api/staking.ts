// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { MyPoolInfo, TxInfo, ValidatorsFromSubscan } from '../plusTypes';

import { KeyringPair } from '@polkadot/keyring/types';
import { BN } from '@polkadot/util';

import getChainInfo from '../getChainInfo';
import { postData } from '../postData';
import { signAndSend } from './signAndSend';

export async function getAllValidatorsFromSubscan (_chain: Chain): Promise<{ current: ValidatorsFromSubscan[] | null, waiting: ValidatorsFromSubscan[] | null } | null> {
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
export async function getCurrentValidatorsFromSubscan (_chain: Chain): Promise<ValidatorsFromSubscan[] | null> {
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

export async function getWaitingValidatorsFromSubscan (_chain: Chain): Promise<ValidatorsFromSubscan[] | null> {
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

export async function getBonded (_chain: Chain, _address: string): Promise<ValidatorsFromSubscan[] | null> {
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

export async function getStakingReward (_chain: Chain | null | undefined, _stakerAddress: string | null): Promise<string | null> {
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

export async function getCurrentEraIndex (_chain: Chain | null | undefined): Promise<number | null> {
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

export async function bondOrBondExtra (
  _chain: Chain | null | undefined,
  _stashAccountId: string | null,
  _signer: KeyringPair,
  _value: bigint,
  _alreadyBondedAmount: bigint,
  payee = 'Staked')
  : Promise<TxInfo> {
  try {
    console.log('bondOrBondExtra is called!');

    if (!_stashAccountId) {
      console.log('bondOrBondExtra:  controller is empty!');

      return { status: 'failed' };
    }

    /** payee:
     * Staked - Pay into the stash account, increasing the amount at stake accordingly.
     * Stash - Pay into the stash account, not increasing the amount at stake.
     * Account - Pay into a custom account.
     * Controller - Pay into the controller account.
     */

    const { api } = await getChainInfo(_chain);
    let bonded: SubmittableExtrinsic<'promise', ISubmittableResult>;

    if (Number(_alreadyBondedAmount) > 0) {
      bonded = api.tx.staking.bondExtra(_value);
    } else {
      bonded = api.tx.staking.bond(_stashAccountId, _value, payee);
    }

    return signAndSend(api, bonded, _signer, _stashAccountId);
  } catch (error) {
    console.log('Something went wrong while bond/nominate', error);

    return { status: 'failed' };
  }
}

//* *******************************POOL STAKING********************************************/

export async function poolJoinOrBondExtra (
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

export async function createPool (
  _api: ApiPromise,
  _depositor: string | null,
  _signer: KeyringPair,
  _value: BN,
  _poolId: BN,
  _roles: any,
  _poolName: string
): Promise<TxInfo> {
  try {
    console.log('createPool is called!');

    if (!_depositor) {
      console.log('createPool:  _depositor is empty!');

      return { status: 'failed' };
    }

    const created = _api.tx.utility.batch([
      _api.tx.nominationPools.create(_value, _roles.root, _roles.nominator, _roles.stateToggler),
      _api.tx.nominationPools.setMetadata(_poolId, _poolName)
    ]);

    return signAndSend(_api, created, _signer, _depositor);
  } catch (error) {
    console.log('Something went wrong while createPool', error);

    return { status: 'failed' };
  }
}

export async function editPool (
  _api: ApiPromise,
  _depositor: string | null,
  _signer: KeyringPair,
  _pool: MyPoolInfo,
  _basePool: MyPoolInfo
): Promise<TxInfo> {
  try {
    console.log('editPool is called!');

    if (!_depositor) {
      console.log('editPool:  _depositor is empty!');

      return { status: 'failed' };
    }

    const getRole = (role: string) => {
      if (!_pool.bondedPool.roles[role]) {return 'Remove';
      }

      if (_pool.bondedPool.roles[role] === _basePool.bondedPool.roles[role]) {
        return 'Noop';
      }

      return { set: _pool.bondedPool.roles[role] };
    };

    const calls = [];

    _basePool.metadata !== _pool.metadata &&
      calls.push(_api.tx.nominationPools.setMetadata(_pool.member.poolId, _pool.metadata));
    JSON.stringify(_basePool.bondedPool.roles) !== JSON.stringify(_pool.bondedPool.roles) &&
      calls.push(_api.tx.nominationPools.updateRoles(_pool.member.poolId, getRole('root'), getRole('nominator'), getRole('stateToggler')))

    const created = _api.tx.utility.batch(calls);

    return signAndSend(_api, created, _signer, _depositor);
  } catch (error) {
    console.log('Something went wrong while editPool', error);

    return { status: 'failed' };
  }
}
