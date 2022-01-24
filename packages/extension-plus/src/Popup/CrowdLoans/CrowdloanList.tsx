// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Grid, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ChainInfo, Crowdloan } from '../../util/plusTypes';
import Fund from './Fund';

interface Props {
  chainInfo: ChainInfo; crowdloans: Crowdloan[];
  description: string;
  endpoints: LinkOption[];
  expanded: string;
  handleAccordionChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  handleContribute: (Crowdloan) => void;
  height: number;
  title: string;
}

export default function CrowdloanList({ chainInfo, crowdloans, description, endpoints, expanded, handleAccordionChange, handleContribute, height, title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const selectedTab = title.toLocaleLowerCase();

  return (
    <Accordion disableGutters expanded={expanded === selectedTab} onChange={handleAccordionChange(selectedTab)} sx={{ backgroundColor: grey[300], flexGrow: 1 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant='body2' sx={{ flexShrink: 0, width: '33%' }}>
          {title}({crowdloans?.length})
        </Typography>
        <Typography variant='caption' sx={{ color: 'text.secondary' }}>{description}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ height: height, overflowY: 'auto' }}>
        {crowdloans?.length
          ? crowdloans.map((c) => (
            <Grid container item key={c.fund.paraId} xs={12}>
              {c.fund.paraId &&
                <Fund coin={chainInfo.coin} decimals={chainInfo.decimals} endpoints={endpoints} crowdloan={c} handleContribute={handleContribute} isActive={selectedTab === 'active'} />
              }
            </Grid>

          ))
          : <Grid item xs={12} sx={{ fontSize: 12, textAlign: 'center' }}> {t('There is no item to show')}</Grid>
        }
      </AccordionDetails>
    </Accordion>
  );
}
