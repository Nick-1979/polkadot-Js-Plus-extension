// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { IconTheme } from '@polkadot/react-identicon/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowForwardIosRounded as ArrowForwardIosRoundedIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { Avatar, Grid, IconButton } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { ShortAddress, ShowBalance } from '../../../extension-polkagate/src/components'; // added for Plus
import { useApi, useEndpoint } from '../../../extension-polkagate/src/hooks';
import useMetadata from '../hooks/useMetadata';
import useOutsideClick from '../hooks/useOutsideClick';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { showAccount } from '../messaging';
import { DEFAULT_TYPE } from '../util/defaultType';
import getParentNameSuri from '../util/getParentNameSuri';
import { AccountContext, ActionContext, SettingsContext } from './contexts';
import Identicon from './Identicon';
import Menu from './Menu';
import { useHistory } from 'react-router-dom';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { green } from '@mui/material/colors';

export interface Props {
  actions?: React.ReactNode;
  address?: string | null;
  children?: React.ReactNode;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  name?: string | null;
  parentName?: string | null;
  suri?: string;
  toggleActions?: number;
  type?: KeypairType;
  showPlus?: boolean;// added for plus
}

interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  prefix?: number;
  type: KeypairType;
}

// find an account in our list
function findSubstrateAccount(accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

// find an account in our list
function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean =>
    address === _address
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
    formatted: account?.type === 'ethereum'
      ? address
      : encodeAddress(publicKey, prefix),
    genesisHash: account?.genesisHash,
    prefix,
    type: account?.type || DEFAULT_TYPE
  };
}

const ACCOUNTS_SCREEN_HEIGHT = 550;
const defaultRecoded = { account: null, formatted: null, prefix: 42, type: DEFAULT_TYPE };

// added for plus, 'showPlus' as props
export default function PAddress({ actions, address, children, className, genesisHash, isExternal, isHardware, isHidden, name, parentName, showPlus, suri, toggleActions, type: givenType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const history = useHistory();

  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const onAction = useContext(ActionContext);// added for plus
  const [{ account, formatted, genesisHash: recodedGenesis, prefix, type }, setRecoded] = useState<Recoded>(defaultRecoded);
  const chain = useMetadata(genesisHash || recodedGenesis, true);

  const endpoint = useEndpoint(accounts, address, chain);
  const api = useApi(endpoint);

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [moveMenuUp, setIsMovedMenu] = useState(false);
  const actIconRef = useRef<HTMLDivElement>(null);
  const actMenuRef = useRef<HTMLDivElement>(null);

  const [identity, setIdentity] = useState<DeriveAccountRegistration | undefined>();
  const [balances, setBalances] = useState<DeriveBalancesAll | undefined>();
  const [recoverable, setRecoverable] = useState<boolean | undefined>();
  const { show } = useToast();

  useOutsideClick([actIconRef, actMenuRef], () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  useEffect((): void => {
    // eslint-disable-next-line no-void
    api && api.query?.recovery && api.query.recovery.recoverable(formatted).then((r) => r.isSome && setRecoverable(r.unwrap()));
  }, [api, formatted]);

  useEffect((): void => {
    if (!address) {
      return setRecoded(defaultRecoded);
    }

    const account = findAccountByAddress(accounts, address);

    setRecoded(
      (
        chain?.definition.chainType === 'ethereum' ||
        account?.type === 'ethereum' ||
        (!account && givenType === 'ethereum')
      )
        ? { account, formatted: address, type: 'ethereum' }
        : recodeAddress(address, accounts, chain, settings)
    );
  }, [accounts, address, chain, givenType, settings]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    api && formatted && void api.derive.balances?.all(formatted).then((b) => {
      setBalances(b);
    });
  }, [api, formatted]);

  useEffect(() => {
    if (!showActionsMenu) {
      setIsMovedMenu(false);
    } else if (actMenuRef.current) {
      const { bottom } = actMenuRef.current.getBoundingClientRect();

      if (bottom > ACCOUNTS_SCREEN_HEIGHT) {
        setIsMovedMenu(true);
      }
    }
  }, [showActionsMenu]);

  useEffect((): void => {
    setShowActionsMenu(false);
  }, [toggleActions]);

  useEffect((): void => {
    // eslint-disable-next-line no-void
    api && formatted && void api.derive.accounts.info(formatted).then((info) => {
      console.log('info:', info);
      setIdentity(info?.identity);
    });
  }, [api, formatted]);

  const judgement = useMemo(
    () =>
      identity?.judgements && JSON.stringify(identity?.judgements).match(/reasonable|knownGood/gi)
    , [identity?.judgements]
  );

  const theme = (
    type === 'ethereum'
      ? 'ethereum'
      : (chain?.icon || 'polkadot')
  ) as IconTheme;

  const _onClick = useCallback(
    () => setShowActionsMenu(!showActionsMenu),
    [showActionsMenu]
  );

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const _toggleVisibility = useCallback(
    (): void => {
      address && showAccount(address, isHidden || false).catch(console.error);
    },
    [address, isHidden]
  );

  const Name = () => {
    const accountName = name || account?.name;
    const displayName = identity?.display || accountName || t('<Unknown>');

    return (
      <>
        {!!accountName && (account?.isExternal || isExternal) && (
          (account?.isHardware || isHardware)
            ? (
              <FontAwesomeIcon
                className='hardwareIcon'
                icon={faUsb}
                rotation={270}
                title={t('hardware wallet account')}
              />
            )
            : (
              <FontAwesomeIcon
                className='externalIcon'
                icon={faQrcode}
                title={t('external account')}
              />
            )
        )}
        <span title={displayName}>{displayName}</span>
      </>);
  };

  const parentNameSuri = getParentNameSuri(parentName, suri);

  const goToAccount = useCallback(() => {
    // onAction(`/account/${genesisHash}/${address}/${formatted}/`);
    genesisHash && address && formatted && history.push({
      pathname: `/account/${genesisHash}/${address}/${formatted}/`,
      state: { api, balances, identity }
    });
  }, [balances, history, genesisHash, address, formatted, api, identity]);

  return (
    <Grid alignItems='center' container py='12px'>
      <Grid item sx={{ position: 'relative' }} xs={2.5}>
        <Identicon
          className='identityIcon'
          iconTheme={theme}
          isExternal={isExternal}
          onCopy={_onCopy}
          prefix={prefix}
          size={59}
          value={formatted || address}
        />
        {recoverable &&
          <Avatar sx={{ bgcolor: 'green', height: 22, position: 'absolute', right: '-3px', top: '-3px', width: 22 }}>
            <FontAwesomeIcon
              color='white'
              icon={faShieldHalved}
              id='recoverable'
              // onClick={handleOpenRecovery}
              style={{ height: '18.65px', width: '16px' }}
              title={t && t('recoverable')}
            />
          </Avatar>
        }
      </Grid>
      <Grid item pl='8.53px' xs={9.5}>
        <Grid container item justifyContent='space-between'>
          <Grid alignItems='center' container flexWrap='nowrap' item xs={11}>
            {parentName
              ? (
                <>
                  <div className='banner'>
                    <FontAwesomeIcon
                      className='deriveIcon'
                      icon={faCodeBranch}
                    />
                    <div
                      className='parentName'
                      data-field='parent'
                      title={parentNameSuri}
                    >
                      {parentNameSuri}
                    </div>
                  </div>
                  <div className='name displaced'>
                    <Name />
                  </div>
                </>
              )
              : (
                <Grid alignItems='center' container item sx={{ width: 'fit-content', maxWidth: '47%' }}>
                  <Grid item sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 300, fontSize: '24px', letterSpacing: '-0.015em' }} xs>
                    <Name />
                  </Grid>
                  {judgement &&
                    <Grid item xs={2.5} pt='10px' >
                      <CheckIcon sx={{ bgcolor: 'green', color: 'white', borderRadius: '50%', fontSize: 19, p: '3px' }} />
                    </Grid>
                  }
                </Grid>
              )
            }
            <Grid container item xs>
              <ShortAddress address={formatted || address || t('<unknown>')} addressStyle={{ fontWeight: 300, fontSize: '12px', lineHeight: '0px', letterSpacing: '-0.015em', justifyContent: 'flex-start', pl: '8px' }} charsCount={4} showCopy />
            </Grid>
          </Grid>
          <Grid item xs={1}>
            {actions && (
              <>
                <IconButton
                  onClick={_onClick}
                  sx={{ p: 0 }}
                >
                  <MoreVertIcon sx={{ fontSize: 30 }} />
                </IconButton>
                {showActionsMenu && (
                  <Menu
                    className={`movableMenu ${moveMenuUp ? 'isMoved' : ''}`}
                    reference={actMenuRef}
                  >
                    {actions}
                  </Menu>
                )}
              </>
            )}
          </Grid>
        </Grid>
        {
          (formatted || address) && showPlus &&
          <Grid alignItems='center' container item>
            <Grid item sx={{ fontWeight: 300, fontSize: '20px', letterSpacing: '-0.015em' }} xs>
              <ShowBalance api={api} balance={balances?.freeBalance?.add(balances?.reservedBalance)} />
            </Grid>
            <Grid item xs={1}>
              <IconButton
                sx={{ p: 0 }}
                onClick={goToAccount}
              >
                <ArrowForwardIosRoundedIcon sx={{ fontSize:'25px'}} />
              </IconButton>
            </Grid>
          </Grid>
        }
      </Grid>
      {children}
    </Grid>
  );
}