// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Container, Grid, Modal, Tab, Tabs } from '@mui/material';
import { WhereToVote as WhereToVoteIcon, BatchPrediction as BatchPredictionIcon, HowToVote as HowToVoteIcon } from '@mui/icons-material';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import ReactDom from 'react-dom';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import PlusHeader from '../common/PlusHeader';

interface Props {
  chainName: string;
  showDemocracyModal: boolean;
  setDemocracyModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Democracy({ chainName, setDemocracyModalOpen, showDemocracyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [tabValue, setTabValue] = React.useState('auction');

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

        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
