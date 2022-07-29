// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { BatchPrediction as BatchPredictionIcon, HowToVote as HowToVoteIcon, WhereToVote as WhereToVoteIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../../components';
import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import getProposals from '../../../util/api/getProposals';
import getReferendums from '../../../util/api/getReferendums';
import createConvictions from '../../../util/createConvictions';
import { ChainInfo, Conviction, ProposalsInfo, Referendum } from '../../../util/plusTypes';
import Proposals from './proposals/overview';
import Referendums from './referendums/overview';

interface Props {
  address: string;
  showDemocracyModal: boolean;
  chainInfo: ChainInfo | undefined;
  setDemocracyModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Democracy({ address, chainInfo, setDemocracyModalOpen, showDemocracyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('referendums');
  const [referendums, setReferenduns] = useState<Referendum[] | undefined | null>();
  const [proposalsInfo, setProposalsInfo] = useState<ProposalsInfo | undefined | null>();
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>();
  const [convictions, setConvictions] = useState<Conviction[]>();
  const chain = useMetadata(chainInfo?.genesisHash, true);// TODO:double check to have genesisHash here

  useEffect(() => {
    if (!referendums || !chain) { return; }
    console.log('referendums:', referendums);

    // eslint-disable-next-line no-void
    void createConvictions(chain, t).then((c) => {
      setConvictions(c);
    });
  }, [chain, t, referendums]);

  useEffect(() => {
    if (!chainInfo?.chainName) { return; }

    // eslint-disable-next-line no-void
    void getReferendums(chainInfo.chainName).then((r) => {
      setReferenduns(r);
    });

    // eslint-disable-next-line no-void
    void getProposals(chainInfo.chainName).then((p) => {
      setProposalsInfo(p);
    });

    // eslint-disable-next-line no-void
    void getCurrentBlockNumber(chainInfo.chainName).then((n) => {
      setCurrentBlockNumber(n);
    });
  }, [chainInfo]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handleDemocracyModalClose = useCallback((): void => {
    setDemocracyModalOpen(false);
  }, [setDemocracyModalOpen]);

  return (
    <Popup
      handleClose={handleDemocracyModalClose}
      showModal={showDemocracyModal}
    >
      <PlusHeader
        action={handleDemocracyModalClose}
        chain={chainInfo?.chainName}
        closeText={'Close'}
        icon={<HowToVoteIcon fontSize='small' />}
        title={'Democracy'}
      />
      <Grid container>
        <Grid item xs={12} sx={{ borderBottom: 1, borderColor: 'divider', m: '0px 30px' }}  >
          <Tabs
            indicatorColor='secondary'
            onChange={handleTabChange}
            textColor='secondary'
            value={tabValue}
            variant='fullWidth'
          >
            <Tab
              icon={<WhereToVoteIcon fontSize='small' />}
              iconPosition='start'
              label={`${t('Referendums')} (${referendums?.length ?? 0})`}
              sx={{ fontSize: 11 }}
              value='referendums'
            />
            <Tab
              icon={<BatchPredictionIcon fontSize='small' />}
              iconPosition='start'
              label={`${t('Proposals')} (${proposalsInfo?.proposals?.length ?? 0})`}
              sx={{ fontSize: 11 }}
              value='proposals'
            />
          </Tabs>
        </Grid>
        {tabValue === 'referendums'
          ? <Grid
            item
            sx={{ height: 450, overflowY: 'auto' }}
            xs={12}
          >
            {chainInfo && referendums !== undefined && chain && convictions
              ? <Referendums
                address={address}
                chain={chain}
                chainInfo={chainInfo}
                convictions={convictions}
                currentBlockNumber={currentBlockNumber}
                referendums={referendums}
              />
              : <Progress title={'Loading referendums ...'} />}
          </Grid>
          : ''
        }
        {/* TODO: Proposals needs to be rewrite after menue movement */}
        {tabValue === 'proposals'
          ? <Grid
            item
            sx={{ height: 450, overflowY: 'auto' }}
            xs={12}
          >
            {chainInfo && proposalsInfo !== undefined && chain
              ? <Proposals
                address={address}
                chain={chain}
                chainInfo={chainInfo}
                proposalsInfo={proposalsInfo}
              />
              : <Progress title={'Loading proposals ...'} />}
          </Grid>
          : ''}
      </Grid>
    </Popup>
  );
}
