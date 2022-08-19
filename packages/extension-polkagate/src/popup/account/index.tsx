// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens social recovery index page to choose between configuring your account and rescuing other account
 * */

import type { ThemeProps } from '../../../../extension-ui/src/types';
import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Avatar, Container, Divider, Grid, Skeleton, Typography } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router';

import { Chain } from '@polkadot/extension-chains/types';
import { Identicon } from '@polkadot/extension-ui/components';
import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';

import { AccountContext, SettingsContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { editAccount, getMetadata, tieAccount, updateMeta } from '../../../../extension-ui/src/messaging';// added for plus, updateMeta
import { Select, ShortAddress } from '../../components';
import { useApi, useEndpoint, useEndpoints } from '../../hooks';
import getLogo from '../../util/getLogo';
import { AddressState, FormattedAddressState, SavedMetaData } from '../../util/types';
import { Header } from './Header';
import { prepareMetaData } from '../../../../extension-plus/src/util/plusUtils';// added for plus
import { DEFAULT_TYPE } from '../../../../extension-ui/src/util/defaultType';
import type { KeypairType } from '@polkadot/util-crypto/types';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import { BN } from '@polkadot/util';
import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { getPriceInUsd } from '../../util/api/getPrice';

interface Props extends ThemeProps {
  className?: string;
}

interface Recoded {
  account: AccountJson | null;
  newFormattedAddress: string | null;
  newGenesisHash?: string | null;
  prefix?: number;
  type: KeypairType;
}

const defaultRecoded = { account: null, newFormattedAddress: null, prefix: 42, type: DEFAULT_TYPE };

// find an account in our list
function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean =>
    address === _address
  ) || null;
}

// find an account in our list
function findSubstrateAccount(accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

// recodes an supplied address using the prefix/genesisHash, include the actual saved account & chain
function recodeAddress(address: string, accounts: AccountWithChildren[], chain: Chain | null, settings: SettingsStruct): Recoded {
  // decode and create a shortcut for the encoded address
  const publicKey = decodeAddress(address);

  // find our account using the actual publicKey, and then find the associated chain
  const account = findSubstrateAccount(accounts, publicKey);
  const prefix = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

  // always allow the actual settings to override the display
  return {
    account,
    newFormattedAddress: account?.type === 'ethereum'
      ? address
      : encodeAddress(publicKey, prefix),
    newGenesisHash: account?.genesisHash,
    prefix,
    type: account?.type || DEFAULT_TYPE
  };
}

export default function Account({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const settings = useContext(SettingsContext);
  const onAction = useContext(ActionContext);// added for plus

  const { accounts } = useContext(AccountContext);
  const { address, formatted, genesisHash } = useParams<FormattedAddressState>();
  // const chain = useMetadata(genesisHash, true);
  const [{ account, newFormattedAddress, newGenesisHash, prefix, type }, setRecoded] = useState<Recoded>(defaultRecoded);
  const chain = useMetadata(genesisHash, true);

  const [newChain, setNewChain] = useState<Chain | null>(chain);
  const genesisOptions = useGenesisHashOptions();
  const endpointOptions = useEndpoints(newChain?.genesisHash ?? chain?.genesisHash);
  const endpoint = useEndpoint(accounts, address, newChain?.genesisHash ?? chain?.genesisHash);
  const [newEndpoint, setNewEndpoint] = useState<string | undefined>(endpoint);
  const [price, setPrice] = useState<number | undefined>();

  const api = useApi(newEndpoint);

  const [accountName, setAccountName] = useState<string | undefined>();
  const [balance, setBalance] = useState<DeriveBalancesAll | undefined>();

  const chainName = (newChain?.name ?? chain?.name)?.replace(' Relay Chain', '');

  const resetToDefaults = () => {
    setBalance(undefined);
    setNewEndpoint(undefined);
    setRecoded(defaultRecoded);
    setPrice(undefined);
  }

  useEffect(() => {
    account?.name && setAccountName(account?.name);
  }, [account]);

  useEffect(() => {
    chain && getPriceInUsd(chain).then((price) => {
      console.log(`${chain?.name}  ${price}`)
      setPrice(price);
    })
  }, [chain]);

  useEffect((): void => {
    if (!address) {
      return setRecoded(defaultRecoded);
    }

    const account = findAccountByAddress(accounts, address);

    setRecoded(
      // (
      //   chain?.definition.chainType === 'ethereum' ||
      //   account?.type === 'ethereum'
      //   //|| (!account && givenType === 'ethereum')
      // )
      //   ? { account, newFormattedAddress: address, type: 'ethereum' }
      //   :
      recodeAddress(address, accounts, chain, settings)
    );
  }, [accounts, address, chain, settings]);

  const goToAccount = useCallback(() => {
    onAction(`/account/${newGenesisHash}/${address}/${newFormattedAddress}/`);
  }, [address, newFormattedAddress, newGenesisHash, onAction]);

  useEffect(() => {
    newChain && newGenesisHash && newFormattedAddress && goToAccount();
  }, [goToAccount, newChain, newFormattedAddress, newGenesisHash]);

  useEffect(() => {
    !newEndpoint && endpointOptions?.length && setNewEndpoint(endpointOptions[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpointOptions]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    newEndpoint && api && formatted && void api.derive.balances?.all(formatted).then((b) => {
      console.log('balanceeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee:', JSON.parse(JSON.stringify(b)))
      setBalance(b);
    });
  }, [api, formatted, newEndpoint]);

  const _onChangeGenesis = useCallback((genesisHash?: string | null): void => {
    resetToDefaults();
    tieAccount(address, genesisHash || null).catch(console.error);
    genesisHash && getMetadata(genesisHash, true).then(setNewChain).catch((error): void => {
      console.error(error);
      setNewChain(null);
    });
  }, [address]);

  const _onChangeEndpoint = useCallback((newEndpoint?: string | undefined): void => {
    setNewEndpoint(newEndpoint);

    // eslint-disable-next-line no-void
    chainName && void updateMeta(address, prepareMetaData(chainName, 'endpoint', newEndpoint));
  }, [address, chainName]);

  const icon = (
    <Identicon
      className='identityIcon'
      iconTheme={chain?.icon || 'polkadot'}
      // isExternal={isExternal}
      // onCopy={_onCopy}
      prefix={chain?.ss58Format ?? 42}
      size={58}
      value={formatted}
    />
  );

  const AccountBrief = () => (
    <Grid item textAlign='center'>
      <Grid alignItems='center' container justifyContent='center' spacing={1.5}>
        <Grid item>
          <Typography sx={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.015em', lineHeight: '36px' }}>
            {accountName}
          </Typography>
        </Grid>
        <Grid item >
          <VisibilityOutlinedIcon sx={{ fontSize: '22px', pt: '5px' }} />
        </Grid>
      </Grid>
      <ShortAddress address={formatted} addressStyle={{ fontSize: '11px', fontWeight: 400, letterSpacing: '-0.015em', lineHeight: '32px' }} charsCount={13} showCopy />
      <Divider sx={{ bgcolor: 'secondary.main', height: '2px', mx: '40px' }} />
    </Grid>
  );

  const Balance = ({ balance, type }: { type: string, balance: DeriveBalancesAll | undefined }) => {
    let value: BN | undefined;

    if (type === 'Total' && balance) {
      value = balance.freeBalance.add(balance.reservedBalance)
    }

    const balanceToShow = value && api?.createType('Balance', value);
    // const balanceToNumber = value ? value

    console.log('decimals:', api && value && 10 ** api.registry.chainDecimals[0])
    const balanceInUSD = price && value && api && value.div(new BN(10 ** api.registry.chainDecimals[0])).muln(price);

    return (
      <Grid item pt='20px'>
        <Grid alignItems='center' container justifyContent='space-between'>
          <Grid item xs={3}>
            <Typography sx={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.015em', lineHeight: '36px' }}>
              {type}
            </Typography>
          </Grid>
          <Grid container item xs direction='column' justifyContent='flex-end'>
            <Grid item textAlign='right' >
              <Typography sx={{ fontSize: '20px', fontWeight: 400, letterSpacing: '-0.015em', lineHeight: '36px' }}>
                {balanceToShow
                  ? balanceToShow.toHuman()
                  : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
                }
              </Typography>
            </Grid>
            <Grid item textAlign='right' >
              <Typography sx={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.015em', lineHeight: '36px' }}>
                {balanceInUSD
                  ? `$${Number(balanceInUSD)?.toLocaleString()}`
                  : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
                }
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Divider sx={{ bgcolor: 'secondary.main', height: '2px' }} />
      </Grid>
    )
  };

  return (
    <Container disableGutters sx={{ px: '30px' }}>
      <Header address={address} genesisHash={genesisHash} icon={icon}>
        <AccountBrief />
      </Header>
      <Grid alignItems='flex-end' container pt={1}>
        <Grid item xs>
          <Select defaultValue={genesisHash} label={'Select the chain'} onChange={_onChangeGenesis} options={genesisOptions} />
        </Grid>
        <Grid item pl={1}>
          <Avatar
            alt={'logo'}
            src={getLogo(newChain ?? chain)}
            sx={{ height: 31, width: 31 }}
            variant='square'
          />
        </Grid>
      </Grid>
      <Grid item xs>
        {newEndpoint && <Select defaultValue={newEndpoint} label={'Select the endpoint'} onChange={_onChangeEndpoint} options={endpointOptions} />}
      </Grid>
      <Balance type={'Total'} balance={balance} />
    </Container>
  );
}
