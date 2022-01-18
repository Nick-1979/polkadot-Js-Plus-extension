// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { AutoAwesomeMotion as AutoAwesomeMotionIcon, HowToVote as HowToVoteIcon, People as PeopleIcon } from '@mui/icons-material';
import { Container, Grid, Modal, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ReactDom from 'react-dom';

import { DeriveProposal } from '@polkadot/api-derive/types';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import getChainInfo from '../../../util/getChainInfo';
import getCouncil from '../../../util/getCouncil';
import getCurrentBlockNumber from '../../../util/getCurrentBlockNumber';
import { CouncilInfo } from '../../../util/plusTypes';
import PlusHeader from '../../common/PlusHeader';
import Progress from '../../common/Progress';
import Council from './Council';

interface Props {
  chainName: string;
  showCouncilModal: boolean;
  setCouncilModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function CouncilIndex({ chainName, setCouncilModalOpen, showCouncilModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('council');
  const [councilInfo, setCouncilInfo] = useState<CouncilInfo>();
  const [motions, setMotions] = useState<DeriveProposal[]>();
  const [decimals, setDecimals] = useState<number>(1);
  const [coin, setCoin] = useState<string>();
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>();
  const [genesisHash, setGenesisHash] = useState<string>();

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(chainName).then((r) => {
      setDecimals(r.decimals);
      setCoin(r.coin);
      setGenesisHash(r.genesisHash);
    });

    // eslint-disable-next-line no-void
    void getCouncil(chainName, 'council').then((c) => {
      setCouncilInfo(c);
    });

    // eslint-disable-next-line no-void
    void getCurrentBlockNumber(chainName).then((n) => {
      setCurrentBlockNumber(n);
    });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleCouncilModalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setCouncilModalOpen(false);
    },
    [setCouncilModalOpen]
  );

  return ReactDom.createPortal(
    <Modal
      disablePortal
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleCouncilModalClose();
        }
      }}
      open={showCouncilModal}
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
          <PlusHeader action={handleCouncilModalClose} chain={chainName} closeText={'Close'} icon={<HowToVoteIcon />} title={'Council'} />
          <Grid container>
            <Grid item xs={12} sx={{ margin: '0px 30px' }}>
              <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
                <Tab icon={<PeopleIcon fontSize='small' />} iconPosition='start' label='Council' sx={{ fontSize: 11 }} value='council' />
                <Tab icon={<AutoAwesomeMotionIcon fontSize='small' />} iconPosition='start' label='Motions' sx={{ fontSize: 11 }} value='motions' />
              </Tabs>
            </Grid>
            {tabValue === 'council'
              ? <>{councilInfo
                ? <Council councilInfo={councilInfo} genesisHash={genesisHash} coin={coin} decimals={decimals} currentBlockNumber={currentBlockNumber} />
                : <Progress title={'Loading ...'} />}
              </>
              : ''}

            {/* {tabValue === 'motions'
              ? <>{motions
                ? <Council council={council} chainName={chainName} coin={coin} decimals={decimals} />
                : <Progress title={'Getting Motions ...'} />}
              </>
              : ''} */}

          </Grid>
        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
