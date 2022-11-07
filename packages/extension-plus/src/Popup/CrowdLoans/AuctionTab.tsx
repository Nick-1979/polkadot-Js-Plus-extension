// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 *  this component renders auction tab which show an ongoing auction information along with a possible parachain bids/winning 
 * 
 * auction start                                                                                                      Auction ends
 * 
 *  |--------27000 blocks (grace period ~ 2days)---------||===========72000 blocks (candle Phase ~ 5days)============|||
 * */
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Avatar, Grid, LinearProgress, Paper } from '@mui/material';
import { deepOrange, grey } from '@mui/material/colors';
import React from 'react';
import styled from 'styled-components';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { Balance } from '@polkadot/types/interfaces';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { NothingToShow } from '../../components';
import { AUCTION_GRACE_PERIOD } from '../../util/constants';
import { Auction, ChainInfo } from '../../util/plusTypes';
import { remainingTime } from '../../util/plusUtils';
import Fund from './Fund';

interface Props extends ThemeProps {
  className?: string;
  auction: Auction;
  chainInfo: ChainInfo;
  endpoints: LinkOption[];
  myContributions: Map<string, Balance> | undefined;
}

function AuctionTab({ auction, chainInfo, className, endpoints, myContributions }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const firstLease = auction?.auctionInfo && Number(auction?.auctionInfo[0]);
  const candlePhaseStartBlock = auction?.auctionInfo && Number(auction?.auctionInfo[1]);
  const lastLease = Number(chainInfo.api.consts.auctions.leasePeriodsPerSlot.toString()) - 1;
  const endingPeriod = Number(chainInfo.api.consts.auctions?.endingPeriod.toString());
  const AUCTION_START_BLOCK = candlePhaseStartBlock - AUCTION_GRACE_PERIOD;

  const currentBlock = Number(auction.currentBlockNumber);
  const start = currentBlock < candlePhaseStartBlock ? AUCTION_START_BLOCK : candlePhaseStartBlock;
  const end = currentBlock < candlePhaseStartBlock ? candlePhaseStartBlock : candlePhaseStartBlock + endingPeriod;
  const stageInHuman = currentBlock < candlePhaseStartBlock ? t('auction stage') : t('ending stage');

  const ShowBids = (): React.ReactElement => {
    const winning = auction?.winning.find((x) => x);

    if (!winning) { return <div />; }

    const crowdloan = auction?.crowdloans.find((c) => c.fund.paraId === winning[1].replace(/,/g, ''));

    if (!crowdloan) { return <div />; }

    return (
      <Grid container>
        <Grid item sx={{ color: grey[600], fontSize: 15 }} xs={12}>
          <Paper elevation={1} sx={{ paddingLeft: '10px' }}>
            {t('Bids')}
          </Paper>
        </Grid>
        <Fund coin={chainInfo.coin} crowdloan={crowdloan} decimals={chainInfo.decimals} endpoints={endpoints} myContributions={myContributions} />
      </Grid>
    );
  };

  const ShowAuction = () => (
    <Paper elevation={6} sx={{ backgroundColor: grey[100], margin: '20px' }}>
      <Grid container item justifyContent='flex-start' sx={{ padding: '15px 10px 15px' }}>
        <Grid item xs={1}>
          <Avatar sx={{ bgcolor: deepOrange[500], fontSize: 13, height: 30, width: 30 }}>
            #{auction.auctionCounter}
          </Avatar>
        </Grid>
        <Grid item sx={{ fontSize: 15, fontWeight: 'fontWeightBold' }} xs={3}>
          {t('Auction')}
        </Grid>
        <Grid item sx={{ fontSize: 12, fontWeight: 600, textAlign: 'left' }} xs={3}>
          {t('Lease')}<br />
          {t('Current block')}<br />
          {t('Auction stage')}  <br />
          {t('Ending stage')}
        </Grid>
        <Grid item sx={{ fontSize: 12, textAlign: 'right' }} xs={5}>
          {firstLease} {' - '}{firstLease + lastLease}<br />
          {currentBlock}<br />
          {AUCTION_START_BLOCK}{' - '}{candlePhaseStartBlock}<br />
          {candlePhaseStartBlock}{' - '}{candlePhaseStartBlock + endingPeriod}
        </Grid>
        {/* <Grid item sx={{ color: grey[600], fontSize: 12, textAlign: 'left', pl: '5px' }} xs={1}>
          {t('slots')}<br />
          {t('block')}<br />
          {t('blocks')}<br />
          {t('blocks')}<br />
        </Grid> */}

        <Grid item sx={{ pt: '20px' }} xs={12}>
          <LinearProgress
            color='warning'
            sx={{ backgroundColor: 'black' }}
            value={100 * (Number(currentBlock) - start) / (end - start)}
            variant='determinate'
          />
        </Grid>

        <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12 }} xs={12}>
          <Grid item sx={{ color: 'green' }}>
            {t('Remaining Time')}{': '} {remainingTime(end - currentBlock)}
          </Grid>
          <Grid item sx={{ color: grey[600] }}>
            {t('in')} {stageInHuman}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <>
      {auction && !auction?.auctionInfo &&
        <NothingToShow text={t('There is no active auction')} />
      }

      {auction && auction?.auctionInfo &&
        <>
          <ShowAuction />
          <ShowBids />
        </>
      }
    </>
  );
}

export default styled(AuctionTab)`
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
