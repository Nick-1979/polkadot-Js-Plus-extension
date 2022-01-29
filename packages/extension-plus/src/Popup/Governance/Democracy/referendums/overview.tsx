/* eslint-disable react/jsx-max-props-per-line */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CheckCircleOutline as CheckCircleOutlineIcon, RemoveCircleOutline as RemoveCircleOutlineIcon, ThumbDownAlt as ThumbDownAltIcon, ThumbUpAlt as ThumbUpAltIcon } from '@mui/icons-material';
import { Avatar, Button, Divider, Grid, LinearProgress, Link, Paper } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { DeriveReferendumExt } from '@polkadot/api-derive/types';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { VOTE_MAP } from '../../../../util/constants';
import getLogo from '../../../../util/getLogo';
import { ChainInfo, Conviction } from '../../../../util/plusTypes';
import { amountToHuman, formatMeta, remainingTime } from '../../../../util/plusUtils';
import VoteReferendum from './VoteReferendum';

interface Props {
  referendums: DeriveReferendumExt[];
  chain: Chain;
  chainInfo: ChainInfo;
  currentBlockNumber: number;
  convictions: Conviction[];
}

export default function Referendums({ chain, chainInfo, convictions, currentBlockNumber, referendums }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showVoteReferendumModal, setShowVoteReferendumModal] = useState<boolean>(false);
  const [voteInfo, setVoteInfo] = useState<{ voteType: number, refId: string }>();

  const chainName = chain?.name.replace(' Relay Chain', '');

  const handleVote = useCallback((voteType: number, refId: string) => {
    setShowVoteReferendumModal(true);
    setVoteInfo({ refId: refId, voteType: voteType });
  }, []);

  const handleVoteReferendumModalClose = useCallback(() => {
    setShowVoteReferendumModal(false);
  }, []);

  return (
    <>
      {referendums?.length
        ? referendums.map((r, index) => {
          const value = r.image?.proposal;
          const meta = value?.registry.findMetaCall(value.callIndex);
          const description = formatMeta(meta?.meta);
          console.log('meta', description)

          return (
            <Paper elevation={8} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
              <Grid container justifyContent='space-between'>
                {value ?
                  <Grid item xs={4}>
                    {meta.section}. {meta.method}
                  </Grid>
                  : <Grid item xs={4}></Grid>
                }

                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  #{String(r?.index)}
                </Grid>

                <Grid item container justifyContent='flex-end' xs={4}>
                  <Grid item>
                    <Link
                      href={`https://${chainName}.polkassembly.io/referendum/${r?.index}`}
                      underline='none'
                      rel='noreferrer'
                      target='_blank'
                    >
                      <Avatar
                        alt={'Polkassembly'}
                        src={getLogo('polkassembly')}
                        sx={{ height: 15, width: 15 }}
                      />
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link
                      href={`https://${chainName}.subscan.io/referenda/${r?.index}`}
                      underline='none'
                      rel='noreferrer'
                      target='_blank'
                    >
                      <Avatar
                        alt={'subscan'}
                        src={getLogo('subscan')}
                        sx={{ height: 15, width: 15 }}
                      />
                    </Link>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item>
                <Divider />
              </Grid>

              <Grid item xs={12} sx={{ color: 'green' }}>
                {t('Remaining Time')}{': '} {remainingTime(currentBlockNumber, r.status.end)}
              </Grid>
              <Grid container justifyContent='space-between' sx={{ fontSize: 11, paddingTop: 1, color: 'red' }}>
                <Grid item>
                  {t('End')}{': #'}{r.status.end.toString()}
                </Grid>
                <Grid item>
                  {t('Delay')}{': '}{r.status.delay.toString()}
                </Grid>
                <Grid item>
                  {t('Threshold')}{': '} {r.status.threshold.toString()}
                </Grid>
              </Grid>

              <Grid item xs={12} sx={{ fontWeight: '600', margin: '20px 1px 10px' }}>
                {description}
              </Grid>

              {/* <Grid item xs={12} sx={{ border: '1px dotted', borderRadius: '10px', padding: 1, margin: '20px 1px 20px' }}>
                {t('Hash')}<br />
                {r.imageHash.toString()}
              </Grid> */}

              <Grid container justifyContent='space-between' sx={{ paddingTop: 1 }}>
                <Grid item>
                  {t('Aye')}
                </Grid>
                <Grid item>
                  {r?.isPassing
                    ? <Grid item>
                      <CheckCircleOutlineIcon color='success' sx={{ fontSize: 15 }} />
                      {' '}{t('Passing')}
                    </Grid>
                    : <Grid item>
                      <RemoveCircleOutlineIcon color='secondary' sx={{ fontSize: 15 }} />
                      {' '}{t('Failing')}
                    </Grid>
                  }
                </Grid>
                <Grid item>
                  {t('Nay')}
                </Grid>
              </Grid>

              <Grid container justifyContent='space-between' sx={{ paddingTop: 1 }}>
                <Grid item xs={12}>
                  <LinearProgress color='warning' sx={{ backgroundColor: 'black' }} variant='determinate' value={100 * (Number(r.status.tally.ayes) / (Number(r.status.tally.nays) + Number(r.status.tally.ayes)))} />
                </Grid>
                <Grid item>
                  {Number(amountToHuman(r.status.tally.ayes.toString(), chainInfo.decimals)).toLocaleString()}{' '}{chainInfo.coin}
                </Grid>
                <Grid item>
                  {Number(amountToHuman(Number(r.status.tally.nays).toString(), chainInfo.decimals)).toLocaleString()}{' '}{chainInfo.coin}
                </Grid>
              </Grid>

              <Grid container justifyContent='space-between' sx={{ paddingTop: 2 }}>
                <Grid item>
                  <Button color='warning' onClick={() => handleVote(VOTE_MAP.AYE, String(r?.index))} startIcon={<ThumbUpAltIcon />} variant='contained'> {t('Aye')}</Button>
                </Grid>
                <Grid item>
                  <Button sx={{ color: 'black', borderColor: 'black' }} onClick={() => handleVote(VOTE_MAP.NAY, String(r?.index))} variant='outlined' endIcon={<ThumbDownAltIcon />}> {t('Nay')}</Button>
                </Grid>
              </Grid>

            </Paper>);
        })
        : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 3 }}>
          {t('No active referendum')}
        </Grid>}

      {showVoteReferendumModal &&
        <VoteReferendum
          chain={chain}
          chainInfo={chainInfo}
          convictions={convictions}
          handleVoteReferendumModalClose={handleVoteReferendumModalClose}
          showVoteReferendumModal={showVoteReferendumModal}
          voteInfo={voteInfo}
        />
      }
    </>
  );
}
