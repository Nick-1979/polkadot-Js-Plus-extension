// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all proxies,so that can manage them to add, edit , and remove.
*/
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AddCircleRounded as AddCircleRoundedIcon, Clear as ClearIcon, Undo as UndoIcon } from '@mui/icons-material';
import { Container, Grid, IconButton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { AccountJson } from '@polkadot/extension-base/background/types';
import { AccountsStore } from '@polkadot/extension-base/stores';
import { NextStepButton } from '@polkadot/extension-ui/components';
import useMetadata from '@polkadot/extension-ui/hooks/useMetadata';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ZERO } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AccountContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import { Hint, Identity2, Progress, ShowBalance2 } from '../../components';
import { useApi, useEndpoint } from '../../hooks';
import { AddressState, NameAddress, Proxy, ProxyItem } from '../../util/plusTypes';
import { getAllFormattedAddressesOnThisChain, getFormattedAddress } from '../../util/plusUtils';
import AddProxy from './AddProxy';
import Confirm from './Confirm';

interface Props extends ThemeProps {
  className?: string;
}

export default function ManageProxies({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address, genesisHash } = useParams<AddressState>();
  const { accounts } = useContext(AccountContext);
  const account = useMemo((): AccountJson | undefined => accounts?.find((acc) => acc.address === address), [accounts, address]);
  const settings = useContext(SettingsContext);

  const chain = useMetadata(genesisHash, true);
  const endpoint = useEndpoint(accounts, address, chain);
  const api = useApi(endpoint);
  const [proxies, setProxies] = useState<ProxyItem[] | undefined>();
  const [addressesOnThisChain, setAddressesOnThisChain] = useState<NameAddress[]>([]);
  const [showAddProxyModal, setShowAddProxyModal] = useState<boolean>(false);
  const [nextIsDisabled, setNextIsDisabled] = useState<boolean>(false);
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);

  const proxyDepositBase = api ? api.consts.proxy.proxyDepositBase : BN_ZERO;
  const proxyDepositFactor = api ? api.consts.proxy.proxyDepositFactor : BN_ZERO;

  const available = proxies?.filter((item) => item.status !== 'remove')?.length ?? 0;
  const deposit = !available ? BN_ZERO : proxyDepositBase.add(proxyDepositFactor.muln(available)) as BN;

  const handleAddProxy = useCallback(() => {
    proxies && setShowAddProxyModal(true);
  }, [proxies]);

  const handleRemoveProxy = useCallback((index: number): void => {
    proxies[index].status === 'current' ? proxies[index].status = 'remove' : proxies?.splice(index, 1);
    setProxies([...proxies]);
  }, [proxies]);

  const handleUndoRemoveProxy = useCallback((index: number): void => {
    proxies[index].status = 'current';
    setProxies([...proxies]);
  }, [proxies]);

  useEffect(() => {
    const hasChanged = proxies?.find((item) => item.status !== 'current');

    setNextIsDisabled(!hasChanged);
  }, [proxies]);

  useEffect(() => {
    chain && settings?.prefix && accounts && address && setAddressesOnThisChain(getAllFormattedAddressesOnThisChain(chain, settings.prefix, accounts, address));
  }, [accounts, address, chain, settings]);

  const formatted = useMemo(() => address && chain && settings && getFormattedAddress(address, chain, settings.prefix), [address, chain, settings]);

  useEffect(() => {
    formatted && api && api.query.proxy?.proxies(formatted).then((proxies) => {
      const proxiyItems = (JSON.parse(JSON.stringify(proxies[0])))?.map((p: Proxy) => ({ proxy: p, status: 'current' })) as ProxyItem[];

      setProxies(proxiyItems);
      console.log('proxies:', proxiyItems);
    });
  }, [api, chain, formatted]);

  const handleNext = useCallback(() => {
    setConfirmModalOpen(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(() => null);
  }, []);

  return (
    <>
      <Header showBackArrow showSettings smallMargin text={t<string>('Manage Proxies')} />
      <Container disableGutters sx={{ pt: '10px', px: '30px' }}>
        <Grid item pb='20px'>
          <Typography sx={{ color: 'text.primary' }} variant='subtitle1'>
            {t('Add/remove proxies for this account, consider the deposit that will be reserved.')}
          </Typography>
        </Grid>
        <Grid alignItems='center' container item justifyContent='space-between' pb='10px' pt='15px' xs={12}>
          <Grid alignItems='center' container item justifyContent='flex-start' xs={6}>
            <Grid item p='7px 15px 7px 0px'>
              <Typography sx={{ color: 'text.primary' }} variant='body2'>
                {t('Your proxies')} {`(${available})`}
              </Typography>
            </Grid>
            <Grid item>
              <Hint id='addProxy' place='right' tip={t('add a proxy')}>
                <IconButton
                  aria-label='addProxy'
                  color={proxies ? 'warning' : 'default'}
                  onClick={handleAddProxy}
                  size='small'
                >
                  <AddCircleRoundedIcon sx={{ fontSize: 25 }} />
                </IconButton>
              </Hint>
            </Grid>
          </Grid>
          <Grid alignItems='center' item pr='7px' sx={{ fontSize: 13, color: grey[600] }} xs={3.5}>
            <ShowBalance2 api={api} balance={deposit} direction='row' title={`${t('deposit')}:`} />
          </Grid>
        </Grid>
        <Grid container item sx={{ fontSize: 14, fontWeight: 500, bgcolor: grey[300], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', py: '5px', px: '10px' }}>
          <Grid item xs={6}>
            {t('identity')}
          </Grid>
          <Grid item xs={3}>
            {t('type')}
          </Grid>
          <Grid item xs={2}>
            {t('delay')}
          </Grid>
          <Grid item xs={1}>
            {t('action')}
          </Grid>
        </Grid>
        <Grid container item sx={{ borderLeft: '2px solid', borderRight: '2px solid', borderBottom: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[300], display: 'block', pt: '15px', height: 250, pl: '10px', overflowY: 'auto' }} xs={12}>
          {proxies === undefined &&
            <Progress pt='20px' title={t('Loading proxies ...')} />
          }
          {proxies?.length === 0 &&
            <Grid alignItems='center' container justifyContent='center' sx={{ px: 3 }} xs={12}>
              <Grid item sx={{ pt: 15 }}>
                <Typography sx={{ color: 'text.secondary' }} variant='caption'>
                  {t('No proxies found!')}
                </Typography>
              </Grid>
            </Grid>
          }
          {!!proxies?.length && proxies?.map((item, index) => (
            <Grid backgroundColor={item.status === 'new' ? grey[100] : ''} container py={1} fontSize={14} item key={index} sx={item.status === 'remove' ? { textDecorationColor: 'red', textDecorationLine: 'line-through' } : ''} >
              <Grid item xs={6}>
                <Identity2 address={item.proxy.delegate} api={api} chain={chain} />
              </Grid>
              <Grid item xs={3}>
                {item.proxy.proxyType}
              </Grid>
              <Grid item xs={2}>
                {item.proxy.delay}
              </Grid>
              <Grid item xs={1}>
                {item.status === 'remove'
                  ? <Hint id='undoProxy' place='left' tip={t('undo remove')}>
                    <IconButton aria-label='undoProxy' color='success' onClick={() => handleUndoRemoveProxy(index)} size='small'>
                      <UndoIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Hint>
                  : <Hint id='removeProxy' place='left' tip={t('remove proxy')}>
                    <IconButton aria-label='removeProxy' color='error' onClick={() => handleRemoveProxy(index)} size='small'>
                      <ClearIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Hint>
                }
              </Grid>
            </Grid>
          ))}
        </Grid>
        <Grid item sx={{ pt: '25px' }} xs={12}>
          <NextStepButton
            data-button-action='Next'
            isDisabled={nextIsDisabled}
            onClick={handleNext}
          >
            {t('Next')}
          </NextStepButton>
        </Grid>
      </Container>
      {
        showAddProxyModal &&
        <AddProxy
          address={address}
          addressesOnThisChain={addressesOnThisChain}
          api={api}
          chain={chain}
          proxies={proxies ?? []}
          setProxies={setProxies}
          setShowAddProxyModal={setShowAddProxyModal}
          settingsPrefix={settings.prefix}
          showAddProxyModal={showAddProxyModal} />
      }
      {
        showConfirmModal && chain && api && formatted && proxies &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          deposit={deposit}
          formatted={formatted}
          proxies={proxies}
          setConfirmModalOpen={setConfirmModalOpen}
          showConfirmModal={showConfirmModal}
        />

      }
    </>
  );
}
