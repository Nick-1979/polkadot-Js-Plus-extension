// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Email as EmailIcon, LaunchRounded as LaunchRoundedIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import Identicon from '@polkadot/react-identicon';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { ShortAddress } from '../../../../components';
import { PersonsInfo } from '../../../../util/plusTypes';
import { amountToHuman } from '../../../../util/plusUtils';

interface Props {
  personsInfo: PersonsInfo;
  membersType?: string;
  chain: Chain;
  coin: string;
  decimals: number;
}

export default function Members({ chain, coin, decimals, membersType, personsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Grid xs={12} sx={{ fontSize: 14, fontWeigth: 'bold', color: grey[600], fontFamily: 'fantasy', textAlign: 'center', p: '10px 1px 10px' }}>
        {membersType}
      </Grid>

      {personsInfo.infos.length
        ? personsInfo.infos.map((m, index) => (
          <Paper elevation={2} key={index} sx={{ borderRadius: '10px', margin: '10px 20px 1px', p: '5px 20px 5px' }}>
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
                      <ShortAddress address={String(m.accountId)} />
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
                {personsInfo?.backed &&
                  <Grid item xs={5} sx={{ textAlign: 'left' }}>
                    {t('Backed')}{': '} {Number(amountToHuman(personsInfo.backed[index], decimals, 2)).toLocaleString()} {coin}
                  </Grid>
                }
              </Grid>

            </Grid>

          </Paper>))
        : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 2 }}>
          {membersType &&
            <>{t('No ')}{membersType.toLowerCase()} {t(' found')}</>
          }
        </Grid>}

    </>
  )
}
