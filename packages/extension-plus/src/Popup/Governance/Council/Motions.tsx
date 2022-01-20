// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Avatar, Container, Grid, Link, Paper } from '@mui/material';
import React, { useEffect, useState } from 'react';

import Identicon from '@polkadot/react-identicon';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../../../util/getLogo';
import { MotionsInfo } from '../../../util/plusTypes';
import { remainingTime } from '../../../util/plusUtils';
import { grey } from '@mui/material/colors';

interface Props {
  motions: MotionsInfo;
  genesisHash: string;
  coin: string;
  decimals: number;
  currentBlockNumber: number;
}

export default function Motions({ coin, decimals, genesisHash, currentBlockNumber, motions }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const pMotions = JSON.parse(JSON.stringify(motions));
  const chain = useMetadata(genesisHash, true);
  const chainName = chain?.name.replace(' Relay Chain', '');

  const { accountInfo, proposals, proposalInfo } = pMotions;

  console.log('motions', pMotions);

  return (
    <Container disableGutters maxWidth='md'>
      {proposals.length
        ? proposals.map((p, index) => (
          <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
            <Grid container justifyContent='space-between' sx={{ textAlign: 'center' }}>
              <Grid item>
                {t('Index')}<br />
                <b style={{ fontSize: 15}}> {p.votes.index}</b>
              </Grid>

              <Grid item>
                {t('Voting end')}<br />
                {remainingTime(currentBlockNumber, p.votes.end)}<br />
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
              <Grid item container justifyContent='flex-end'>
                <Grid item>
                  <Link
                    href={`https://${chainName}.polkassembly.io/motion/${p.votes.index}`}
                    underline='none'
                    rel='noreferrer'
                    target='_blank'
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
                    underline='none'
                    rel='noreferrer'
                    target='_blank'
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

            {proposalInfo[index]?.proposer &&
              <>
                <Grid item sx={{ paddingTop: 2 }}>
                  {t('Proposer')}
                </Grid>
                <Grid container item alignItems='center' spacing={1} justifyContent='flext-start'>
                  <Grid item>
                    <Identicon
                      prefix={chain?.ss58Format ?? 42}
                      size={24}
                      theme={chain?.icon || 'polkadot'}
                      value={String(proposalInfo[index]?.proposer)}
                    />
                  </Grid>
                  <Grid item>
                    {accountInfo[index].identity.display}<br />
                    <div style={{ color: grey[500] }}> {proposalInfo[index]?.proposer}</div>
                  </Grid>
                </Grid>
              </>
            }

          </Paper>))
        : <Grid xs={12} sx={{ paddingTop: 3, textAlign: 'center' }}>
          {t('No data')}
        </Grid>
      }
    </Container>
  )
}
