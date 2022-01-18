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
import { PersonsInfo } from '../../../util/plusTypes';
import { amountToHuman } from '../../../util/plusUtils';
import { grey } from '@mui/material/colors';
import { ShortAddress } from '../../common/ShortAddress';

interface Props {
  personsInfo: PersonsInfo;
  membersType: string;
  chain: Chain;
  coin: string;
  decimals: number;
}

export default function Members({ coin, personsInfo, membersType, decimals, chain }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Grid xs={12} sx={{ fontSize: 14, fontWeigth: 'bold',color: grey[600], fontFamily: 'fantasy', textAlign: 'center', padding: '20px 1px 10px' }}>
        {membersType}
      </Grid>

      {personsInfo.infos.length
        ? personsInfo.infos.map((m, index) => (
          <Paper elevation={2} key={index} sx={{ borderRadius: '10px', margin: '10px 20px 1px', p: '10px 20px 10px' }}>
            <Grid container>
              <Grid item xs={1}>
                <Identicon
                  prefix={chain?.ss58Format ?? 42}
                  size={24}
                  theme={chain?.icon || 'polkadot'}
                  value={String(m.accountId)}
                />
              </Grid>
              <Grid container item xs={11} justifyContent='space-between'>
                <Grid container item xs={6}>
                  {m.identity.displayParent &&
                    <Grid item>
                      {m.identity.displayParent} /
                    </Grid>
                  }
                  <Grid item sx={m.identity.displayParent && { color: grey[500] }}>
                    {m.identity.display} { }
                  </Grid>

                  {!(m.identity.displayParent || m.identity.display) &&
                    <Grid item>
                      <ShortAddress address={String(m.accountId)}/>
                    </Grid>
                  }


                  {m.identity.twitter &&
                    <Grid item>
                      <Link href={`https://TwitterIcon.com/${m.identity.twitter}`}>
                        <TwitterIcon
                          color='primary'
                          sx={{ fontSize: 15 }}
                        />
                      </Link>
                    </Grid>
                  }

                  {m.identity.email &&
                    <Grid item>
                      <Link href={`mailto:${m.identity.email}`}>
                        <EmailIcon
                          color='secondary'
                          sx={{ fontSize: 15 }}
                        />
                      </Link>
                    </Grid>
                  }

                  {m.identity.web &&
                    <Grid item>
                      <Link
                        href={m.identity.web}
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
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  {t('Backed')}{': '} {amountToHuman(personsInfo.backed[index], decimals, 2)} {coin}
                </Grid>
              </Grid>

            </Grid>

          </Paper>))
        : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 2 }}>
          {t('No ')}{membersType.toLowerCase()} {t(' found')}
        </Grid>}

    </>
  )
}
