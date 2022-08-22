// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description This is the main component which conects plus to original extension,
 * and make most of the new functionalities avilable
*/
import type { TFunction } from 'i18next';
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { PalletRecoveryActiveRecovery } from '@polkadot/types/lookup';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../../extension-ui/src/types';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faCoins, faQrcode, faShield, faShieldHalved, faSyncAlt, faTasks } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Container, Grid, Link } from '@mui/material';
import { deepOrange, green, grey, red } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { Option } from '@polkadot/types-codec';
import { BN } from '@polkadot/util';

import { AccountContext, ActionContext } from '../../../extension-ui/src/components/contexts';
import { updateMeta } from '../../../extension-ui/src/messaging';
import useApi from '../hooks/useApi';
import useEndPoint from '../hooks/useEndPoint';
import AddressQRcode from '../Popup/AddressQRcode/AddressQRcode';
import TransactionHistory from '../Popup/History';
import Configure from '../Popup/SocialRecovery/Configure';
import StakingIndex from '../Popup/Staking/StakingIndex';
import TransferFunds from '../Popup/Transfer';
import { getPriceInUsd } from '../util/api/getPrice';
import { SUPPORTED_CHAINS } from '../util/constants';
import { AccountsBalanceType, BalanceType, Close, Initiation, Rescuer, SavedMetaData } from '../util/plusTypes';
import { prepareMetaData } from '../util/plusUtils';
import { getCloses, getInitiations } from '../util/subquery';
import { Balance } from './';

interface Props {
  address?: string | null;
  formattedAddress?: string | null;
  chain?: Chain | null;
  className?: string;
  name: string;
  givenType?: KeypairType;
  t: TFunction;
}

interface Subscription {
  chainName: string | undefined;
  endpoint: string | undefined;
}
const defaultSubscribtion = { chainName: '', endpoint: '' };

export default function Plus({ address, chain, formattedAddress, name, t }: Props): React.ReactElement<Props> {
  const { accounts } = useContext(AccountContext);
  const endpoint = useEndPoint(accounts, address, chain);
  const api = useApi(endpoint);
  const supported = (chain: Chain) => SUPPORTED_CHAINS.includes(chain?.name.replace(' Relay Chain', ''));
  const [balance, setBalance] = useState<AccountsBalanceType | null>(null);
  const [balanceChangeSubscribtion, setBalanceChangeSubscribtion] = useState<Subscription>(defaultSubscribtion);
  const [showCloseRecoveryModal, setCloseRecoveryModalOpen] = useState<boolean | undefined>();
  const [recoverable, setRecoverable] = useState<boolean | undefined>();
  const [rescuer, setRescuer] = useState<Rescuer | undefined | null>();
  const [isRecoveringAlert, setIsRecoveringAlert] = useState<boolean | undefined>();
  const [account, setAccount] = useState<AccountJson | null>(null);

  const isRecovering = useCallback((address: string, chain: Chain, endpoint: string): void => {
    if (!endpoint || !address || !chain) { return; }

    const isRecoveringWorker: Worker = new Worker(new URL('../util/workers/isRecovering.js', import.meta.url));

    isRecoveringWorker.postMessage({ address, chain, endpoint });

    isRecoveringWorker.onerror = (err) => {
      console.log(err);
    };

    isRecoveringWorker.onmessage = (e) => {
      const rescuer: Rescuer | undefined = e.data as unknown as Rescuer | undefined;

      if (rescuer?.option) {
        console.log('rescuer is :', rescuer);
        rescuer.option.created = new BN(rescuer.option.created);
        rescuer.option.deposit = new BN(rescuer.option.deposit);
        setRescuer(rescuer);
      } else {
        setRescuer(null);
      }

      isRecoveringWorker.terminate();
    };
  }, []);

  const subscribeToBalanceChanges = useCallback((): void => {
    if (!chain || !endpoint || !formattedAddress) { return; }

    console.log(`subscribing to:${chain?.name} using:${endpoint}`);

    setBalanceChangeSubscribtion({ chainName: chain?.name, endpoint });
    const subscribeToBalanceChangesWorker: Worker = new Worker(new URL('../util/workers/subscribeToBalance.js', import.meta.url));

    subscribeToBalanceChangesWorker.postMessage({ address, endpoint, formattedAddress });

    subscribeToBalanceChangesWorker.onerror = (err) => {
      console.log(err);
    };

    subscribeToBalanceChangesWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { address: string, subscribedChain: Chain, balanceInfo: BalanceType } = e.data;

      setBalance({
        address: result.address,
        balanceInfo: result.balanceInfo,
        chain: chain?.name,
        name: name || ''
      });

      setRefreshing(false);
    };
  }, [address, chain, formattedAddress, name, endpoint]);

  useEffect((): void => {
    formattedAddress && chain && endpoint && api?.query?.recovery && isRecovering(formattedAddress, chain, endpoint); //TOLO: filter just supported chain
  }, [api, formattedAddress, chain, endpoint, isRecovering]);

  useEffect((): void => {
    if (!api?.query?.recovery) {
      return;
    }

    const chainName = chain?.name.replace(' Relay Chain', '');

    formattedAddress && chainName && getInitiations(chainName, formattedAddress, 'lost').then((initiations: Initiation[] | null) => {
      // console.log('initiations:', initiations);

      if (!initiations?.length) {
        // no initiations set rescuers null
        return setIsRecoveringAlert(false);
      }

      // eslint-disable-next-line no-void
      void getCloses(chainName, formattedAddress).then((closes: Close[] | null) => {
        // console.log('recovery closes', closes);

        let maybeRescuers = initiations.map((i) => i.rescuer);

        if (closes?.length) {
          const openInitiation = initiations.filter((i: Initiation) => !closes.find((c: Close) => c.lost === i.lost && c.rescuer === i.rescuer && new BN(i.blockNumber).lt(new BN(c.blockNumber))));

          maybeRescuers = openInitiation?.map((oi) => oi.rescuer);
        }

        if (maybeRescuers?.length) {
          setIsRecoveringAlert(true);
        } else {
          return setIsRecoveringAlert(false);
        }

        maybeRescuers?.length && api && api.query.recovery.activeRecoveries(formattedAddress, maybeRescuers[0]).then((activeRecovery: Option<PalletRecoveryActiveRecovery>) => {
          console.log('activeRecovery utilizing subQuery is :', activeRecovery?.isSome ? activeRecovery.unwrap() : null);

          if (activeRecovery?.isSome) {
            const unwrapedRescuer = activeRecovery.unwrap();

            setRescuer({
              accountId: maybeRescuers[0],
              option: {
                created: unwrapedRescuer.created,
                deposit: unwrapedRescuer.deposit,
                friends: JSON.parse(JSON.stringify(unwrapedRescuer.friends)) as string[]
              }
            });
          } else {
            setRescuer(null);
          }
        });
      });
    });
  }, [api, formattedAddress, chain]);

  useEffect((): void => {
    // eslint-disable-next-line no-void
    chain && api && api.query?.recovery && api.query.recovery.recoverable(formattedAddress).then((r) => {
      r.isSome && setRecoverable(r.unwrap())
      console.log(`is ${formattedAddress} recoverAble: ${r.isSome && r.unwrap()}`);
    });
  }, [api, chain, formattedAddress]);

  function getBalanceFromMetaData(_account: AccountJson, _chain: Chain): AccountsBalanceType | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const accLastBalance: SavedMetaData = _account.lastBalance ? JSON.parse(_account.lastBalance) : null;

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

  useEffect((): void => {
    if (balance && chain) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      const stringifiedBalanceInfo = JSON.stringify(balance.balanceInfo, (_key, value) => typeof value === 'bigint' ? value.toString() : value);

      // eslint-disable-next-line no-void
      void updateMeta(balance.address, prepareMetaData(chain, 'lastBalance', stringifiedBalanceInfo));
    }
  }, [balance, chain]);

  useEffect((): void => {
    if (!accounts || !chain || !endpoint) {
      console.log(' does not need to subscribe to balanceChange, chain is:', chain);

      return;
    }

    if ((balanceChangeSubscribtion.chainName && balanceChangeSubscribtion.chainName !== chain?.name) ||
      (balanceChangeSubscribtion.endpoint && balanceChangeSubscribtion.endpoint !== endpoint)) {
      subscribeToBalanceChanges();
    }
  }, [accounts, balanceChangeSubscribtion.chainName, balanceChangeSubscribtion.endpoint, chain, endpoint, subscribeToBalanceChanges]);

  useEffect((): void => {
    if (!chain) { return; }

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
    }

    subscribeToBalanceChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain]);

  return (
    <Container disableGutters sx={{ position: 'relative', top: '-10px' }}>
      <Grid alignItems='center' container>
        <Grid container item justifyContent='center' xs={10}>
          {!chain
            ? <Grid id='noChainAlert' item sx={{ color: grey[700], fontFamily: '"Source Sans Pro", Arial, sans-serif', fontWeight: 600, fontSize: 12, textAlign: 'center', paddingLeft: '20px' }} xs={12} >
              {t && t('Please select a chain to view your balance.')}
            </Grid>
            : <Grid item sx={{ textAlign: 'left' }} xs={12}>
              <Balance balance={balance} />
            </Grid>

          }
        </Grid>
      </Grid>
      {showCloseRecoveryModal && formattedAddress && chain && // TODO: chain should be supported ones
        <Configure
          account={{ accountId: formattedAddress }}
          api={api}
          chain={chain}
          recoveryStatus={'closeRecovery'}
          rescuer={rescuer}
          setConfigureModalOpen={setCloseRecoveryModalOpen}
          showConfigureModal={showCloseRecoveryModal}

        />
      }
    </Container>
  );
}
