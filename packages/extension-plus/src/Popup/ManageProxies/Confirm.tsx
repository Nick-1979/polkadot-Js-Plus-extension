// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  confirm manage proxies
*/

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Container, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AccountJson } from '@polkadot/extension-base/background/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';
import { BN } from '@polkadot/util';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Identity, Identity2, Password, PlusHeader, Popup, ShowBalance2 } from '../../components';
import { ChooseProxy } from '../../partials';
import { signAndSend } from '../../util/api/signAndSend';
import { PASS_MAP } from '../../util/constants';
import { Proxy, ProxyItem, TransactionDetail } from '../../util/plusTypes';
import { getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';

interface Props extends ThemeProps {
  className?: string;
  account: AccountJson | undefined;
  api: ApiPromise;
  chain: Chain;
  showConfirmModal: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formatted: string;
  deposit: BN;
  proxies: ProxyItem[];
}

async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, history: TransactionDetail[]): Promise<boolean> {
  if (!history.length) {
    return false;
  }

  const accountSubstrateAddress = getSubstrateAddress(address);
  const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

  savedHistory.push(...history);

  return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
}

export default function Confirm({ account, api, chain, className, deposit, formatted, proxies, setConfirmModalOpen, showConfirmModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { hierarchy } = useContext(AccountContext);

  const [confirmingState, setConfirmingState] = useState<string | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [notEnoughBalance, setNotEnoughBalance] = useState<boolean | undefined>();
  const [proxy, setProxy] = useState<Proxy | undefined>();
  const [selectProxyModalOpen, setSelectProxyModalOpen] = useState<boolean>(false);

  const adding = proxies?.filter((item: ProxyItem) => item.status === 'new')?.length ?? 0;
  const removing = proxies?.filter((item) => item.status === 'remove')?.length ?? 0;
  const batchedCallsLimit = api.consts.utility.batchedCallsLimit;

  const removeProxy = api.tx.proxy.removeProxy; /** (delegate, proxyType, delay) **/
  const addProxy = api.tx.proxy.addProxy; /** (delegate, proxyType, delay) **/
  const batchAll = api.tx.utility.batchAll;

  const calls = useMemo((): SubmittableExtrinsic<'promise'>[] => {
    const temp: SubmittableExtrinsic<'promise'>[] = [];

    proxies.forEach((item: ProxyItem) => {
      const p = item.proxy;

      item.status === 'remove' && temp.push(removeProxy(p.delegate, p.proxyType, p.delay));
      item.status === 'new' && temp.push(addProxy(p.delegate, p.proxyType, p.delay));
    });

    return temp;
  }, [addProxy, proxies, removeProxy]);

  const tx = calls.length > 1 ? batchAll(calls) : calls[0];

  // console.log('api.tx.proxy.addProxy.meta.args.length:', api.tx.proxy.addProxy.meta.args.length);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void tx.paymentInfo(formatted).then((i) => setEstimatedFee(i?.partialFee));
  }, [formatted, tx]);

  const handleCloseModal = useCallback((): void => {
    setConfirmModalOpen(false);
  }, [setConfirmModalOpen]);

  const handleReject = useCallback((): void => {
    // setState('');
    setConfirmingState('');
    onAction('/');
  }, [onAction]);

  const handleBack = useCallback((): void => {
    setConfirmingState('');

    handleCloseModal();
  }, [handleCloseModal]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    // const localState = state;
    const history: TransactionDetail[] = []; /** collects all records to save in the local history at the end */

    try {
      setConfirmingState('confirming');

      const signer = keyring.getPair(proxy?.delegate ?? formatted);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const decidedTx = proxy ? api.tx.proxy.proxy(formatted, proxy.proxyType, tx) : tx;

      const { block, failureText, fee, status, txHash } = await signAndSend(api, decidedTx, signer, proxy?.delegate ?? formatted);

      // const { block, failureText, fee, status, txHash } = await signAndSend(api, tx, signer, formatted);

      history.push({
        action: 'manage_proxies',
        amount: '0',
        block,
        date: Date.now(),
        fee: fee || estimatedFee?.toString(),
        from: String(formatted),
        hash: txHash || '',
        status: failureText || status,
        to: ''
      });

      setConfirmingState(status);

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, formatted, history);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      // setState(localState);
      setConfirmingState('');
    }
  }, [api, chain, estimatedFee, formatted, hierarchy, password, proxy, tx]);

  const handleChooseProxy = useCallback((): void => {
    setSelectProxyModalOpen(true);
  }, []);

  const HeaderIcon = <ConfirmationNumberOutlinedIcon fontSize='small' />

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={HeaderIcon} title={t('Confirm')} />
      <Container sx={{ pt: '10px', px: '30px' }}>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[100], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', fontSize: 14, fontWeight: 500, my: '13px', py: '10px', px: '10px' }}>
          <Grid item sx={{ fontSize: 15, fontWeight: 500, color: grey[700], textAlign: 'center', pb: '5px' }} xs={12}>
            {adding ? t('Adding {{adding}}', { replace: { adding } }) : ''}     {removing ? t('Removing {{removing}}', { replace: { removing } }) : ''}  {removing + adding > 1 ? t('Proxies') : t('Proxy')}
          </Grid>
          <Grid item xs={3.5} >
            <ShowBalance2 alignItems='flext-start' api={api} balance={deposit} title={`${t('Deposit')}`} />
          </Grid>
          <Grid item xs={3}>
            <ShowBalance2 alignItems='flex-end' api={api} balance={estimatedFee} title={`${t('Fee')}`} />
          </Grid>
        </Grid>
        <Grid item sx={{ color: grey[600], fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
          {t('PROXIES')}
        </Grid>
        <Grid container item sx={{ bgcolor: grey[200], fontSize: 14, fontWeight: 500, borderTopRightRadius: '5px', borderTopLeftRadius: '5px', py: '5px', px: '10px' }}>
          <Grid item xs={5.5}>
            {t('identity')}
          </Grid>
          <Grid item xs={3}>
            {t('type')}
          </Grid>
          <Grid item xs={2}>
            {t('delay')}
          </Grid>
          <Grid item xs={1.5}>
            {t('state')}
          </Grid>
        </Grid>
        <Grid container item sx={{ borderBottom: '2px solid', borderLeft: '2px solid', borderRight: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], display: 'block', height: 170, pt: '15px', pl: '10px', overflowY: 'auto' }} xs={12}>
          {proxies.filter((item) => item.status !== 'current').map((item, index) => {
            const proxy = item.proxy;

            return (
              <Grid container item key={index} sx={{ fontSize: 13 }}>
                <Grid item xs={5.5}>
                  <Identity2 address={proxy.delegate} api={api} chain={chain} />
                </Grid>
                <Grid item xs={3}>
                  {proxy.proxyType}
                </Grid>
                <Grid item xs={2}>
                  {proxy.delay}
                </Grid>
                <Grid item xs={1.5}>
                  {item.status === 'remove' ? t('Removing') : ''}
                  {item.status === 'new' ? t('Adding') : ''}
                </Grid>
              </Grid>
            );
          })}
        </Grid>
      </Container>
      <Grid container item sx={{ pt: '25px', px: '26px' }} xs={12}>
        <Grid container item spacing={0.5} xs={12}>
          <Grid item xs>
            <Password
              autofocus
              handleIt={handleConfirm}
              isDisabled={!estimatedFee || (account?.isExternal && !proxy)}
              password={password}
              passwordStatus={passwordStatus}
              setPassword={setPassword}
              setPasswordStatus={setPasswordStatus}
            />
          </Grid>
          <ChooseProxy
            acceptableTypes={['Any', 'NonTransfer']}
            api={api}
            chain={chain}
            headerIcon={HeaderIcon}
            onClick={handleChooseProxy}
            proxy={proxy}
            realAddress={formatted}
            selectProxyModalOpen={selectProxyModalOpen}
            setProxy={setProxy}
            setSelectProxyModalOpen={setSelectProxyModalOpen}
          />
        </Grid>
        <Grid alignItems='center' container item xs={12}>
          <Grid container item xs={12}>
            <ConfirmButton
              handleBack={handleBack}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              isDisabled={notEnoughBalance || !password}
              state={confirmingState ?? ''}
              text={notEnoughBalance ? t('Not enough balance') : t('Confirm')}
            />
          </Grid>
        </Grid>
      </Grid>
    </Popup>
  );
}
