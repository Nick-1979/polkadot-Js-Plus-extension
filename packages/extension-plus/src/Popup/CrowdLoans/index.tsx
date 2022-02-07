
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Gavel as GavelIcon, Payments as PaymentsIcon } from '@mui/icons-material';
import { Avatar, Grid, Paper, Tab, Tabs } from '@mui/material';
import { deepOrange } from '@mui/material/colors';
import grey from '@mui/material/colors/grey';
import { SelectChangeEvent } from '@mui/material/Select';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import { NothingToShow, Progress } from '../../components';
import SelectRelay from '../../components/SelectRelay';
import getChainInfo from '../../util/getChainInfo';
import { Auction, ChainInfo, Crowdloan } from '../../util/plusTypes';
import Contribute from './Contribute';
import CrowdloanList from './CrowdloanList';
import Fund from './Fund';

interface Props extends ThemeProps {
  className?: string;
}

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

function Crowdloans({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [contributingTo, setContributingTo] = useState<Crowdloan | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [activeCrowdloans, setActiveCrowdloans] = useState<Crowdloan[] | undefined>(undefined);
  const [auctionWinners, setAuctionWinners] = useState<Crowdloan[] | undefined>(undefined);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [tabValue, setTabValue] = React.useState('auction');
  const [contributeModal, setContributeModalOpen] = useState<boolean>(false);
  const [endpoints, setEndpoints] = useState<LinkOption[]>([]);
  const [expanded, setExpanded] = React.useState<string>('active');
  const [chainInfo, setChainInfo] = useState<ChainInfo>();

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

      console.log('auction: %o', result);

      if (result.blockchain === selectedChain) {
        setAuction(result);
      }

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
    if (selectedChain) {
      setAuction(null);
      setContributingTo(null);
      getCrowdloands(selectedChain);

      // eslint-disable-next-line no-void
      void getChainInfo(selectedChain).then((i) => setChainInfo(i));

      const { genesisHash } = allEndpoints.find((e: LinkOption) => (String(e.text).toLowerCase() === selectedChain.toLowerCase())) as LinkOption;
      const endpoints = allEndpoints.filter((e) => (e.genesisHashRelay === genesisHash));

      setEndpoints(endpoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChain]);

  useEffect(() => {
    setActiveCrowdloans(auction?.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber && !c.fund.hasLeased));
    setAuctionWinners(auction?.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber || c.fund.hasLeased));
  }, [auction]);

  const handleChainChange = (event: SelectChangeEvent) => {
    setSelectedChain(event.target.value);
  };

  const handleContribute = useCallback((crowdloan: Crowdloan): void => {
    setContributingTo(crowdloan);

    setContributeModalOpen(true);
  }, []);

  const handleAccordionChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : '');
    };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const ShowBids = (): React.ReactElement => {
    const winning = auction?.winning.find((x) => x);

    if (!winning) return <div />;

    const crowdloan = auction?.crowdloans.find((c) => c.fund.paraId === winning[1].replaceAll(',', ''));

    if (!crowdloan) return <div />;

    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper elevation={3}>
            <Grid sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, paddingLeft: '10px' }}>
              {t('Bids')}
            </Grid>
            <Fund coin={chainInfo.coin} crowdloan={crowdloan} decimals={chainInfo.decimals} endpoints={endpoints} />
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const ShowAuction = () => (
    <Paper elevation={6} sx={{ backgroundColor: grey[100], margin: '20px' }}>
      <Grid container item justifyContent='flex-start' sx={{ padding: '15px 10px 15px' }}>
        <Grid item xs={1}>
          <Avatar sx={{ bgcolor: deepOrange[500], fontSize: 13, height: 30, width: 30, }}>
            #{auction.auctionCounter}
          </Avatar>
        </Grid>
        <Grid item xs={3} sx={{ fontSize: 15, fontWeight: 'fontWeightBold' }}>{t('Auction')}</Grid>
        <Grid item xs={4} sx={{ fontSize: 12, textAlign: 'center' }}>{t('Lease')}: {' '} {auction.auctionInfo[0]}</Grid>
        <Grid item xs={4} sx={{ fontSize: 12, textAlign: 'right' }}>{t('Stage')}: {' #'} {auction.auctionInfo[1]}</Grid>
        <Grid item xs={12} sx={{ fontSize: 12, textAlign: 'right' }}>{t('current block')}:{' #'}{auction.currentBlockNumber}</Grid>
      </Grid>
    </Paper>
  );

  return (
    <>
      <Header showAdd showBackArrow showSettings smallMargin text={t<string>('Crowdloan')}/>
      <Grid container id='selectRelyChain' sx={{ padding: '5px 35px' }} alignItems='center'>
       
        <Grid item xs={12}>
          <SelectRelay selectedChain={selectedChain} handleChainChange={handleChainChange} hasEmpty />
        </Grid>

        <Grid item xs={12} >
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab icon={<GavelIcon fontSize='small' />} iconPosition='start' label='Auction' sx={{ fontSize: 11 }} value='auction' />
            <Tab icon={<PaymentsIcon fontSize='small' />} iconPosition='start' label='Crowdloans' sx={{ fontSize: 11 }} value='crowdloan' />
          </Tabs>

        </Grid>
      </Grid>

      {!auction && selectedChain &&
        <Progress title={t('Loading Auction/Crowdloans of ') + ` ${selectedChain.charAt(0).toUpperCase()}${selectedChain.slice(1)} ...`} />
      }

      {auction && !auction.auctionInfo && tabValue === 'auction' &&
        <NothingToShow text={t('There is no active auction')} />
      }

      {auction && auction.auctionInfo && tabValue === 'auction' &&
        <>
          <ShowAuction />
          <ShowBids />
        </>
      }

      {auction && tabValue === 'crowdloan' &&
        <Grid container id='crowdloan-list'>
          <CrowdloanList chainInfo={chainInfo} crowdloans={activeCrowdloans} description={t('view active crowdloans')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={250} title={t('Active')} />
          <CrowdloanList chainInfo={chainInfo} crowdloans={auctionWinners} description={t('view auction winers')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={200} title={t('Winners')} />
          <CrowdloanList chainInfo={chainInfo} crowdloans={[]} description={t('view ended crowdloans')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={150} title={t('Ended')} />
        </Grid>
      }

      {contributeModal && auction && contributingTo &&
        <Contribute
          auction={auction}
          chainInfo={chainInfo}
          contributeModal={contributeModal}
          crowdloan={contributingTo}
          endpoints={endpoints}
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
  }
        `;
