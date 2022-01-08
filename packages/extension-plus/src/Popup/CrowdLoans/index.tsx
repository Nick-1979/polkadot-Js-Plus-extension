/* eslint-disable header/header */
// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { ExpandMore, Gavel as GavelIcon, Groups as GroupsIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, CircularProgress, FormControl, FormHelperText, Grid, InputLabel, MenuItem, Paper, Select, Tab, Tabs, Typography } from '@mui/material';
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
import { RELAY_CHAINS } from '../../util/constants';
import getChainLogo from '../../util/getChainLogo';
import getNetworkInfo from '../../util/getNetwork';
import { Auction, Crowdloan } from '../../util/pjpeTypes';
import { NothingToShow } from '../common/NothingToShow';
import ConfirmCrowdloan from './ConfirmContribution';
import Fund from './Fund';

interface Props extends ThemeProps {
  className?: string;
}

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

function Crowdloans({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [decimals, setDecimals] = useState<number>(1);
  const [contributingTo, setContributingTo] = useState<Crowdloan | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [activeCrowdloans, setActiveCrowdloans] = useState<Crowdloan[] | undefined>(undefined);
  const [auctionWinners, setAuctionWinners] = useState<Crowdloan[] | undefined>(undefined);
  const [selectedBlockchain, setSelectedBlockchain] = useState<string>('');
  const [tabValue, setTabValue] = React.useState('auction');
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [endpoints, setEndpoints] = useState<LinkOption[]>([]);
  const [expanded, setExpanded] = React.useState<string | false>(false);

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

      if (result.blockchain == selectedBlockchain) {
        setAuction(result);
      }

      crowdloanWorker.terminate();
    };
  }

  useEffect(() => {
    try {
      // eslint-disable-next-line no-void
      void cryptoWaitReady().then(() => {
        keyring.loadAll({ store: new AccountsStore() });
      });
    } catch (e) {
      console.log('Keyring is already loaded ', e);
    }
  }, []);

  useEffect(() => {
    if (selectedBlockchain) {
      setAuction(null);
      setContributingTo(null);

      getCrowdloands(selectedBlockchain);

      const { decimals } = getNetworkInfo(null, selectedBlockchain);

      setDecimals(decimals);

      const { genesisHash } = allEndpoints.find((e: LinkOption) => (String(e.text).toLowerCase() === selectedBlockchain.toLowerCase())) as LinkOption;
      const endpoints = allEndpoints.filter((e) => (e.genesisHashRelay === genesisHash));

      setEndpoints(endpoints);

      console.log('endpoints: %o', endpoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlockchain]);

  useEffect(() => {
    setActiveCrowdloans(auction?.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber));
    setAuctionWinners(auction?.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber ));
  }, [auction]);

  // const _onChangeFilter = useCallback((filter: string) => {
  //   setFilter(filter);
  // }, []);

  const handleBlockchainChange = (event: SelectChangeEvent) => {
    setSelectedBlockchain(event.target.value);
  };

  const handleContribute = useCallback((crowdloan: Crowdloan): void => {
    setContributingTo(crowdloan);

    setConfirmModalOpen(true);
  }, []);

  const handleAccordionChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const showCrowdloans = (type: string): React.ReactElement => {
    let crowdloans: Crowdloan[] | undefined;

    switch (type) {
      case ('active'):
        crowdloans = activeCrowdloans;
        break;
      case ('winers'):
        crowdloans = auctionWinners;
        break;
      default:
        console.log('Unknown type');
        break;
    }

    return (
      <div>
        {crowdloans?.length
          ? crowdloans.map((crowdloan) => (
            <Grid container item key={crowdloan.fund.paraId} xs={12}>
              {crowdloan.fund.paraId &&
                <Fund chainName={selectedBlockchain} endpoints={endpoints} crowdloan={crowdloan} handleContribute={handleContribute} isActive={type === 'active'} />
              }
            </Grid>

          ))
          : <Grid item xs={12} sx={{ fontSize: 12, textAlign: 'center' }}> {t('There is no item to show')}</Grid>
        }
      </div>
    );
  };

  const ShowBids = (): React.ReactElement => {
    const winning = auction?.winning.find((x) => x);

    if (!winning) return <div />;

    const crowdloan = auction?.crowdloans.find((c) => c.fund.paraId === winning[1].replaceAll(',', ''));

    if (!crowdloan) return <div />;

    return (
      <Paper elevation={3}>
        <Grid item container xs={12} sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, paddingLeft: '10px' }} >
          {t('Bids')}
        </Grid>
        <Fund chainName={selectedBlockchain} endpoints={endpoints} crowdloan={crowdloan} />
      </Paper>
    );
  };

  return (
    <>
      <Header
        showBackArrow
        smallMargin
        text={t<string>('Crowdloan')}
      />
      <>
        {/* <InputFilter
          onChange={_onChangeFilter}
          placeholder={t<string>('parachain name')}
          value={filter}
        /> */}
        <Grid container id='selectRelyChain' sx={{ padding: '5px 35px' }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id='select-blockchain'>{t('Relay chain')}</InputLabel>
              <Select
                value={selectedBlockchain}
                label='Select blockchain'
                onChange={handleBlockchainChange}
                sx={{ height: 50 }}
              >
                {RELAY_CHAINS.map((chain) =>
                  <MenuItem key={chain.name} value={chain.name.toLowerCase()}>
                    <Grid container alignItems='center' justifyContent='space-between'>
                      <Grid item>
                        <Avatar
                          alt={'logo'}
                          src={getChainLogo(null, chain.name.toLowerCase())}
                          sx={{ height: 24, width: 24 }}
                        />
                      </Grid>
                      <Grid item sx={{ fontSize: 15 }}>
                        {chain.name}
                      </Grid>
                    </Grid>
                  </MenuItem>
                )}
              </Select>
              {!selectedBlockchain && <FormHelperText>{t('Please select a relay chain')}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sx={{ paddingBottom: '10px' }}>
            <Tabs
              indicatorColor='secondary'
              onChange={handleTabChange}
              // centered
              textColor='secondary'
              value={tabValue}
              variant='fullWidth'
            >
              <Tab icon={<GavelIcon fontSize='small' />} iconPosition='start' label='Auction' sx={{ fontSize: 11 }} value='auction' />
              <Tab icon={<GroupsIcon fontSize='small' />} iconPosition='start' label='Crowdloans' sx={{ fontSize: 11 }} value='crowdloan' />
            </Tabs>

          </Grid>
        </Grid>

        {!auction && selectedBlockchain &&
          <Grid container id='progressAlert' xs={12} sx={{ padding: '100px 100px 20px ', textAlign: 'center' }}>
            <Grid item xs={12}>
              <CircularProgress />
            </Grid>

            <Grid item xs={12} sx={{ fontSize: '10' }}>
              {t('Getting Auction/Crowdloans on')} {selectedBlockchain.charAt(0).toUpperCase() + selectedBlockchain.slice(1)} ...
            </Grid>

          </Grid>
        }

        {auction && !auction.auctionInfo && tabValue === 'auction' &&
          <NothingToShow text={t('There is no active auction')} />
        }

        {auction && auction.auctionInfo && tabValue === 'auction' &&
          <Paper elevation={6} sx={{ backgroundColor: grey[100], margin: '20px' }}>
            <Grid container item justifyContent='flex-start' sx={{ padding: '15px 10px 15px' }}>
              <Grid item xs={1} >
                <Avatar sx={{ bgcolor: deepOrange[500], fontSize: 13, height: 30, width: 30, }}>
                  #{auction.auctionCounter}
                </Avatar>
              </Grid>
              <Grid item xs={3} container justifyContent='flex-start'>
                <Grid sx={{ fontSize: 15, fontWeight: 'fontWeightBold' }}>Auction</Grid>
              </Grid>
              <Grid item xs={4} sx={{ fontSize: 12, textAlign: 'center' }}>Lease: {' '} {auction.auctionInfo[0]}</Grid>
              <Grid item xs={4} sx={{ fontSize: 12, textAlign: 'right' }}>Stage: {' '} {auction.auctionInfo[1]}</Grid>
            </Grid>
          </Paper>
        }

        {auction && tabValue === 'auction' &&
          <Grid container item xs={12}>
            <Grid item xs={12}>
              <ShowBids />
            </Grid>
          </Grid>
        }

        {auction && tabValue === 'crowdloan' &&
          <Grid container id='crowdloan-list'>

            <Accordion disableGutters expanded={expanded === 'active'} onChange={handleAccordionChange('active')}
              sx={{ backgroundColor: grey[200], flexGrow: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                id='activeCrowdloansHeader'
              >
                <Typography sx={{ flexShrink: 0, width: '33%' }} variant='body2'>
                  {t('Active')}({activeCrowdloans?.length})
                </Typography>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>{t('view active crowdloans')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ height: 250, overflowY: 'auto' }}>
                {showCrowdloans('active')}
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters expanded={expanded === 'winners'} onChange={handleAccordionChange('winners')}
              sx={{ backgroundColor: grey[300], flexGrow: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                id='crowdloansWinnersHeader'
              >
                <Typography variant='body2' sx={{ width: '33%', flexShrink: 0 }}>
                  {t('Winers')}({auctionWinners?.length})
                </Typography>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>{t('view auction winers')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ height: 200, overflowY: 'auto' }}>
                {showCrowdloans('winers')}
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters expanded={expanded === 'ended'} onChange={handleAccordionChange('ended')}
              sx={{ backgroundColor: grey[400], flexGrow: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />} id='crowdloansEndedHeader'>
                <Typography variant='body2' sx={{ width: '33%', flexShrink: 0 }}>
                  {t('Ended')}(0)
                </Typography>
                <Typography variant='caption'
sx={{ color: 'text.secondary' }}>{t('view ended crowdloans')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {showCrowdloans('ended')}
              </AccordionDetails>
            </Accordion>
          </Grid>
        }

        {
          confirmModalOpen && auction && contributingTo &&
          <ConfirmCrowdloan
            auction={auction}
            confirmModalOpen={confirmModalOpen}
            crowdloan={contributingTo}
            decimals={decimals}
            endpoints={endpoints}
            selectedBlockchain={selectedBlockchain}
            setConfirmModalOpen={setConfirmModalOpen}

          />
        }
      </>
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
    text-align: center;
  }
`;
