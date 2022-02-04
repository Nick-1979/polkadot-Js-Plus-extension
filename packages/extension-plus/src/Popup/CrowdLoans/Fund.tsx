// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Email, LaunchRounded, SendTimeExtensionOutlined, Twitter } from '@mui/icons-material';
import { Avatar, Button, Grid, Link, Paper } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../../util/getLogo';
import getNetworkInfo from '../../util/getNetwork';
import { Crowdloan } from '../../util/plusTypes';
import { amountToHuman, getWebsiteFavico } from '../../util/plusUtils';
import { Chain } from '../../../../extension-chains/src/types';
import getChainInfo from '../../util/getChainInfo';

interface Props {
  coin: string;
  crowdloan: Crowdloan;
  decimals: number;
  endpoints: LinkOption[];
  isActive?: boolean;
  handleContribute?: (arg0: Crowdloan) => void
}

export default function Fund({ coin, crowdloan, decimals, endpoints, handleContribute, isActive }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const getText = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.text as string);
  const getHomePage = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.homepage as string);
  const getInfo = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.info as string);
  const display = crowdloan.identity.info.legal || crowdloan.identity.info.display || getText(crowdloan.fund.paraId);
  const logo = getLogo(getInfo(crowdloan.fund.paraId)) || getWebsiteFavico(crowdloan.identity.info.web || getHomePage(crowdloan.fund.paraId));

  return (
    <Grid item sx={{ paddingTop: '10px' }} xs={12}>
      <Paper elevation={3}>
        <Grid alignItems='center' container sx={{ padding: '10px' }}>
          <Grid container item justifyContent='flex-start' spacing={1} sx={{ fontSize: 13, fontWeight: 'fontWeightBold' }} xs={6}>
            <Grid item>
              <Avatar
                src={logo}
                sx={{ height: 24, width: 24 }}
              />
            </Grid>

            <Grid item>
              {display?.slice(0, 15)}
            </Grid>

            {(crowdloan.identity.info.web || getHomePage(crowdloan.fund.paraId)) &&
              <Grid item>
                <Link
                  href={crowdloan.identity.info.web || getHomePage(crowdloan.fund.paraId)}
                  rel='noreferrer'
                  target='_blank'
                >
                  <LaunchRounded
                    color='primary'
                    sx={{ fontSize: 15 }}
                  />
                </Link>
              </Grid>
            }

            {crowdloan.identity.info.twitter &&
              <Grid item>
                <Link href={`https://twitter.com/${crowdloan.identity.info.twitter}`}>
                  <Twitter
                    color='primary'
                    sx={{ fontSize: 15 }}
                  />
                </Link>
              </Grid>
            }

            {crowdloan.identity.info.email &&
              <Grid item>
                <Link href={`mailto:${crowdloan.identity.info.email}`}>
                  <Email
                    color='secondary'
                    sx={{ fontSize: 15 }}
                  />
                </Link>
              </Grid>}
          </Grid>

          <Grid sx={{ fontSize: 11, textAlign: 'center' }} xs={3}>
            {t('Leases')}{': '} {String(crowdloan.fund.firstPeriod)} - {String(crowdloan.fund.lastPeriod)}
          </Grid>
          <Grid sx={{ fontSize: 11, textAlign: 'right' }} xs={3}>
            {t('End')}:  # {crowdloan.fund.end}
          </Grid>

          <Grid container item xs={12} justifyContent='space-between' sx={{ marginTop: '5px' }}>

            <Grid sx={{ color: crowdloan.fund.hasLeased ? 'green' : '', fontSize: 11, marginLeft: '20px', textAlign: 'left' }}>
              Parachain Id: {' '} {crowdloan.fund.paraId}
            </Grid>

            <Grid sx={{ fontSize: 11, textAlign: 'center' }}>
              <b>{Number(amountToHuman(crowdloan.fund.raised, decimals)).toLocaleString()}</b>
              /
              {Number(amountToHuman(crowdloan.fund.cap, decimals)).toLocaleString()}
              <br />
              {t('Raised/Cap')}{' '}({coin})
            </Grid>

          </Grid>

          {isActive && handleContribute &&
            <Grid container item justifyContent='center' xs={12}>
              <Button
                color='warning'
                endIcon={<SendTimeExtensionOutlined />}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleContribute(crowdloan)}
                variant='outlined'
              >
                {t('Next')}
              </Button>
            </Grid>
          }
        </Grid>
      </Paper >
    </Grid >
  );
}
