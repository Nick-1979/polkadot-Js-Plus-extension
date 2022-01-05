/* eslint-disable header/header */
// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../../extension-ui/src/types';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faCoins, faQrcode, faSyncAlt, faTasks } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Container, Grid, Link } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { prepareMetaData } from '../util/pjpeUtils';
import { AccountsBalanceType, BalanceType, savedMetaData } from '../util/pjpeTypes';
import { AccountContext } from '../../../extension-ui/src/components/contexts';
import AddressQRcode from '../Popup/AddressQRcode';
import EasyStaking from '../Popup/Stake';
import TransactionHistory from '../Popup/History';
import TransferFunds from '../Popup/Transfer';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { updateMeta } from '../../../extension-ui/src/messaging';
import { grey } from '@mui/material/colors';
import { getPriceInUsd } from '../util/getPrice';
import Balance from './Balance';

export interface Props {
  actions?: React.ReactNode;
  address?: string | null;
  formattedAddress?: string | null;
  chain?: Chain | null;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  name: string;
  parentName?: string | null;
  suri?: string;
  toggleActions?: number;
  type?: KeypairType;
  givenType?: KeypairType;
}

function Plus({ address, chain, formattedAddress, givenType, name,
}: Props): React.ReactElement<Props> {
  const [balance, setBalance] = useState<AccountsBalanceType | null>(null);
  const { accounts } = useContext(AccountContext);
  // const settings = useContext(SettingsContext);
  const { t } = useTranslation();
  const [balanceChangeSubscribed, setBalanceChangeSubscribed] = useState<string>('');

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [showQRcodeModalOpen, setQRcodeModalOpen] = useState(false);
  const [showTxHistoryModal, setTxHistoryModalOpen] = useState(false);
  const [showStakingModal, setStakingModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [account, setAccount] = useState<AccountJson | null>(null);
  const [sender, setSender] = useState<AccountsBalanceType>({ address: String(address), chain: null, name: String(name) });
  const [price, setPrice] = useState<number>(0);

  useEffect((): void => {
    if (!chain) return;

    // eslint-disable-next-line no-void
    void getPriceInUsd(chain).then((p) => {
      console.log(`${chain.name.replace(' Relay Chain', '')} price:`, p);
      setPrice(p || 0);
    });
  }, [chain]);

  function getBalanceFromMetaData(_account: AccountJson, _chain: Chain): AccountsBalanceType | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const accLastBalance: savedMetaData = _account.lastBalance ? JSON.parse(_account.lastBalance) : null;

    if (!accLastBalance) { return null; }

    const chainName = _chain.name.replace(' Relay Chain', '');

    if (chainName !== accLastBalance.chainName) { return null; }

    return {
      address: _account.address,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      balanceInfo: accLastBalance ? JSON.parse(accLastBalance.metaData) : null,
      chain: accLastBalance ? accLastBalance.chainName : null,
      name: _account.name ? _account.name : ''
    };
  }

  function subscribeToBalanceChanges() {
    if (!chain) {
      return;
    }

    setBalanceChangeSubscribed(chain ? chain.name : '');
    const subscribeToBalance: Worker = new Worker(new URL('../util/workers/subscribeToBalance.js', import.meta.url));

    subscribeToBalance.postMessage({ address, chain, formattedAddress });

    subscribeToBalance.onerror = (err) => {
      console.log(err);
    };

    subscribeToBalance.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { address: string, subscribedChain: Chain, balanceInfo: BalanceType } = e.data;

      setBalance({
        address: result.address,
        balanceInfo: result.balanceInfo,
        chain: result.subscribedChain.name,
        name: name || ''
      });

      setRefreshing(false);
    };
  }

  useEffect((): void => {
    if (balance && chain) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      const stringifiedBalanceInfo = JSON.stringify(balance.balanceInfo, (_key, value) => typeof value === 'bigint' ? value.toString() : value);

      // eslint-disable-next-line no-void
      void updateMeta(balance.address, prepareMetaData(chain, 'lastBalance', stringifiedBalanceInfo));
    }
  }, [balance]);

  useEffect((): void => {
    setSender({
      address: String(formattedAddress),
      balanceInfo: balance ? balance.balanceInfo : undefined,
      chain: chain?.name || null,
      name: String(name)
    });
  }, [balance, chain, formattedAddress, name]);

  useEffect((): void => {
    if (!accounts) {
      console.log(' does not need to subscribe to balanceChange');

      return;
    }

    if (!chain) {
      // console.log(' does not need to subscribe to balanceChange for no chain');

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (!balanceChangeSubscribed) {
      console.log('subscribing to chain', chain?.name);

      subscribeToBalanceChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, chain]);

  useEffect((): void => {
    console.log('chain', chain);

    if (!chain) {
      console.log('do not show balance for now chain ');

      return;
    }

    const acc = accounts.find((acc) => acc.address === address);

    if (!acc) {
      console.log('account does not exist in Accounts!');

      return;
    }

    setAccount(acc);

    const lastSavedBalance = getBalanceFromMetaData(acc, chain);

    if (lastSavedBalance) {
      setBalance(lastSavedBalance);
    } else {
      setBalance(null);
      subscribeToBalanceChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain]);

  const handleTransferFunds = useCallback(
    (): void => {
      if (!chain) { return; }

      setTransferModalOpen(true);
    },
    [chain]
  );

  const handleShowQRcode = useCallback(
    (): void => {
      console.log('handleShowQRcode is clicked', showQRcodeModalOpen);
      setQRcodeModalOpen(true);
    },
    [showQRcodeModalOpen]
  );

  const handleTxHistory = useCallback(
    (): void => {
      setTxHistoryModalOpen(true);
    },
    [setTxHistoryModalOpen]
  );

  const handleStaking = useCallback(
    (): void => {
      if (!chain) { return; }

      setStakingModalOpen(true);
    },
    [chain]
  );

  const handlerefreshBalance = (): void => {
    if (!chain || refreshing) { return; }

    setRefreshing(true);
    setBalance(null);
    subscribeToBalanceChanges();
  };

  function getCoin(_myBalance: AccountsBalanceType): string {
    return !_myBalance || !_myBalance.balanceInfo ? '' : _myBalance.balanceInfo.coin;
  }

  return (
    <Container disableGutters sx={{ position: 'relative', top: '-10px' }}>
      <Grid container justifyContent='flex-end'>
        <Grid container id='QRcodePage' item justifyContent='flex-end' xs={2}>
          <Grid item xs={2} >
            <Link color='inherit' href='#' underline='none'>
              <FontAwesomeIcon
                icon={faQrcode}
                onClick={handleShowQRcode}
                size='sm'
                title={t('QR code')}
                color={!chain ? grey[300] : grey[600]}
              />
            </Link>
          </Grid>
          <Grid item xs={6}></Grid>
        </Grid>
      </Grid>
      <Grid alignItems='center' container>
        <Grid container item justifyContent='center' xs={10}>
          {!chain
            ? <Grid item xs={12}
              sx={{ color: grey[700], fontFamily: '"Source Sans Pro", Arial, sans-serif', fontWeight: 600, fontSize: 12, textAlign: 'center', paddingLeft: '20px' }} >
              {t('Please select a chain to view your balance.')}
            </Grid>
            : <>
              <Grid item sx={{ textAlign: 'left', paddingLeft: '75px' }} xs={7}>
                <Balance balance={balance} type='total' chain={chain} price={price} />
              </Grid>
              <Grid item sx={{ textAlign: 'left' }} xs={5}>
                <Balance balance={balance} type='available' chain={chain} price={price} />
              </Grid>
            </>
          }
        </Grid>
        <Grid container item xs={2}>
          <Grid container item id='plusToolbar' xs={12}>
            <Grid item xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  className='transferIcon'
                  icon={faPaperPlane}
                  onClick={handleTransferFunds}
                  size='sm'
                  title={t('transfer funds')}
                  color={!chain ? grey[300] : grey[600]}
                  swapOpacity={true}
                />
              </Link>
            </Grid>
            <Grid item container xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  className='refreshIcon'
                  icon={faSyncAlt}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={handlerefreshBalance}
                  size='sm'
                  title={t('refresh balance')}
                  spin={refreshing}
                  color={!chain ? grey[300] : grey[600]}
                />
              </Link>
            </Grid>
            <Grid item xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  icon={faTasks}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={handleTxHistory}
                  size='sm'
                  title={t('transaction history')}
                  color={!chain ? grey[300] : grey[600]}
                />
              </Link>
            </Grid>
            <Grid item xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  icon={faCoins}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={handleStaking}
                  size='sm'
                  title={t('easy staking')}
                  color={!chain ? grey[300] : grey[600]}
                />
              </Link>
            </Grid>
          </Grid>
          {
            balance &&
            <Grid item id='plusToolbar' xs={12} sx={{ color: grey[600], fontSize: 10, textAlign: 'center' }}>
              {chain && <> {'1 '}{getCoin(balance)}{' = $'}{price}</>}
            </Grid>
          }
        </Grid>
      </Grid>

      {
        transferModalOpen
          ? <TransferFunds
            chain={chain}
            givenType={givenType}
            sender={sender}
            setTransferModalOpen={setTransferModalOpen}
            transferModalOpen={transferModalOpen}
          />
          : ''
      }
      {
        showQRcodeModalOpen
          ? <AddressQRcode
            address={String(formattedAddress || address)}
            chain={chain}
            name={name}
            setQRcodeModalOpen={setQRcodeModalOpen}
            showQRcodeModalOpen={showQRcodeModalOpen}
          />
          : ''
      }
      {
        showTxHistoryModal
          ? <TransactionHistory
            address={String(address)}
            chain={chain}
            name={name}
            setTxHistoryModalOpen={setTxHistoryModalOpen}
            showTxHistoryModal={showTxHistoryModal}
          />
          : ''
      }
      {
        showStakingModal && sender && account
          ? <EasyStaking
            account={account}
            chain={chain}
            name={name}
            setStakingModalOpen={setStakingModalOpen}
            showStakingModal={showStakingModal}
            staker={sender}
          />
          : ''
      }
    </Container >
  );
}

export default styled(Plus)(({ theme }: ThemeProps) => `
  background: ${theme.accountBackground};
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;

  .banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;

    &.chain {
      background: ${theme.primaryColor};
      border-radius: 0 0 0 10px;
      color: white;
      padding: 0.1rem 0.5rem 0.1rem 0.75rem;
      right: 0;
      z-index: 1;
    }
  }

  .balanceDisplay {
    display: flex;
    justify-content: space-between;
    position: relative;

    .balance {
      position: absolute;
      left: 2px;
      top: 18px;    
      color: ${theme.labelColor};
      font-size: 14px;
      font-weight: bold;
    }
    . availableBalance {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .transferIcon {
      display: flex;
    justify-content: space-between;
    position: relative;

    .svg-inline--fa {
      width: 14px;
    height: 14px;
    margin-right: 10px;
    color: ${theme.accountDotsIconColor};
    &:hover {
      color: ${theme.labelColor};
    cursor: pointer;
  }
}

    .refreshIcon {
          position: absolute;
        right: 2px;
        top: +36px;
    }

    .hiddenIcon, .visibleIcon {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .hiddenIcon {
      color: ${theme.errorColor};
      &:hover {
        color: ${theme.accountDotsIconColor};
      }
    }
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: ${theme.labelColor};
    width: 0.875em;
  }

  .identityIcon {
    margin-left: 15px;
    margin-right: 10px;

    & svg {
      width: 50px;
      height: 50px;
    }
  }

  .info {
    width: 100%;
  }

  .infoRow {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 30px;
    // border-radius: 4px;
  }

  img {
    max-width: 50px;
    max-height: 50px;
    border-radius: 50%;
  }

  .name {
    font-size: 16px;
    line-height: 22px;
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 300px;
    white-space: nowrap;

    &.displaced {
      padding-top: 10px;
    }
  }

  .parentName {
    color: ${theme.labelColor};
    font-size: ${theme.inputLabelFontSize};
    line-height: 14px;
    overflow: hidden;
    padding: 0.25rem 0 0 0.8rem;
    text-overflow: ellipsis;
    width: 270px;
    white-space: nowrap;
  }

  .detailsIcon {
    background: ${theme.accountDotsIconColor};
    width: 3px;
    height: 19px;

    &.active {
      background: ${theme.primaryColor};
    }
  }

  .deriveIcon {
    color: ${theme.labelColor};
    position: absolute;
    top: 5px;
    width: 9px;
    height: 9px;
  }

  .movableMenu {
    margin-top: -20px;
    right: 28px;
    top: 0;

    &.isMoved {
      top: auto;
      bottom: 0;
    }
  }

  .settings {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 40px;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 1px;
      background: ${theme.boxBorderColor};
    }

    &:hover {
      cursor: pointer;
      background: ${theme.readonlyInputBackground};
    }
  }
`);
