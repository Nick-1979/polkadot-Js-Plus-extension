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
import Identity from './Identity';

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
          <Paper elevation={2} key={index} sx={{ borderRadius: '10px', fontSize: 13, margin: '10px 20px 1px', p: '5px 20px 10px 5px' }}>

            <Grid container alignItems='center' justifyContent='space-between'>

              <Grid container item xs={8}>
                <Identity chain={chain} accountInfo={m} />
              </Grid>
              {personsInfo?.backed &&
                <Grid item xs={4} sx={{ textAlign: 'left', fontSize: 12 }}>
                  {t('Backed')}{': '} {Number(amountToHuman(personsInfo.backed[index], decimals, 2)).toLocaleString()} {coin}
                </Grid>
              }
            </Grid>

          </Paper>))
        : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 2, fontSize: 12 }}>
          {membersType &&
            <>{t('No ')}{membersType.toLowerCase()} {t(' found')}</>
          }
        </Grid>}

    </>
  )
}
