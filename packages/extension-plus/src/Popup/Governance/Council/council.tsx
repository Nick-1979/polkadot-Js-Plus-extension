// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CancelOutlined as CancelOutlinedIcon, Email as EmailIcon, HowToReg as HowToRegIcon, LaunchRounded as LaunchRoundedIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { Button, Container, Divider, Grid, Link, Paper } from '@mui/material';
import React, { useEffect } from 'react';

import Identicon from '@polkadot/react-identicon';

import { Chain } from '../../../../../extension-chains/src/types';
import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { CouncilInfo } from '../../../util/plusTypes';
import { amountToHuman } from '../../../util/plusUtils';
import { grey } from '@mui/material/colors';

interface Props {
  councilInfo: CouncilInfo;
  genesisHash: string;
  coin: string;
  decimals: number;
  currentBlockNumber: number;
}

export default function Council({ coin, councilInfo, currentBlockNumber, decimals, genesisHash }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(genesisHash, true);

  console.log('councilInfo', councilInfo);

  const { accountInfos, members } = councilInfo;

  useEffect(() => {
    console.log('chain', chain);
  }, [chain])

  return (
    <Container disableGutters maxWidth='md'>
      <Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 40px' }}>
        <Grid container justifyContent='space-between' sx={{ textAlign: 'center' }}>
          <Grid item>
            {t('Seats')}<br />
            {members.length}/{councilInfo.desiredSeats.toString()}
          </Grid>
          <Grid item>
            {t('Runners up')}<br />
            {councilInfo.runnersUp.length}/{councilInfo.desiredRunnersUp.toString()}
          </Grid>
          <Grid item>
            {t('Candidates')}<br />
            {councilInfo.candidateCount.toString()}
          </Grid>
        </Grid>

        <Grid item sx={{ padding: '20px 0px 20px ' }}>
          <Divider />
        </Grid>

        <Grid container justifyContent='space-between' sx={{ textAlign: 'center' }}>
          <Grid item>
            {t('My votes')}
          </Grid>
          <Grid item >
            <Button variant='outlined' color='secondary' startIcon={<CancelOutlinedIcon />}> {t('Cancel votes')}</Button>
          </Grid>
          <Grid item >
            <Button variant='contained' color='warning' startIcon={<HowToRegIcon />}> {t('Vote')}</Button>
          </Grid>
        </Grid>
      </Paper>

      <Container id='scrollArea' sx={{ height: '300px', overflowY: 'auto' }}>
        <Grid xs={12} sx={{ fontSize: 14, fontWeigth: 'bold', textAlign: 'center', padding: '20px 1px 10px' }}>
          {t('Members')}
        </Grid>

        {members
          ? members.map((c, index) => (
            <Paper elevation={2} key={index} sx={{ borderRadius: '10px', margin: '10px 20px 1px', p: '10px 20px' }}>
              <Grid container>
                <Grid item xs={1}>
                  <Identicon
                    prefix={chain?.ss58Format ?? 42}
                    size={24}
                    theme={chain?.icon || 'polkadot'}
                    value={String(c[0])}
                  />
                </Grid>
                <Grid container item xs={11} justifyContent='space-between'>
                  <Grid container item xs={6}>
                    {accountInfos[index].identity.displayParent &&
                      <Grid item>
                        {accountInfos[index].identity.displayParent} /
                      </Grid>
                    }
                    <Grid item sx={accountInfos[index].identity.displayParent && { color: grey[400] }}>
                      {accountInfos[index].identity.display} { }
                    </Grid>

                    {accountInfos[index].identity.twitter &&
                      <Grid item>
                        <Link href={`https://TwitterIcon.com/${accountInfos[index].identity.twitter}`}>
                          <TwitterIcon
                            color='primary'
                            sx={{ fontSize: 15 }}
                          />
                        </Link>
                      </Grid>
                    }

                    {accountInfos[index].identity.email &&
                      <Grid item>
                        <Link href={`mailto:${accountInfos[index].identity.email}`}>
                          <EmailIcon
                            color='secondary'
                            sx={{ fontSize: 15 }}
                          />
                        </Link>
                      </Grid>
                    }

                    {accountInfos[index].identity.web &&
                      <Grid item>
                        <Link
                          href={accountInfos[index].identity.web}
                          rel='noreferrer'
                          target='_blank'
                        >
                          <LaunchRoundedIcon
                            color='primary'
                            sx={{ fontSize: 15 }}
                          />
                        </Link>
                      </Grid>
                    }
                  </Grid>
                  <Grid item xs={5} sx={{textAlign:'right' }}>
                    {t('Backed')}{': '} {amountToHuman(c[1].toString(), decimals, 2)} {coin}
                  </Grid>
                </Grid>

              </Grid>

            </Paper>))
          : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 3 }}>
            {t('No data')}
          </Grid>}
      </Container>

    </Container>
  )
}
