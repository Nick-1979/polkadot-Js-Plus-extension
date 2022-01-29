// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { BatchPrediction as BatchPredictionIcon, HowToVote as HowToVoteIcon, WhereToVote as WhereToVoteIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveReferendumExt } from '@polkadot/api-derive/types';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../../components';
import getCurrentBlockNumber from '../../../util/getCurrentBlockNumber';
import getProposals from '../../../util/getProposals';
import getReferendums from '../../../util/getReferendums';
import { ChainInfo, ProposalsInfo } from '../../../util/plusTypes';
import Proposals from './proposals/overview';
import VoteProposal from './proposals/VoteProposal';
import Referendums from './referendums/overview';
import VoteReferendum from './referendums/VoteReferendum';

interface Props {
  chainName: string;
  showDemocracyModal: boolean;
  chainInfo: ChainInfo;
  setDemocracyModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Democracy({ chainInfo, chainName, setDemocracyModalOpen, showDemocracyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [tabValue, setTabValue] = useState('referendums');
  const [referendums, setReferenduns] = useState<DeriveReferendumExt[]>();
  const [proposalsInfo, setProposalsInfo] = useState<ProposalsInfo>();
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>();
  const [showVoteReferendumModal, setShowVoteReferendumModal] = useState<boolean>(false);
  const [vote, setVote] = useState<{ voteType: number, refId: string }>();
  // const [showVoteProposalModal, setShowVoteProposalModal] = useState<boolean>(false);
  // const [second, setSecond] = useState<{ proposalId: string, depositorsLength: number }>();

  const chain = useMetadata(chainInfo?.genesisHash, true);// TODO:double check to have genesisHash here


  useEffect(() => {
    // eslint-disable-next-line no-void
    void getReferendums(chainName).then(r => {
      setReferenduns(r);
    });

    // eslint-disable-next-line no-void
    void getProposals(chainName).then(r => {
      setProposalsInfo(r);
    });

    // eslint-disable-next-line no-void
    void getCurrentBlockNumber(chainName).then((n) => {
      setCurrentBlockNumber(n);
    });
  }, [chainName]);

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

  const handleVote = useCallback((voteType: number, refId: string) => {
    setShowVoteReferendumModal(true);
    setVote({ refId: refId, voteType: voteType });
  }, []);

  // const handleSecond = useCallback((proposalId: string, depositorsLength: number) => {
  //   setShowVoteProposalModal(true);
  //   setSecond({ depositorsLength: depositorsLength, proposalId: proposalId });
  // }, []);

  const handleVoteReferendumModalClose = useCallback(() => {
    setShowVoteReferendumModal(false);
  }, []);

  // const handleVoteProposalModalClose = useCallback(() => {
  //   setShowVoteProposalModal(false);
  // }, []);

  return (
    <Popup showModal={showDemocracyModal} handleClose={handleDemocracyModalClose}>
      <PlusHeader action={handleDemocracyModalClose} chain={chainName} closeText={'Close'} icon={<HowToVoteIcon fontSize='small' />} title={'Democracy'} />
      <Grid container>
        <Grid item xs={12} sx={{ margin: '0px 30px' }}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab icon={<WhereToVoteIcon fontSize='small' />} iconPosition='start' label='Referendums' sx={{ fontSize: 11 }} value='referendums' />
            <Tab icon={<BatchPredictionIcon fontSize='small' />} iconPosition='start' label='Proposals' sx={{ fontSize: 11 }} value='proposals' />
          </Tabs>
        </Grid>

        {tabValue === 'referendums'
          ? <Grid item xs={12} sx={{ height: 450, overflowY: 'auto' }}>
            {referendums
              ? <Referendums handleVote={handleVote} referendums={referendums} chainName={chainName} chainInfo={chainInfo} currentBlockNumber={currentBlockNumber} />
              : <Progress title={'Loading referendums ...'} />}
          </Grid>
          : ''}

        {tabValue === 'proposals'
          ? <Grid item xs={12} sx={{ height: 450, overflowY: 'auto' }}>
            {proposalsInfo
              ? <Proposals proposalsInfo={proposalsInfo} chain={chain} chainInfo={chainInfo} currentBlockNumber={currentBlockNumber} />
              : <Progress title={'Loading proposals ...'} />}
          </Grid>
          : ''}

        {showVoteReferendumModal &&
          <VoteReferendum
            chain={chain}
            chainInfo={chainInfo}
            handleVoteReferendumModalClose={handleVoteReferendumModalClose}
            showVoteReferendumModal={showVoteReferendumModal}
            vote={vote} />
        }

        {/* {showVoteProposalModal &&
          <VoteProposal
            chain={chain}
            chainInfo={chainInfo}
            handleVoteProposalModalClose={handleVoteProposalModalClose}
            showVoteProposalModal={showVoteProposalModal}
            vote={vote} />
        } */}

      </Grid>
    </Popup>
  );
}
