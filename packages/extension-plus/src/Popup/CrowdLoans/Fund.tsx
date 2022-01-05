/* eslint-disable header/header */
// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { Email, LaunchRounded, SendTimeExtensionOutlined, Twitter } from '@mui/icons-material';
import { Avatar, Button, Grid, Link, Paper } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import getNetworkInfo from '../../util/getNetwork';
import { Crowdloan } from '../../util/pjpeTypes';
import { amountToHuman } from '../../util/pjpeUtils';
import { getLogo } from './getLogo';

interface Props {
  chainName: string;
  crowdloan: Crowdloan;
  endpoints: LinkOption[];
  isActive?: boolean;
  handleContribute?: (arg0: Crowdloan) => void
}

export default function Fund({ chainName, crowdloan, endpoints, handleContribute, isActive }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [decimals, setDecimals] = useState<number>(1);
  const [coin, setCoin] = useState<string>('');

  const getText = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.text as string);
  const getHomePage = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.homepage as string);
  const getInfo = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.info as string);

  useEffect(() => {
    if (chainName) {
      const { coin, decimals } = getNetworkInfo(null, chainName);
      setCoin(coin);

      setDecimals(decimals);
    }
  }, [chainName]);

  return (
    <Grid item sx={{ paddingTop: '10px' }} xs={12}>
      <Paper elevation={3}>
        <Grid alignItems='center' container sx={{ padding: '10px' }}>
          <Grid container item justifyContent='flex-start' spacing={1} sx={{ fontSize: 13, fontWeight: 'fontWeightBold' }} xs={6}>
            <Grid item>
              {/* {(crowdloan.identity.info.web || getHomePage(crowdloan.fund.paraId)) &&
                <Avatar
                  src={getWebsiteFavico(crowdloan.identity.info.web || getHomePage(crowdloan.fund.paraId))}
                  sx={{ height: 24, width: 24 }}
                />
              }  */}

              <Avatar
                src={getLogo(getInfo(crowdloan.fund.paraId))}
                sx={{ height: 24, width: 24 }}
              />

            </Grid>

            <Grid item>
              {crowdloan.identity.info.legal || crowdloan.identity.info.display || getText(crowdloan.fund.paraId)}
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
            Leases: {' '} {String(crowdloan.fund.firstPeriod)} - {String(crowdloan.fund.lastPeriod)}
          </Grid>
          <Grid sx={{ fontSize: 11, textAlign: 'right' }} xs={3}>
            End: {' '} {String(crowdloan.fund.end)}
          </Grid>

          <Grid container item xs={12} justifyContent='space-between' sx={{ marginTop: '5px' }}>

            <Grid sx={{ fontSize: 11, marginLeft: '20px', textAlign: 'left' }}>
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
      </Paper>
    </Grid>
  );
}
