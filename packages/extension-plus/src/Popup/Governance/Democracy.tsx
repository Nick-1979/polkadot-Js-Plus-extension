// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Button, Container, Divider, Grid, LinearProgress, Modal, Paper, Tab, Tabs } from '@mui/material';
import { WhereToVote as WhereToVoteIcon, BatchPrediction as BatchPredictionIcon, HowToVote as HowToVoteIcon } from '@mui/icons-material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ReactDom from 'react-dom';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import PlusHeader from '../common/PlusHeader';
import getReferendums from '../../util/getReferendums';
import getChainInfo from '../../util/getChainInfo';
import { amountToHuman } from '../../util/plusUtils';

interface Props {
  chainName: string;
  showDemocracyModal: boolean;
  setDemocracyModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Democracy({ chainName, setDemocracyModalOpen, showDemocracyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('referendums');
  const [referendums, setReferenduns] = useState(null);
  const [decimals, setDecimals] = useState<number>(1);
  const [coin, setCoin] = useState<string>();


  useEffect(() => {
    getChainInfo(chainName).then((r) => {
      setDecimals(r.decimals);
      setCoin(r.coin);
    });

    getReferendums(chainName).then(r => {
      setReferenduns(r);
    });
  }, [chainName])
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleQRmodalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setDemocracyModalOpen(false);
    },
    [setDemocracyModalOpen]
  );

  return ReactDom.createPortal(
    <Modal
      disablePortal
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleQRmodalClose();
        }
      }}
      open={showDemocracyModal}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        display: 'flex',
        height: '100%',
        maxWidth: 700,
        position: 'relative',
        top: '5px',
        transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
        width: '560px'
      }}
      >
        <Container disableGutters maxWidth='md'>
          <PlusHeader action={handleQRmodalClose} chain={chainName} closeText={'Close'} icon={<HowToVoteIcon />} title={'Democracy'} />
          <Grid container >
            <Grid item xs={12} sx={{ margin: '0px 30px' }}>
              <Tabs
                indicatorColor='secondary'
                onChange={handleTabChange}
                // centered
                textColor='secondary'
                value={tabValue}
                variant='fullWidth'
              >
                <Tab icon={<WhereToVoteIcon fontSize='small' />} iconPosition='start' label='Referendums' sx={{ fontSize: 11 }} value='referendums' />
                <Tab icon={<BatchPredictionIcon fontSize='small' />} iconPosition='start' label='Proposals' sx={{ fontSize: 11 }} value='proposals' />
              </Tabs>
            </Grid>
            {tabValue === 'referendums' && referendums?.map((r) => (
              <Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 40px' }}>
                <Grid container justifyContent='space-between' >
                  <Grid item >
                    {r.image.proposal._meta.name}
                  </Grid>
                  <Grid item >
                    #{String(r.index)}
                  </Grid>
                </Grid>
                <Grid item >
                  <Divider />
                </Grid>

                <Grid container justifyContent='space-between' sx={{ paddingTop: 1, color: 'red' }} >
                  <Grid item >
                    {t('End')}{': '}{r.status.end.toString()}
                  </Grid>
                  <Grid item >
                    {t('Delay')}{': '}{r.status.delay.toString()}
                  </Grid>
                </Grid>

                <Grid container justifyContent='space-between' sx={{ paddingTop: 1, color: 'red' }} >
                  <Grid item >
                    {t('Threshold')}{': '} {r.status.threshold.toString()}
                  </Grid>
                  <Grid item >
                    {t('Turnout')}{': '}{r.status.tally.turnout.toString()}
                  </Grid>
                </Grid>

                <Grid container >


                  <Grid item xs={12} sx={{ margin: '10px' }}>
                    {r.image.proposal._meta.docs}
                  </Grid>
                  <Grid item xs={12}>
                    {t('Hash')}<br />
                    {r.imageHash.toString()}
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'center', paddingTop: 1 }} >
                    {r.isPassing ? t('Passing') : t('Failing')}
                  </Grid>

                </Grid>

                <Grid container justifyContent='space-between' sx={{ paddingTop: 1 }} >
                  <Grid item >
                    {t('Nay')}  
                  </Grid>
                  <Grid item >
                    {t('Aye')} 
                  </Grid>
                </Grid>

                <Grid container justifyContent='space-between' sx={{ paddingTop: 1 }} >
                  <Grid item xs={12} >
                    <LinearProgress variant='determinate' value={100 * (Number(r.status.tally.nays) / (Number(r.status.tally.nays) + Number(r.status.tally.ayes)))} />
                  </Grid>
                  <Grid item >
                   {amountToHuman(Number(r.status.tally.nays).toString(), decimals)}{coin}
                  </Grid>
                  <Grid item >
                  {amountToHuman(r.status.tally.ayes.toString(), decimals)}{coin}
                  </Grid>
                </Grid>

                <Grid container justifyContent='space-between' sx={{ paddingTop: 2 }} >

                  <Grid item >
                    <Button  variant='contained'> {t('Nay')}</Button>
                  </Grid>
                  <Grid item >
                    <Button  variant='outlined' > {t('Aye')}</Button>
                  </Grid>
                </Grid>

              </Paper>
            ))}
          </Grid>


        </Container>
      </div>
    </Modal >
    , document.getElementById('root')
  );
}
