// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/** 
 * @description
 *  this component lists all active crowdloans,which can be selected to contribute to, also page shows winner parachains 
 * */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Container } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { Balance } from '@polkadot/types/interfaces';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Auction, ChainInfo, Crowdloan } from '../../util/plusTypes';
import CrowdloanList from './CrowdloanList';

interface Props extends ThemeProps {
  className?: string;
  auction: Auction;
  chainInfo: ChainInfo;
  endpoints: LinkOption[];
  handleContribute: (crowdloan: Crowdloan) => void;
  myContributions: Map<string, Balance> | undefined;

}

function CrowdloanTab({ auction, chainInfo, className, endpoints, handleContribute, myContributions }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string>('');
  const sortingCrowdloans = (a: Crowdloan, b: Crowdloan) => Number(b.fund.paraId) - Number(a.fund.paraId);// newest first
  const endeds = useMemo(() => auction.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber && !c.fund.hasLeased).sort(sortingCrowdloans), [auction]);
  // const activeCrowdloans = useMemo(() => auction.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber).sort(sortingCrowdloans), [auction]);
  const activeCrowdloans = useMemo(() => auction.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber && !c.fund.hasLeased).sort(sortingCrowdloans), [auction]);
  // const auctionWinners = useMemo(() => auction.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber && c.fund.hasLeased).sort(sortingCrowdloans), [auction]);
  const auctionWinners = useMemo(() => auction.crowdloans.filter((c) => c.fund.hasLeased).sort(sortingCrowdloans), [auction]);

  useEffect(() => {
    if (activeCrowdloans?.length) { setExpanded('Actives'); } else if (auctionWinners?.length) { setExpanded('Winners'); }
  }, [activeCrowdloans, auctionWinners]);

  const handleAccordionChange = useCallback((panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  }, []);

  return (
    <div id='crowdloan-list'>
      <CrowdloanList
        chainInfo={chainInfo}
        crowdloans={activeCrowdloans}
        description={t('view active crowdloans')}
        endpoints={endpoints}
        expanded={expanded}
        handleAccordionChange={handleAccordionChange}
        handleContribute={handleContribute}
        height={340}
        myContributions={myContributions}
        title={t('Actives')}
      />
      <CrowdloanList
        chainInfo={chainInfo}
        crowdloans={auctionWinners}
        description={t('view auction winners')}
        endpoints={endpoints}
        expanded={expanded}
        handleAccordionChange={handleAccordionChange}
        handleContribute={handleContribute}
        height={295}
        myContributions={myContributions}
        title={t('Winners')}
      />
      <CrowdloanList
        chainInfo={chainInfo}
        crowdloans={endeds}
        description={t('view ended crowdloans')}
        endpoints={endpoints}
        expanded={expanded}
        handleAccordionChange={handleAccordionChange}
        handleContribute={handleContribute}
        height={285}
        myContributions={myContributions}
        title={t('Ended')}
      />
    </div>
  );
}

export default styled(CrowdloanTab)`
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
