// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

// Import the API, Keyring and some utility functions
// eslint-disable-next-line header/header
import type { Chain } from '@polkadot/extension-chains/types';

import { Dispatch, SetStateAction } from 'react';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import getChainInfo from './getChainInfo';
import { TransactionStatus, TxInfo } from './plusTypes';

export default async function signAndTransfer(
  _senderKeyring: KeyringPair,
  _receiverAddress: string,
  _amount: bigint,
  _chain: Chain | null | undefined,
  setTxStatus: Dispatch<SetStateAction<TransactionStatus>>): Promise<TxInfo> {

  const { api } = await getChainInfo(_chain);

  return new Promise((resolve) => {
    try {
      if (!_amount) {
        console.log('transfer value:', _amount);
        resolve({ failureText: 'Transfer amount is zero!', status: 'failed' });

        return;
      }

      console.log(`transfering  ${_amount} to ${_receiverAddress}`);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      api.tx.balances
        .transfer(_receiverAddress, _amount)

        .signAndSend(_senderKeyring, async (result) => {
          let txFailed = false;
          let failureText = '';

          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(result.dispatchError.asModule);
              const { docs, name, section } = decoded;

              txFailed = true;
              failureText = `${docs.join(' ')}`;

              console.log(` ${section}.${name}: ${docs.join(' ')}`);
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              // failureText = result.dispatchError.toString();
              console.log(result.dispatchError.toString());
            }
          }

          if (result.status.isInBlock) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            const signedBlock = await api.rpc.chain.getBlock(result.status.asInBlock);
            const blockNumber = signedBlock.block.header.number;

            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            setTxStatus({ blockNumber: String(blockNumber.toHuman()), success: null, text: 'INCLUDED' });
          } else if (result.status.isFinalized) {
            const signedBlock = await api.rpc.chain.getBlock(result.status.asFinalized);
            const blockNumber = signedBlock.block.header.number;

            if (txFailed) {
              setTxStatus({ blockNumber: String(blockNumber.toHuman()), success: false, text: failureText });
            } else {
              setTxStatus({ blockNumber: String(blockNumber.toHuman()), success: true, text: 'FINALIZED' });
            }

            const senderAddres = _senderKeyring.address;

            // the hash for each extrinsic in the block
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            signedBlock.block.extrinsics.forEach(async (ex) => {
              if (ex.isSigned) {
                if (ex.signer.toString() === senderAddres) {
                  const queryInfo = await api.rpc.payment.queryInfo(ex.toHex(), signedBlock.block.hash);
                  const fee = queryInfo.partialFee.toString();
                  const txHash = ex.hash.toHex();

                  resolve({ block: Number(blockNumber), failureText: failureText, fee: fee, status: txFailed ? 'failed' : 'success', txHash: txHash });
                }
              }
            });
          }
        });
    } catch (e) {
      console.log('something went wrong while sign and transfe!');
      setTxStatus({ blockNumber: null, success: false, text: `Failed: ${e}` });
      resolve({ failureText: String(e), status: 'failed' });
    }
  });
}

// transfer().catch(console.error).finally(() => process.exit());
