// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CancelOutlined as CancelOutlinedIcon, HowToReg as HowToRegIcon } from '@mui/icons-material';
import { Button, Container, Divider, Grid, Paper } from '@mui/material';
import React from 'react';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { CouncilInfo } from '../../../util/plusTypes';
import Members from './Members';

interface Props {
  councilInfo: CouncilInfo;
  genesisHash: string;
  coin: string;
  decimals: number;
}

export default function Overview({ coin, councilInfo, decimals, genesisHash }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(genesisHash, true);

  console.log('councilInfo', councilInfo);

  const { accountInfos, candidateCount, candidates, desiredRunnersUp, desiredSeats, members, runnersUp } = councilInfo;
  const membersInfo = {
    desiredSeats: Number(desiredSeats),
    backed: members.map((m) => m[1].toString()),
    infos: accountInfos.slice(0, members.length)
  }
  const runnersUpInfo = {
    desiredSeats: Number(desiredRunnersUp),
    backed: runnersUp.map((m) => m[1].toString()),
    infos: accountInfos.slice(members.length, members.length + runnersUp.length)
  }
  const candidatesInfo = {
    desiredSeats: Number(candidateCount),
    backed: candidates.map((m) => m[1].toString()),
    infos: accountInfos.slice(members.length + runnersUp.length)
  }

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

        <Grid item sx={{ padding: '20px 0px 10px ' }}>
          <Divider />
        </Grid>

        <Grid container justifyContent='space-between' sx={{ textAlign: 'center' }}>
          <Grid item>
            {t('My votes')}
          </Grid>
          <Grid item>
            <Button variant='outlined' size='small' color='secondary' startIcon={<CancelOutlinedIcon />}> {t('Cancel votes')}</Button>
          </Grid>
          <Grid item>
            <Button variant='contained' size='small' color='warning' startIcon={<HowToRegIcon />}> {t('Vote')}</Button>
          </Grid>
        </Grid>
      </Paper>

      {councilInfo
        ? <Container id='scrollArea' sx={{ height: '300px', overflowY: 'auto' }}>
          <Members coin={coin} decimals={decimals} chain={chain} personsInfo={membersInfo} membersType={t('Members')} />
          <Members coin={coin} decimals={decimals} chain={chain} personsInfo={runnersUpInfo} membersType={t('Runners up')} />
          <Members coin={coin} decimals={decimals} chain={chain} personsInfo={candidatesInfo} membersType={t('Candidates')} />
        </Container>
        : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 3 }}>
          {t('No data')}
        </Grid>
      }
      
    </Container>
  )
}
