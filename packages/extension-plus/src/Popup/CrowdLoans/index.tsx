// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 * this component opens crowdloan page, which shows auction and crowdloan tab,
 * where a relay chain can be selected to view available auction/crowdloans 
 * */

import type { DeriveOwnContributions } from '@polkadot/api-derive/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Gavel as GavelIcon, InfoOutlined as InfoOutlinedIcon, Payments as PaymentsIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { ApiPromise } from '@polkadot/api';
import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountsStore } from '@polkadot/extension-base/stores';
import { Chain } from '@polkadot/extension-chains/types';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import { Progress } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { AddressState, Auction, ChainInfo, Crowdloan } from '../../util/plusTypes';
import AuctionTab from './AuctionTab';
import Contribute from './Contribute';
import CrowdloanTab from './CrowdloanTab';
import InfoTab from './InfoTab';

interface Props extends ThemeProps {
  className?: string;
}

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

function Crowdloans({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const settings = useContext(SettingsContext);
  const { address, genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);

  const [contributingTo, setContributingTo] = useState<Crowdloan | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [tabValue, setTabValue] = useState('auction');
  const [contributeModal, setContributeModalOpen] = useState<boolean>(false);
  const [endpoints, setEndpoints] = useState<LinkOption[]>([]);
  const [chainInfo, setChainInfo] = useState<ChainInfo>();
  const [myContributions, setMyContributions] = useState<Map<string, Balance> | undefined>();

  const getHexEncodedAddress = (api: ApiPromise, chain: Chain, address: string, settings: SettingsStruct): string => {
    const prefix: number = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);
    const publicKey = decodeAddress(address);

    const encodedAddress = encodeAddress(publicKey, prefix);

    return api.createType('AccountId', encodedAddress).toHex();
  };

  function getCrowdloands(_selectedBlockchain: string) {
    const crowdloanWorker: Worker = new Worker(new URL('../../util/workers/getCrowdloans.js', import.meta.url));
    const chain = _selectedBlockchain;// TODO: change it

    crowdloanWorker.postMessage({ chain });

    crowdloanWorker.onerror = (err) => {
      console.log(err);
    };

    crowdloanWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Auction = e.data;

      console.log('Auction:', result);
      setAuction(result);

      crowdloanWorker.terminate();
    };
  }

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(genesisHash).then((chainInfo) => {
      setChainInfo(chainInfo);
      setAuction(null);
      setContributingTo(null);
      getCrowdloands(chainInfo.chainName);

      const endpoints = allEndpoints.filter((e) => (e.genesisHashRelay === genesisHash));

      setEndpoints(endpoints);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genesisHash]);

  useEffect(() => {
    if (!auction || !chain || !settings || !chainInfo) { return; }

    const { api } = chainInfo;
    const paraIds = auction.crowdloans.map((c: Crowdloan) => c.fund.paraId);
    const myHexAddress = getHexEncodedAddress(api, chain, address, settings);
    const myAccountsHex = [myHexAddress];

    Promise.all(paraIds.map((id): Promise<DeriveOwnContributions> => api.derive.crowdloan.ownContributions(id, myAccountsHex)))
      .then((myContributions) => {
        const myContibutionsMap: Map<string, Balance> = new Map();

        myContributions.forEach((m, index) => myContibutionsMap.set(paraIds[index], m[myHexAddress]));
        setMyContributions(myContibutionsMap);
      }).catch(console.error);
  }, [address, auction, chainInfo, chain, settings]);

  const handleContribute = useCallback((crowdloan: Crowdloan): void => {
    setContributingTo(crowdloan);

    setContributeModalOpen(true);
  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  return (
    <>
      <Header
        showAdd
        showBackArrow
        showSettings
        smallMargin
        text={`${t<string>('Crowdloans')} ${chainInfo?.chainName ? 'on' : ''} ${chainInfo?.chainName ?? ''}`}
      />
      <Grid alignItems='center' container id='selectRelyChain' sx={{ p: '0px 24px' }}>
        <Grid item sx={{ borderBottom: 1, borderColor: 'divider' }} xs={12}>
          <Tabs
            indicatorColor='secondary'
            onChange={handleTabChange}
            sx={{ minHeight: '60px' }}
            textColor='secondary'
            value={tabValue}
            variant='fullWidth'>
            <Tab
              icon={<GavelIcon fontSize='small' />}
              iconPosition='start'
              label='Auction'
              sx={{ fontSize: 11, minHeight: '60px', px: '5px' }}
              value='auction'
            />
            <Tab
              icon={<PaymentsIcon fontSize='small' />}
              iconPosition='start' label='Crowdloans'
              sx={{ fontSize: 11, minHeight: '60px', px: '5px' }}
              value='crowdloan'
            />
            <Tab
              icon={<InfoOutlinedIcon fontSize='small' />}
              iconPosition='start' label='Info'
              sx={{ fontSize: 11, minHeight: '60px', px: '5px' }}
              value='info'
            />
          </Tabs>
        </Grid>
      </Grid>
      {!auction &&
        <Progress title={t('Loading Auction/Crowdloans ...')} />
      }
      {auction && tabValue === 'auction' && chainInfo &&
        <AuctionTab
          auction={auction}
          chainInfo={chainInfo}
          endpoints={endpoints}
          myContributions={myContributions}
        />
      }
      {auction && tabValue === 'crowdloan' && chainInfo &&
        <CrowdloanTab
          auction={auction}
          chainInfo={chainInfo}
          endpoints={endpoints}
          handleContribute={handleContribute}
          myContributions={myContributions}
        />
      }
      {auction && tabValue === 'info' && chainInfo &&
        <InfoTab
          auction={auction}
          chainInfo={chainInfo}
          endpoints={endpoints}
          myContributions={myContributions}
        />
      }
      {contributeModal && auction && contributingTo && chainInfo &&
        <Contribute
          address={address}
          auction={auction}
          chainInfo={chainInfo}
          contributeModal={contributeModal}
          crowdloan={contributingTo}
          endpoints={endpoints}
          myContributions={myContributions}
          setContributeModalOpen={setContributeModalOpen}
        />
      }
    </>
  );
}

export default styled(Crowdloans)`
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
