// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  this component provides a place to select a suitable Proxy account to continue
 * */

import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { AccountJson, AccountWithChildren } from '../../../extension-base/src/background/types';

import { SendOutlined as SendOutlinedIcon } from '@mui/icons-material';
import { Container, FormControlLabel, Grid, Radio, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { NextStepButton } from '@polkadot/extension-ui/components';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Chain } from '../../../extension-chains/src/types';
import { AccountContext, SettingsContext } from '../../../extension-ui/src/components/contexts';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { DEFAULT_TYPE } from '../../../extension-ui/src/util/defaultType';
import { PlusHeader, Popup, Progress, Identity2, Hint } from '../components';
import { NameAddress, Proxy, ProxyTypes, Recoded } from '../util/plusTypes';

interface Props {
  api: ApiPromise | undefined;
  selectProxyModalOpen: boolean;
  chain: Chain;
  setProxy: React.Dispatch<React.SetStateAction<Proxy | undefined>>
  setSelectProxyModalOpen: Dispatch<SetStateAction<boolean>>;
  realAddress: string;
  allAddresesOnSameChain?: { formattedAddress: string, account: AccountJson }[];
  acceptableTypes: ProxyTypes[];
  icon: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  loadedProxies?: Proxy[];
}

/** find an account in our list */
function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean =>
    address === _address
  ) || null;
}

function findSubstrateAccount(accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

export default function SelectProxy({ acceptableTypes, allAddresesOnSameChain, api, chain, icon, loadedProxies, realAddress, selectProxyModalOpen, setProxy, setSelectProxyModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);

  const [proxies, setProxies] = useState<Proxy[] | undefined>(loadedProxies?.length ? loadedProxies : undefined);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | undefined>();

  const recodeAddress = useCallback((address: string, accounts: AccountWithChildren[], settings: SettingsStruct, chain?: Chain | null): Recoded => {
    /** decode and create a shortcut for the encoded address */
    const publicKey = decodeAddress(address);

    /** find our account using the actual publicKey, and then find the associated chain */
    const account = findSubstrateAccount(accounts, publicKey);
    const prefix = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    /** always allow the actual settings to override the display */
    return {
      account,
      formatted: encodeAddress(publicKey, prefix),
      genesisHash: account?.genesisHash,
      prefix,
      type: account?.type || DEFAULT_TYPE
    };
  }, []);

  const allAddreses = useMemo(() => {
    if (allAddresesOnSameChain) { return allAddresesOnSameChain; }

    const all = accounts.map((acc): { account: AccountJson, formattedAddress: string } => {
      const accountByAddress = findAccountByAddress(accounts, acc.address);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const recoded = (chain?.definition.chainType === 'ethereum' ||
        accountByAddress?.type === 'ethereum' ||
        (!accountByAddress))
        ? { account: accountByAddress, formatted: acc.addres, type: 'ethereum' } as Recoded
        : recodeAddress(acc.address, accounts, settings, chain);

      return {
        account: acc,
        formattedAddress: String(recoded.formatted)
      };
    });

    return all.filter((a) => a.formattedAddress !== (realAddress));
  }, [allAddresesOnSameChain, accounts, chain, recodeAddress, settings, realAddress]);

  useEffect(() => {
    !proxies && realAddress && api && api.query.proxy?.proxies(realAddress).then((proxies) => setProxies(JSON.parse(JSON.stringify(proxies[0]))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, chain, realAddress]);

  const isAvailable = useCallback((address: string): NameAddress => allAddreses?.find((a) => a.formattedAddress === address), [allAddreses]);

  const handleSelectProxyModalClose = useCallback((): void => {
    setSelectProxyModalOpen(false);
  }, [setSelectProxyModalOpen]);

  const handleOptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOptionIndex(Number(event.target.value));
  }, []);

  const handleSetProxy = useCallback(() => {
    selectedOptionIndex !== undefined && proxies && setProxy(proxies[selectedOptionIndex]);
    setSelectProxyModalOpen(false);
  }, [proxies, selectedOptionIndex, setProxy, setSelectProxyModalOpen]);

  return (
    <Popup handleClose={handleSelectProxyModalClose} showModal={selectProxyModalOpen}>
      <PlusHeader action={handleSelectProxyModalClose} chain={chain} closeText={'Close'} icon={icon} title={t('Select Proxy')} />
      <Container sx={{ pt: '30px' }}>
        <Grid item sx={{ mb: '40px' }}>
          <Typography variant='subtitle2'>
            {t('Since this is a real address (can not sign transactions), hence, you need to select an appropriate proxy of the account to do transaction on behalf')}
          </Typography>
        </Grid>
        <Grid container item sx={{ fontSize: 14, fontWeight: 500, bgcolor: grey[200], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', py: '5px', px: '10px' }}>
          <Grid item xs={6}>
            {t('account')}
          </Grid>
          <Grid item xs={3}>
            {t('type')}
          </Grid>
          <Grid item xs={2}>
            {t('delay')}
          </Grid>
          <Grid item xs={1}>
            {t('select')}
          </Grid>
        </Grid>
        <Grid alignItems='flex-start' container item sx={{ borderLeft: '2px solid', borderRight: '2px solid', borderBottom: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], display: 'inline-table', pt: '15px', pl: '10px', height: 300, overflowY: 'auto' }} xs={12}>
          {chain && realAddress &&
            <>
              {proxies
                ? proxies.length
                  ? proxies.map((proxy, index) => {
                    const availability = isAvailable(proxy.delegate) && acceptableTypes.includes(proxy.proxyType);

                    return (
                      <Grid alignItems='center' color={!availability ? grey[300] : ''} container item key={index} sx={{ fontSize: 12 }}>
                        <Grid item xs={6}>
                          <Identity2 address={proxy.delegate} api={api} chain={chain} />
                        </Grid>
                        <Grid item xs={3}>
                          {proxy.proxyType}
                        </Grid>
                        <Grid item xs={2}>
                          {proxy.delay}
                        </Grid>
                        <Grid item xs={1}>
                          <Hint id='availability' place='left' tip={availability ? t('Available') : t('Not available')}>
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={selectedOptionIndex === index}
                                  disabled={!availability}
                                  onChange={handleOptionChange}
                                  size='small'
                                  value={index} />
                              }
                              label='' value={index}
                            />
                          </Hint>
                        </Grid>
                      </Grid>
                    )
                  })
                  : <Grid item pt='50px' textAlign='center'>
                    {t('No proxies found for this account on {{chain}}', { replace: { chain: chain?.name } })}
                  </Grid>
                : <Progress pt={'30px'} title={'Loading proxies ...'} />
              }
            </>}
        </Grid>
        <Grid item sx={{ pt: '30px' }} xs={12}>
          <NextStepButton
            data-button-action='OK'
            isDisabled={!realAddress || selectedOptionIndex === undefined}
            onClick={handleSetProxy}
          >
            {t('Next')}
          </NextStepButton>
        </Grid>
      </Container>
    </Popup >
  );
}
