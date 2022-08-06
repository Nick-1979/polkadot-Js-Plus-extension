// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all governance options e.g., Democracy, Council, Treasury, etc.
*/
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AccountBalance, Groups as GroupsIcon, HowToVote } from '@mui/icons-material';
import { Avatar, Container, Grid, Link, Paper } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import getChainInfo from '../../util/getChainInfo';
import getLogo from '../../util/getLogo';
import { AddressState, ChainInfo } from '../../util/plusTypes';
import CouncilIndex from './Council/index';
import Democracy from './Democracy/index';
import Treasury from './Treasury/index';

interface Props extends ThemeProps {
  className?: string;
}

function Governance({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showDemocracyModal, setDemocracyModalOpen] = useState<boolean>(false);
  const [showCouncilModal, setCouncilModalOpen] = useState<boolean>(false);
  const [showTreasuryModal, setTreasuryModalOpen] = useState<boolean>(false);
  const [chainInfo, setChainInfo] = useState<ChainInfo>();

  const { address, genesisHash } = useParams<AddressState>();

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(genesisHash).then((chainInfo) => {
      setChainInfo(chainInfo);
    }).catch(console.error);
  }, [genesisHash]);

  const handleDemocracyModal = useCallback(() => {
    setDemocracyModalOpen(true);
  }, []);

  const handleCouncilModal = useCallback(() => {
    setCouncilModalOpen(true);
  }, []);

  const handleTreasuryModal = useCallback(() => {
    setTreasuryModalOpen(true);
  }, []);

  return (
    <>
      <Header
        showAdd
        showBackArrow
        showSettings
        smallMargin
        text={`${t<string>('Governance')} ${chainInfo?.chainName ? 'on' : ''} ${chainInfo?.chainName ?? ''}`}
      />
      <Container data-testid='governance'>
        <Paper elevation={4} onClick={handleDemocracyModal} sx={{ borderRadius: '10px', cursor: 'pointer', margin: '20px 30px 10px', p: '20px 40px' }}>
          <Grid container>
            <Grid item xs={4}>
              <HowToVote color='primary' fontSize='large' />
            </Grid>
            <Grid container item xs={8}>
              <Grid item sx={{ fontSize: 15, fontWeight: '600' }} xs={12}>
                {t('Democracy')}
              </Grid>
              <Grid item sx={{ fontSize: 12, fontWeight: '400' }} xs={12}>
                {t('Proposals and referendums voting')}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        <Paper elevation={4} onClick={handleCouncilModal} sx={{ borderRadius: '10px', cursor: 'pointer', margin: '20px 30px 10px', p: '20px 40px' }}>
          <Grid container>
            <Grid item xs={4}>
              <GroupsIcon color='success' fontSize='large' />
            </Grid>
            <Grid container item xs={8}>
              <Grid item sx={{ fontSize: 15, fontWeight: '600' }} xs={12}>
                {t('Council')}
              </Grid>
              <Grid item sx={{ fontSize: 12, fontWeight: '400', whiteSpace: 'nowrap' }} xs={12}>
                {t('Vote for council members or candidates')}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        <Paper elevation={4} onClick={handleTreasuryModal} sx={{ borderRadius: '10px', cursor: 'pointer', margin: '20px 30px 10px', p: '20px 40px' }}>
          <Grid container>
            <Grid item xs={4}>
              <AccountBalance color='secondary' fontSize='large' />
            </Grid>
            <Grid container item xs={8}>
              <Grid item sx={{ fontSize: 15, fontWeight: '600' }} xs={12}>
                {t('Treasury')}
              </Grid>
              <Grid item sx={{ fontSize: 12, fontWeight: '400' }} xs={12}>
                {t('Treasury spend proposals voting')}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        <Link
          href={`https://${chainInfo?.chainName}.polkassembly.io`}
          rel='noreferrer'
          target='_blank'
          underline='none'
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
                <Grid item sx={{ fontSize: 15, fontWeight: '600' }} xs={12}>
                  {t('Polkassembly')}
                </Grid>
                <Grid item sx={{ fontSize: 12, fontWeight: '400' }} xs={12}>
                  {t('Discussion platform for polkadot Governance')}
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Link>
      </Container>
      {showDemocracyModal &&
        <Democracy
          address={address}
          chainInfo={chainInfo}
          setDemocracyModalOpen={setDemocracyModalOpen}
          showDemocracyModal={showDemocracyModal}
        />
      }
      {showCouncilModal &&
        <CouncilIndex
          address={address}
          chainInfo={chainInfo}
          setCouncilModalOpen={setCouncilModalOpen}
          showCouncilModal={showCouncilModal}
        />
      }
      {showTreasuryModal &&
        <Treasury
          address={address}
          chainInfo={chainInfo}
          setTreasuryModalOpen={setTreasuryModalOpen}
          showTreasuryModal={showTreasuryModal}
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
