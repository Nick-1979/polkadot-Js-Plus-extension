/* eslint-disable header/header */
// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AccountBalance, Groups, HowToVote } from '@mui/icons-material';
import { Avatar, Container, FormControl, FormHelperText, Grid, InputLabel, Link, MenuItem, Paper, Select, SelectChangeEvent } from '@mui/material';
import React, { useState } from 'react';
import styled from 'styled-components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import { RELAY_CHAINS } from '../../util/constants';
import getLogo from '../../util/getLogo';

interface Props extends ThemeProps {
  className?: string;
}


function Governance({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedRelaychain, setSelectedRelaychain] = useState<string>('polkadot');

  const handleBlockchainChange = (event: SelectChangeEvent) => {
    setSelectedRelaychain(event.target.value);
  };

  // const gotoPolkassembly = () => selectedRelaychain && window.open(`https://${selectedRelaychain}.polkassembly.io`, '_blank');

  return (
    <>
      <Header
        showBackArrow
        smallMargin
        text={t<string>('Governance')}
      />
      <Container>
        <Grid item xs={12}sx={{ margin: '0px 30px' }}>
          <FormControl fullWidth>
            <InputLabel id='select-relay-chain'>{t('Relay chain')}</InputLabel>
            <Select
              value={selectedRelaychain}
              label='Select relay chain'
              onChange={handleBlockchainChange}
              sx={{ height: 50 }}
            >
              {RELAY_CHAINS.map((chain) =>
                <MenuItem key={chain.name} value={chain.name.toLowerCase()}>
                  <Grid container alignItems='center' justifyContent='space-between'>
                    <Grid item>
                      <Avatar
                        alt={'logo'}
                        src={getLogo(chain.name.toLowerCase())}
                        sx={{ height: 24, width: 24 }}
                      />
                    </Grid>
                    <Grid item sx={{ fontSize: 15 }}>
                      {chain.name}
                    </Grid>
                  </Grid>
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '20px 40px' }}>
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
        <Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '20px 40px' }}>
          <Grid container >
            <Grid item xs={4}>
              <Groups color='success' fontSize='large' />
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
        <Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '20px 40px' }}>
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
          href={`https://${selectedRelaychain}.polkassembly.io`}
          underline='none'
          rel='noreferrer'
          target='_blank'
        >
          <Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '20px 40px' }}>
            <Grid container >
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
    text-align: center;
  }
`;
