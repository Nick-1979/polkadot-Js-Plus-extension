// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call, ExtrinsicEra, ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { AnyJson } from '@polkadot/types/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useRef } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
// added for plus
import { BN, bnToBn } from '@polkadot/util';

import { useApi, useEndpoint2 } from '../../../../extension-plus/src/hooks';
import { Loading, SigningReqContext } from '../../components';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Request from './Request';
import TransactionIndex from './TransactionIndex';

interface Decoded { // added for plus
  args: AnyJson | null;
  method: Call | null;
}

function displayDecodeVersion(message: string, chain: Chain, specVersion: BN): string {// added for plus
  return `${message}: chain=${chain?.name}, specVersion=${chain?.specVersion.toString()} (request specVersion=${specVersion.toString()})`;
}

export default function Signing(): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(SigningReqContext);
  const [requestIndex, setRequestIndex] = useState(0);

  // added for plus

  function decodeMethod(data: string, chain: Chain, specVersion: BN): Decoded {
    let args: AnyJson | null = null;
    let method: Call | null = null;

    try {
      if (specVersion.eqn(chain.specVersion)) {
        method = chain.registry.createType('Call', data);
        args = (method.toHuman() as { args: AnyJson }).args;
      } else {
        console.log(displayDecodeVersion('Outdated metadata to decode', chain, specVersion));
      }
    } catch (error) {
      console.error(`${displayDecodeVersion('Error decoding method', chain, specVersion)}:: ${(error as Error).message}`);

      args = null;
      method = null;
    }

    return { args, method };
  }

  const _onNextClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex + 1),
    []
  );

  const _onPreviousClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex - 1),
    []
  );

  useEffect(() => {
    setRequestIndex(
      (requestIndex) => requestIndex < requests.length
        ? requestIndex
        : requests.length - 1
    );
  }, [requests]);

  // protect against removal overflows/underflows
  const request = requests.length !== 0
    ? requestIndex >= 0
      ? requestIndex < requests.length
        ? requests[requestIndex]
        : requests[requests.length - 1]
      : requests[0]
    : null;
  const isTransaction = !!((request?.request?.payload as SignerPayloadJSON)?.blockNumber);

  const payload = request?.request?.payload;
  const { address, genesisHash } = payload;
  const chain = useMetadata(genesisHash);
  const endpoint = useEndpoint2(address, genesisHash);
  const api = useApi(endpoint);
  const specVersion = useRef(bnToBn(payload?.specVersion)).current;
  const { args, method } = decodeMethod(payload?.method, chain, specVersion);
  console.log('request?.request', request?.request);
  console.log('endpoint', endpoint);
  console.log('request?.request?.payload', payload);
  console.log(`${method?.section}.${method?.method}`);
  const arg = method?.args && String(method.args).split(',');
  console.log('apiiii', api && arg ? api.tx[method.section][method.method](...arg) : '');
  console.log('args::', method?.args && String(method.args).split(','));
  // console.log('requests method',payload?.method?.toU8a());

  return request
    ? (
      <>
        <Header text={isTransaction ? t<string>('Transaction') : t<string>('Sign message')}>
          {requests.length > 1 && (
            <TransactionIndex
              index={requestIndex}
              onNextClick={_onNextClick}
              onPreviousClick={_onPreviousClick}
              totalItems={requests.length}
            />
          )}
        </Header>
        <Request
          account={request.account}
          buttonText={isTransaction ? t('Sign the transaction') : t('Sign the message')}
          isFirst={requestIndex === 0}
          request={request.request}
          signId={request.id}
          url={request.url}
        />
      </>
    )
    : <Loading />;
}
