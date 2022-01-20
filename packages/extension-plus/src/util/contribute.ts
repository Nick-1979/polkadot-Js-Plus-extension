// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import chain from '@polkadot/apps-config/api/chain';
import { KeyringPair } from '@polkadot/keyring/types';

import getChainInfo from './getChainInfo';
import { TxInfo } from './plusTypes';
import { signAndSend } from './signAndSend';


export default async function contribute(
  _signer: KeyringPair,
  _paraId: string,
  _amount: bigint,
  _chain: Chain): Promise<TxInfo> {
  const { api } = await getChainInfo(chain);

  try {
    if (!_amount) {
      console.log('cotribute value:', _amount);

      return { status: 'failed' };
    }

    console.log(`contributing  ${_amount} to ${_paraId}`);

    const contributed = api.tx.crowdloan.contribute(_paraId, _amount, null);

    return signAndSend(api, contributed, _signer);
  } catch (e) {
    console.log('something went wrong while nominating', e);

    return { status: 'failed' };
  }
}