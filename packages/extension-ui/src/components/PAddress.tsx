// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { IconTheme } from '@polkadot/react-identicon/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCopy, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { faCodeBranch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Plus, ShortAddress } from '../../../extension-plus/src/components'; // added for Plus

import details from '../assets/details.svg';
import useMetadata from '../hooks/useMetadata';
import useOutsideClick from '../hooks/useOutsideClick';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { showAccount } from '../messaging';
import { DEFAULT_TYPE } from '../util/defaultType';
import getParentNameSuri from '../util/getParentNameSuri';
import { AccountContext, SettingsContext, ActionContext } from './contexts';
import Identicon from './Identicon';
import Menu from './Menu';
import Svg from './Svg';
import { Grid, IconButton } from '@mui/material';
import { MoreVert as MoreVertIcon, ArrowForwardIosRounded as ArrowForwardIosRoundedIcon } from '@mui/icons-material';

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
export default function Address({ actions, address, children, className, genesisHash, isExternal, isHardware, isHidden, name, parentName, showPlus, suri, toggleActions, type: givenType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const onAction = useContext(ActionContext);// added for plus

  const [{ account, formatted, genesisHash: recodedGenesis, prefix, type }, setRecoded] = useState<Recoded>(defaultRecoded);
  const chain = useMetadata(genesisHash || recodedGenesis, true);

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [moveMenuUp, setIsMovedMenu] = useState(false);
  const actIconRef = useRef<HTMLDivElement>(null);
  const actMenuRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  useOutsideClick([actIconRef, actMenuRef], () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

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
    const displayName = accountName || t('<unknown>');

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

  // added for plus
  const goToAccount = useCallback(() => {
    onAction(`/account/${genesisHash}/${address}/${formatted}/`);
  }, [address, formatted, genesisHash, onAction]);

  return (
    <Grid container alignItems='center' py='12px'>
      <Grid item xs={2.5} sx={{ pr: '10px' }}>
        <Identicon
          className='identityIcon'
          iconTheme={theme}
          isExternal={isExternal}
          onCopy={_onCopy}
          size={59}
          prefix={prefix}
          value={formatted || address}
        />
      </Grid>
      <Grid item xs={9.5} pl='8.53px'>
        <Grid container item justifyContent='space-between'>
          <Grid container item alignItems='center' spacing={1} xs>
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
                <Grid item sx={{ fontWeight: 400, fontSize: '24px', lineHeight: '0px', letterSpacing: '-0.015em' }}>
                  <Name />
                </Grid>
              )
            }
            <Grid item>
              <ShortAddress address={formatted || address || t('<unknown>')} addressStyle={{ fontWeight: 400, fontSize: '12px', lineHeight: '0px', letterSpacing: '-0.015em' }} />
            </Grid>
            <Grid item>
              <CopyToClipboard text={(formatted && formatted) || ''}>
                <FontAwesomeIcon
                  className='copyIcon'
                  icon={faCopy}
                  onClick={_onCopy}
                  size='sm'
                  title={t('copy address')}
                />
              </CopyToClipboard>
            </Grid>
          </Grid>
          <Grid item xs={1.5}>
            {actions && (
              <>
                <IconButton
                  onClick={_onClick}
                >
                  <MoreVertIcon sx={{ fontSize: 35 }} />
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
          <Grid container item pt='10px' alignItems='center'>
            <Grid item xs>
              <Plus
                address={address}
                chain={chain}
                formattedAddress={formatted || address}
                givenType={givenType}
                name={name || account?.name || t('<unknown>')}
                t={t}
              />
            </Grid>
            <Grid item xs={1.5}>
              <IconButton
                onClick={goToAccount}
              >
                <ArrowForwardIosRoundedIcon />
              </IconButton>
            </Grid>
          </Grid>
        }
      </Grid>
      {children}
    </Grid>
  );
}