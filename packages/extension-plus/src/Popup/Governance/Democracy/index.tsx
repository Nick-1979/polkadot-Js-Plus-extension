// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { OpenInNew as OpenInNewIcon, BatchPrediction as BatchPredictionIcon, CheckCircleOutline as CheckCircleOutlineIcon, HowToVote as HowToVoteIcon, RemoveCircleOutline as RemoveCircleOutlineIcon, ThumbDownAlt as ThumbDownAltIcon, ThumbUpAlt as ThumbUpAltIcon, WhereToVote as WhereToVoteIcon } from '@mui/icons-material';
import { Button, Container, Divider, Grid, Link, LinearProgress, Modal, Paper, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ReactDom from 'react-dom';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import getChainInfo from '../../../util/getChainInfo';
import getDemocracy from '../../../util/getDemocracy';
import Referendums from './Referendums';
import PlusHeader from '../../common/PlusHeader';
import Progress from '../../common/Progress';
import { DeriveReferendumExt, DeriveProposal } from '@polkadot/api-derive/types';
import getCurrentBlockNumber from '../../../util/getCurrentBlockNumber';

interface Props {
  chainName: string;
  showDemocracyModal: boolean;
  setDemocracyModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Democracy({ chainName, setDemocracyModalOpen, showDemocracyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('referendums');
  const [referendums, setReferenduns] = useState<DeriveReferendumExt[]>();
  const [proposals, setProposals] = useState<DeriveProposal[]>();
  const [decimals, setDecimals] = useState<number>(1);
  const [coin, setCoin] = useState<string>();
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>();

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(chainName).then((r) => {
      setDecimals(r.decimals);
      setCoin(r.coin);
    });

    // eslint-disable-next-line no-void
    void getDemocracy(chainName, 'referendums').then(r => {
      setReferenduns(r);
    });

    // eslint-disable-next-line no-void
    void getDemocracy(chainName, 'proposals').then(r => {
      setProposals(r);
    });

    getCurrentBlockNumber(chainName).then((n)=>{
      setCurrentBlockNumber(n);
    })
    
  }, [chainName])
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleDemocracyModalClose = useCallback(
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
          handleDemocracyModalClose();
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
          <PlusHeader action={handleDemocracyModalClose} chain={chainName} closeText={'Close'} icon={<HowToVoteIcon />} title={'Democracy'} />
          <Grid container>
            <Grid item xs={12} sx={{ margin: '0px 30px' }}>
              <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
                <Tab icon={<WhereToVoteIcon fontSize='small' />} iconPosition='start' label='Referendums' sx={{ fontSize: 11 }} value='referendums' />
                <Tab icon={<BatchPredictionIcon fontSize='small' />} iconPosition='start' label='Proposals' sx={{ fontSize: 11 }} value='proposals' />
              </Tabs>
            </Grid>
            {tabValue === 'referendums'
              ? <>{referendums
                ? <Referendums referendums={referendums} chainName={chainName} coin={coin} decimals={decimals} currentBlockNumber={currentBlockNumber}/>
                : <Progress title={'Loading referendums ...'} />}
              </>
              : ''}

            {tabValue === 'proposals'
              ? <>{proposals
                ? <Referendums referendums={referendums} chainName={chainName} coin={coin} decimals={decimals} />
                : <Progress title={'Loading proposals ...'} />}
              </>
              : ''}

          </Grid>
        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
