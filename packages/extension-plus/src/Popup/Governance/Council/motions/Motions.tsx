// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveCollectiveProposal } from '@polkadot/api-derive/types';

import { Avatar, Container, Grid, Link, Paper } from '@mui/material';
import React from 'react';

import useMetadata from '../../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../../../../util/getLogo';
import { ChainInfo } from '../../../../util/plusTypes';
import { remainingTime } from '../../../../util/plusUtils';

interface Props {
  motions: DeriveCollectiveProposal[];
  chainInfo: ChainInfo;
  currentBlockNumber: number;
}

export default function Motions({ chainInfo, currentBlockNumber, motions }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(chainInfo.genesisHash, true);
  const chainName = chain?.name.replace(' Relay Chain', '');

  return (
    <Container disableGutters maxWidth='md' sx={{ fontSize: 12 }}>
      {motions.length
        ? motions.map((p, index) => (
          <>
            {p.votes &&
              <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
                <Grid container justifyContent='space-between' sx={{ textAlign: 'center' }}>
                  <Grid item>
                    {t('Index')}<br />
                    <b style={{ fontSize: 15 }}> {p.votes.index}</b>
                  </Grid>
                  <Grid item>
                    {t('Voting end')}<br />
                    {remainingTime(Number(p.votes.end) - currentBlockNumber)}<br />
                    #{p.votes.end}
                  </Grid>
                  <Grid item>
                    {t('Vots')}<br />
                    {t('Aye')}{' '}{p.votes.ayes.length}/{p.votes.threshold}
                  </Grid>
                  <Grid item>
                    {t('Threshold')}<br />
                    {p.votes.threshold}
                  </Grid>
                  <Grid container item justifyContent='flex-end'>
                    <Grid item>
                      <Link
                        href={`https://${chainName}.polkassembly.io/motion/${p.votes.index}`}
                        rel='noreferrer'
                        target='_blank'
                        underline='none'
                      >
                        <Avatar
                          alt={'Polkassembly'}
                          src={getLogo('polkassembly')}
                          sx={{ height: 24, width: 24 }}
                        />
                      </Link>
                    </Grid>
                    <Grid item>
                      <Link
                        href={`https://${chainName}.subscan.io/council/${p.votes.index}`}
                        rel='noreferrer'
                        target='_blank'
                        underline='none'
                      >
                        <Avatar
                          alt={'subscan'}
                          src={getLogo('subscan')}
                          sx={{ height: 24, width: 24 }}
                        />
                      </Link>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            }
          </>
        ))
        : <Grid item sx={{ paddingTop: 3, textAlign: 'center' }} xs={12}>
          {t('No active motion')}
        </Grid>
      }
    </Container >
  );
}