// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens social recovery index page to choose between configuring your account and rescuing other account
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Security as SecurityIcon, Support as SupportIcon } from '@mui/icons-material';
import { Alert, Button, Divider, Grid, Paper } from '@mui/material';
import { blue, grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { AccountsStore } from '@polkadot/extension-base/stores';
import { Chain } from '@polkadot/extension-chains/types';
import keyring from '@polkadot/ui-keyring';
import { BN, hexToString } from '@polkadot/util';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { AccountContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import useApi from '../../hooks/useApi';
import useEndpoint from '../../hooks/useEndPoint';
import { SOCIAL_RECOVERY_CHAINS } from '../../util/constants';
import { AddressState, nameAddress, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import Configure from './Configure';
import Rscue from './Rescue';

interface Props extends ThemeProps {
  className?: string;
}

function SocialRecovery({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const settings = useContext(SettingsContext);
  const { accounts } = useContext(AccountContext);
  const { address, genesisHash } = useParams<AddressState>();
  const [acceptedGenesisHashes, setAcceptedGenesisHashes] = useState<string>();

  const [accountsInfo, setAcountsInfo] = useState<DeriveAccountInfo[]>();
  const [account, setAccount] = useState<DeriveAccountInfo | undefined>();
  const [addresesOnThisChain, setAddresesOnThisChain] = useState<nameAddress[]>([]);
  const [recoveryConsts, setRecoveryConsts] = useState<RecoveryConsts | undefined>();
  const [recoveryInfo, setRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [rescuer, setRescuer] = useState<Rescuer | undefined | null>();
  const [showConfigureModal, setConfigureModalOpen] = useState<boolean | undefined>();
  const [showRescueModal, setRescueModalOpen] = useState<boolean | undefined>();
  const [recoveryFirstSel, setRecoveryFirstSel] = useState<string | undefined>();
  const [wrongChainAlert, setWrongChainAlert] = useState<boolean>(false);

  useMemo(() => {
    if (SOCIAL_RECOVERY_CHAINS.includes(genesisHash)) {
      setAcceptedGenesisHashes(genesisHash);
      setWrongChainAlert(false);
    } else {
      setConfigureModalOpen(false);

      setRescueModalOpen(false);

      setAcceptedGenesisHashes(undefined);

      setWrongChainAlert(true);
    }
  }, [genesisHash]);

  const chain = useMetadata(acceptedGenesisHashes, true);
  const endpoint = useEndpoint(accounts, address, chain);
  const api = useApi(endpoint);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(console.error);
  }, []);

  const handleAlladdressesOnThisChain = useCallback((prefix: number): void => {
    const allAddresesOnSameChain = accounts.reduce(function (result: nameAddress[], acc): nameAddress[] {
      const publicKey = decodeAddress(acc.address);

      if (acc.address === address) {
        setAccount({ accountId: encodeAddress(publicKey, prefix), identity: { display: acc?.name } });

        // return result; // ignore the current account, I can not be a friend of mine
      }

      result.push({ address: encodeAddress(publicKey, prefix), name: acc?.name });

      return result;
    }, []);

    setAddresesOnThisChain(allAddresesOnSameChain);
  }, [accounts, address]);

  const isRecovering = useCallback((address: string, chain: Chain, endpoint: string): void => {
    if (!endpoint || !address || !chain) { return; }

    const isRecoveringWorker: Worker = new Worker(new URL('../../util/workers/isRecovering.js', import.meta.url));

    isRecoveringWorker.postMessage({ address, chain, endpoint });

    isRecoveringWorker.onerror = (err) => {
      console.log(err);
    };

    isRecoveringWorker.onmessage = (e) => {
      const rescuer: Rescuer | undefined = e.data as unknown as Rescuer | undefined;

      if (rescuer) {
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

  useEffect(() => {
    const prefix: number = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    if (prefix !== undefined) { handleAlladdressesOnThisChain(prefix); }
  }, [chain, settings, handleAlladdressesOnThisChain]);

  useEffect(() => {
    if (!api || !account?.accountId) { return; }

    // eslint-disable-next-line no-void
    void api.query.recovery.recoverable(account.accountId).then((r) => {
      setRecoveryInfo(r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null);
      console.log('is recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [api, account?.accountId]);

  useEffect(() => {
    if (recoveryInfo !== undefined && account?.accountId && chain && endpoint) {
      // check if reacovery is initiated
      isRecovering(String(account.accountId), chain, endpoint);
    }
  }, [account?.accountId, chain, endpoint, isRecovering, recoveryInfo]);

  useEffect(() => {
    api && setRecoveryConsts({
      configDepositBase: api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: api.consts.recovery.recoveryDeposit as unknown as BN
    });
  }, [api]);

  useEffect(() => {
    if (!api) { return; }

    // eslint-disable-next-line no-void
    void api.query.identity.identityOf.entries().then((ids) => {
      console.log(`${ids?.length} accountsInfo fetched from ${chain?.name}`);

      const accountsInfo = ids.map(([key, option]) => {
        return {
          accountId: encodeAddress('0x' + key.toString().slice(82), chain?.ss58Format),
          identity: {
            judgements: option.unwrap().judgements,
            display: hexToString(option.unwrap().info.display.asRaw.toHex()),
            email: hexToString(option.unwrap().info.email.asRaw.toHex()),
            legal: hexToString(option.unwrap().info.legal.asRaw.toHex()),
            riot: hexToString(option.unwrap().info.riot.asRaw.toHex()),
            twitter: hexToString(option.unwrap().info.twitter.asRaw.toHex()),
            web: hexToString(option.unwrap().info.web.asRaw.toHex()),
          }
        };
      });

      setAcountsInfo(accountsInfo);
    });
  }, [address, api, chain?.name, chain?.ss58Format]);

  useEffect(() => {
    if (!rescuer || rescuer?.identity) {
      return;
    }

    const localRescuer = rescuer;
    const maybeLocalrescuer = addresesOnThisChain?.find((l) => l.address === String(rescuer.accountId));

    if (maybeLocalrescuer) {
      localRescuer.nickname = maybeLocalrescuer.name;
    }

    localRescuer !== rescuer && setRescuer(localRescuer);
  }, [addresesOnThisChain, rescuer?.accountId]);

  const openConfigure = useCallback(() => {
    setConfigureModalOpen(true);
  }, []);

  const openRescue = useCallback(() => {
    setRescueModalOpen(true);
  }, []);

  const Option: React.FC<{ icon: React.ReactNode, titleColor: any, text: string, title: string, action: React.MouseEventHandler<HTMLButtonElement> }> = ({ action, icon, text, title, titleColor }) => {
    const name = title.split(' ')[0];

    return (
      <Paper elevation={recoveryFirstSel === name ? 8 : 4} onMouseOver={() => setRecoveryFirstSel(name)} sx={{ borderRadius: '10px', pt: 1, width: '45%' }}>
        <Grid alignItems='center' container direction='column' justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, pt: 3, pb: 1 }}>
          <Grid item>
            {icon}
          </Grid>
          <Grid color={titleColor} item>
            <p>{title.toUpperCase()}</p>
          </Grid>
        </Grid>
        <Grid item sx={{ fontSize: 12, pb: '15px' }} xs={12}>
          <Divider light />
        </Grid>
        <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, height: '170px', px: 2 }}>
          {text}
        </Grid>
        <Grid container justifyContent='center' sx={{ pt: 3, pb: 2 }}>
          <Button
            color='warning'
            disabled={!chain}
            onClick={action}
            sx={{ textTransform: 'none', width: '80%' }}
            variant='contained'
          >
            {name}
          </Button>
        </Grid>
      </Paper>
    );
  };

  const Selection = () => (
    <Grid alignItems='center' container justifyContent='space-around' sx={{ pt: '50px' }} >
      <Option
        action={openConfigure}
        icon={<SecurityIcon color='primary' fontSize='large' />}
        text={t<string>('You can make your account "recoverable", remove recovery from an already recoverable account, or close a recovery process that is initiated by a (malicious) rescuer account.')}
        title='Configure my account'
        titleColor={blue[600]}
      />
      <Option
        action={openRescue}
        icon={<SupportIcon color='success' fontSize='large' />}
        text={t('You can try to rescue another account. As a "rescuer", you can recover a lost account, or as a "friend", you can "vouch" to confirm the recovery of a lost account by a rescuer account.')}
        title='Rescue another account'
        titleColor={'green'}
      />
    </Grid>
  );

  return (
    <>
      <Header showAdd showBackArrow showSettings smallMargin text={`${t<string>('Social Recovery')} ${chain?.name ? 'on' : ''} ${chain?.name ?? ''}`} />
      {wrongChainAlert &&
        <Alert severity='error' sx={{ fontSize: 15, fontWeight: '700', mx: 5, px: 5 }}>
          {t('Social recovery is not available on this chain!')}
        </Alert>
      }
      {!showConfigureModal && !showRescueModal && <Selection />}
      {showConfigureModal &&
        <Configure
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          chain={chain}
          recoveryConsts={recoveryConsts}
          recoveryInfo={recoveryInfo}
          rescuer={rescuer}
          setConfigureModalOpen={setConfigureModalOpen}
          showConfigureModal={showConfigureModal}
        />
      }
      {showRescueModal &&
        <Rscue
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          chain={chain}
          recoveryConsts={recoveryConsts}
          setRescueModalOpen={setRescueModalOpen}
          showRescueModal={showRescueModal}
        />
      }
    </>
  );
}

export default styled(SocialRecovery)`
      height: calc(100vh - 2px);
      overflow: auto;
      scrollbar - width: none;

      &:: -webkit - scrollbar {
        display: none;
      width:0,
        }
      .empty-list {
        text - align: center;
   }`;
