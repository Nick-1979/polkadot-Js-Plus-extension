// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { OpenInNew as OpenInNewIcon, BatchPrediction as BatchPredictionIcon, CheckCircleOutline as CheckCircleOutlineIcon, HowToVote as HowToVoteIcon, RemoveCircleOutline as RemoveCircleOutlineIcon, ThumbDownAlt as ThumbDownAltIcon, ThumbUpAlt as ThumbUpAltIcon, WhereToVote as WhereToVoteIcon } from '@mui/icons-material';
import { Button, Container, Divider, Grid, Link, LinearProgress, Modal, Paper, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ReactDom from 'react-dom';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import getChainInfo from '../../util/getChainInfo';
import getReferendums from '../../util/getReferendums';
import { amountToHuman } from '../../util/plusUtils';
import PlusHeader from '../common/PlusHeader';
import Progress from '../common/Progress';

interface Props {
  chainName: string;
  showDemocracyModal: boolean;
  setDemocracyModalOpen: Dispatch<SetStateAction<boolean>>;
}



export default function Democracy({ chainName, setDemocracyModalOpen, showDemocracyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('referendums');
  const [referendums, setReferenduns] = useState();
  const [decimals, setDecimals] = useState<number>(1);
  const [coin, setCoin] = useState<string>();


  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(chainName).then((r) => {
      setDecimals(r.decimals);
      setCoin(r.coin);
    });

    // eslint-disable-next-line no-void
    void getReferendums(chainName).then(r => {
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

  function Referendums(): React.ReactElement<Props> {
    return (
      <>
        {referendums?.length
          ? referendums.map((r, index) => (
            <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 40px' }}>
              <Grid container justifyContent='space-between'>
                <Grid item>
                  {r?.image.proposal._meta.name}
                </Grid>
                <Grid item>
                  #{String(r?.index)} {' '}
                  <Link target='_blank' rel='noreferrer' href={`https://${chainName}.subscan.io/referenda/${r?.index}}`}>
                    <OpenInNewIcon sx={{ fontSize: 10 }} />
                  </Link>
                </Grid>
              </Grid>
              <Grid item>
                <Divider />
              </Grid>

              <Grid container justifyContent='space-between' sx={{ fontSize: 11, paddingTop: 1, color: 'red' }}>
                <Grid item>
                  {t('End')}{': '}{r.status.end.toString()}
                </Grid>
                <Grid item>
                  {t('Threshold')}{': '} {r.status.threshold.toString()}
                </Grid>
                <Grid item>
                  {t('Delay')}{': '}{r.status.delay.toString()}
                </Grid>
              </Grid>

              <Grid item xs={12} sx={{ margin: '20px 1px 10px' }}>
                {r.image.proposal._meta.docs}
              </Grid>
              <Grid item xs={12} sx={{ border: '1px solid', borderRadius: '10px', padding: 1, margin: '20px 1px 20px' }}>
                {t('Hash')}<br />
                {r.imageHash.toString()}
              </Grid>

              <Grid container justifyContent='space-between' sx={{ paddingTop: 1 }}>
                <Grid item>
                  {t('Aye')}
                </Grid>
                <Grid item>
                  {r?.isPassing
                    ? <Grid item>
                      <CheckCircleOutlineIcon color='success' sx={{ fontSize: 15 }} />
                      {' '}{t('Passing')}
                    </Grid>
                    : <Grid item >
                      <RemoveCircleOutlineIcon color='secondary' sx={{ fontSize: 15 }} />
                      {' '}{t('Failing')}
                    </Grid>
                  }
                </Grid>
                <Grid item>
                  {t('Nay')}
                </Grid>
              </Grid>

              <Grid container justifyContent='space-between' sx={{ paddingTop: 1 }}>
                <Grid item xs={12}>
                  <LinearProgress variant='determinate' value={100 * (Number(r.status.tally.ayes) / (Number(r.status.tally.nays) + Number(r.status.tally.ayes)))} />
                </Grid>
                <Grid item>
                  {amountToHuman(r.status.tally.ayes.toString(), decimals)}{coin}
                </Grid>
                <Grid item>
                  {amountToHuman(Number(r.status.tally.nays).toString(), decimals)}{coin}
                </Grid>
              </Grid>

              <Grid container justifyContent='space-between' sx={{ paddingTop: 2 }}>
                <Grid item>
                  <Button variant='contained' startIcon={<ThumbUpAltIcon />}> {t('Aye')}</Button>
                </Grid>
                <Grid item>
                  <Button variant='outlined' endIcon={<ThumbDownAltIcon />}> {t('Nay')}</Button>
                </Grid>
              </Grid>

            </Paper>))
          : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 3 }}>
            {t('No active referendum')}
          </Grid>}
      </>
    )
  }

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
          <Grid container>
            <Grid item xs={12} sx={{ margin: '0px 30px' }}>
              <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
                <Tab icon={<WhereToVoteIcon fontSize='small' />} iconPosition='start' label='Referendums' sx={{ fontSize: 11 }} value='referendums' />
                <Tab icon={<BatchPredictionIcon fontSize='small' />} iconPosition='start' label='Proposals' sx={{ fontSize: 11 }} value='proposals' />
              </Tabs>
            </Grid>
            {tabValue === 'referendums'
              ? <>{referendums
                ? <Referendums />
                : <Progress title={'Getting Referendums ...'} />}
              </>
              : ''}
          </Grid>


        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
