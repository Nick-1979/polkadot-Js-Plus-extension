// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AccountBalance, Groups as GroupsIcon, HowToVote } from '@mui/icons-material';
import { Avatar, Container, Grid, Link, Paper, SelectChangeEvent } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import SelectRelay from '../../components/SelectRelay';
import getChainInfo from '../../util/getChainInfo';
import getLogo from '../../util/getLogo';
import { ChainInfo } from '../../util/plusTypes';
import CouncilIndex from './Council/index';
import Democracy from './Democracy/index';

interface Props extends ThemeProps {
  className?: string;
}

function Governance({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedChain, setSelectedChain] = useState<string>('polkadot');
  const [showDemocracyModal, setDemocracyModalOpen] = useState<boolean>(false);
  const [showCouncilModal, setCouncilModalOpen] = useState<boolean>(false);
  const [chainInfo, setChainInfo] = useState<ChainInfo>();

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(selectedChain).then((i) => {
      setChainInfo(i);
    });
  }, [selectedChain]);

  const handleChainChange = (event: SelectChangeEvent) => {
    setSelectedChain(event.target.value);
  };

  const handleDemocracyModal = useCallback(() => {
    setDemocracyModalOpen(true);
  }, []);

  const handleCouncilModal = useCallback(() => {
    setCouncilModalOpen(true);
  }, []);

  return (
    <>
      <Header
        showAdd
        showBackArrow
        showSettings
        smallMargin
        text={t<string>('Governance')}
      />
      <Container>

        <Grid item xs={12} sx={{ p: '0px 30px' }}>
          <SelectRelay handleChainChange={handleChainChange} selectedChain={selectedChain} />
        </Grid>

        <Paper elevation={4} onClick={handleDemocracyModal} sx={{ borderRadius: '10px', cursor: 'pointer', margin: '20px 30px 10px', p: '20px 40px' }}>
          <Grid container >
            <Grid item xs={4}>
              <HowToVote color='primary' fontSize='large' />
            </Grid>
            <Grid container item xs={8}>
              <Grid item xs={12} sx={{ fontSize: 15, fontWeight: '600' }}>
                Democracy
              </Grid>
              <Grid item xs={12} sx={{ fontSize: 12, fontWeight: '400' }}>
                Proposals and referendums voting.
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        <Paper elevation={4} onClick={handleCouncilModal} sx={{ borderRadius: '10px', cursor: 'pointer', margin: '20px 30px 10px', p: '20px 40px' }}>
          <Grid container >
            <Grid item xs={4}>
              <GroupsIcon color='success' fontSize='large' />
            </Grid>
            <Grid container item xs={8}>
              <Grid item xs={12} sx={{ fontSize: 15, fontWeight: '600' }}>
                Council
              </Grid>
              <Grid item xs={12} sx={{ fontSize: 12, fontWeight: '400', whiteSpace: 'nowrap' }}>
                Vote for council members or candidates.
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        <Paper elevation={4} sx={{ borderRadius: '10px', cursor: 'pointer', margin: '20px 30px 10px', p: '20px 40px' }}>
          <Grid container >
            <Grid item xs={4}>
              <AccountBalance color='secondary' fontSize='large' />
            </Grid>
            <Grid container item xs={8}>
              <Grid item xs={12} sx={{ fontSize: 15, fontWeight: '600' }}>
                Treasury
              </Grid>
              <Grid item xs={12} sx={{ fontSize: 12, fontWeight: '400' }}>
                Treasury spend proposals voting.
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        <Link
          href={`https://${selectedChain}.polkassembly.io`}
          underline='none'
          rel='noreferrer'
          target='_blank'
        >
          <Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '20px 40px' }}>
            <Grid container>
              <Grid item xs={4}>
                <Avatar
                  alt={'Polkassembly logo'}
                  src={getLogo('polkassembly')}
                />
              </Grid>
              <Grid container item xs={8}>
                <Grid item xs={12} sx={{ fontSize: 15, fontWeight: '600' }}>
                  Polkassembly
                </Grid>
                <Grid item xs={12} sx={{ fontSize: 12, fontWeight: '400' }}>
                  Discussion platform for polkadot Governance
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Link>
      </Container>

      {showDemocracyModal &&
        <Democracy
          chainInfo={chainInfo}
          chainName={selectedChain}
          setDemocracyModalOpen={setDemocracyModalOpen}
          showDemocracyModal={showDemocracyModal}
        />
      }

      {showCouncilModal &&
        <CouncilIndex
          chainName={selectedChain}
          setCouncilModalOpen={setCouncilModalOpen}
          showCouncilModal={showCouncilModal}
        />
      }
    </>
  );
}

export default styled(Governance)`
      height: calc(100vh - 2px);
      overflow: auto;
      scrollbar - width: none;

      &:: -webkit - scrollbar {
        display: none;
      width:0,
  }
      .empty-list {
        text - align: center;
  }
      `;
