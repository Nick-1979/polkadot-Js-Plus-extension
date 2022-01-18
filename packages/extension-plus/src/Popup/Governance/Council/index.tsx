/* eslint-disable react/jsx-max-props-per-line */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { AutoAwesomeMotion as AutoAwesomeMotionIcon, Groups as GroupsIcon, People as PeopleIcon } from '@mui/icons-material';
import { Container, Grid, Modal, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ReactDom from 'react-dom';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import getChainInfo from '../../../util/getChainInfo';
import getCouncil from '../../../util/getCouncil';
import getCurrentBlockNumber from '../../../util/getCurrentBlockNumber';
import getMotions from '../../../util/getMotions';
import { CouncilInfo, MotionsInfo } from '../../../util/plusTypes';
import PlusHeader from '../../common/PlusHeader';
import Progress from '../../common/Progress';
import Motions from './Motions';
import Overview from './Overview';

interface Props {
  chainName: string;
  showCouncilModal: boolean;
  setCouncilModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function CouncilIndex({ chainName, setCouncilModalOpen, showCouncilModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('council');
  const [councilInfo, setCouncilInfo] = useState<CouncilInfo>();
  const [motions, setMotions] = useState<MotionsInfo>();
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
    void getCouncil(chainName).then((c) => {
      setCouncilInfo(c);
    });

    // eslint-disable-next-line no-void
    void getMotions(chainName).then((m) => {
      console.log('motionsmm', m);

      setMotions(m);
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
          <PlusHeader action={handleCouncilModalClose} chain={chainName} closeText={'Close'} icon={<GroupsIcon />} title={'Council'} />
          <Grid container>
            <Grid item xs={12} sx={{ margin: '0px 30px' }}>
              <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
                <Tab icon={<PeopleIcon fontSize='small' />} iconPosition='start' label='Council' sx={{ fontSize: 11 }} value='council' />
                <Tab icon={<AutoAwesomeMotionIcon fontSize='small' />} iconPosition='start' label='Motions' sx={{ fontSize: 11 }} value='motions' />
              </Tabs>
            </Grid>
            {tabValue === 'council'
              ? <>{councilInfo
                ? <Overview coin={coin} councilInfo={councilInfo} decimals={decimals} genesisHash={genesisHash} />
                : <Progress title={'Loading members info ...'} />}
              </>
              : ''}

            {tabValue === 'motions'
              ? <>{motions
                ? <Motions genesisHash={genesisHash} coin={coin} currentBlockNumber={currentBlockNumber} decimals={decimals} motions={motions} />
                : <Progress title={'Loading motions ...'} />}
              </>
              : ''}

          </Grid>
        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
