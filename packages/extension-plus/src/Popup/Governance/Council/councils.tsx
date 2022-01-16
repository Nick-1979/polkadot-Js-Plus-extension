// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Paper, Grid, Link, Divider, LinearProgress, Button } from '@mui/material';
import { DeriveReferendumExt } from '@polkadot/api-derive/types';
import { OpenInNew as OpenInNewIcon, CheckCircleOutline as CheckCircleOutlineIcon, HowToVote as HowToVoteIcon, RemoveCircleOutline as RemoveCircleOutlineIcon, ThumbDownAlt as ThumbDownAltIcon, ThumbUpAlt as ThumbUpAltIcon, WhereToVote as WhereToVoteIcon } from '@mui/icons-material';
import { amountToHuman } from '../../../util/plusUtils';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import React, { useEffect, useState } from 'react';
import { BLOCK_RATE } from '../../../util/constants';

interface Props {
    referendums: DeriveReferendumExt[];
    chainName: string;
    coin: string;
    decimals: number;
    currentBlockNumber: number;
}

function remainingTime(currentBlockNumber: number, end: number): string {
    end = Number(end.toString())
    let mins = Math.floor((end - currentBlockNumber) * BLOCK_RATE / 60);
    console.log('mins', mins)
    if (!mins) return 'finished';

    let hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    let time = ''
    if (days)
        time += days + ' days ';
    hrs -= days * 24;
    if (hrs)
        time += hrs + ' hours ';
    mins -= hrs * 60;
    if (mins)
        time += mins + ' mins ';

    return time;
}

export default function Councils({ chainName, coin, currentBlockNumber, decimals, referendums }: Props): React.ReactElement<Props> {
    const { t } = useTranslation();

    return (
        <>
            {referendums?.length
                ? referendums.map((r, index) => (
                    <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 40px' }}>
                        <Grid container justifyContent='space-between'>
                            <Grid item>
                                {r?.image.proposal._meta.name}
                            </Grid>
                            <Grid item>
                                #{String(r?.index)} {' '}
                                <Link target='_blank' rel='noreferrer' href={`https://${chainName}.subscan.io/referenda/${r?.index}`}>
                                    <OpenInNewIcon sx={{ fontSize: 10 }} />
                                </Link>
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
                                {t('End')}{': '}{r.status.end.toString()}
                            </Grid>
                            <Grid item>
                                {t('Delay')}{': '}{r.status.delay.toString()}
                            </Grid>
                            <Grid item>
                                {t('Threshold')}{': '} {r.status.threshold.toString()}
                            </Grid>
                        </Grid>

                        <Grid item xs={12} sx={{ margin: '20px 1px 10px' }}>
                            {r.image.proposal._meta.docs}
                        </Grid>
                        <Grid item xs={12} sx={{ border: '1px dotted', borderRadius: '10px', padding: 1, margin: '20px 1px 20px' }}>
                            {t('Hash')}<br />
                            {r.imageHash.toString()}
                        </Grid>

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
                                    : <Grid item >
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
                                <LinearProgress variant='determinate' value={100 * (Number(r.status.tally.ayes) / (Number(r.status.tally.nays) + Number(r.status.tally.ayes)))} />
                            </Grid>
                            <Grid item>
                                {amountToHuman(r.status.tally.ayes.toString(), decimals)}{coin}
                            </Grid>
                            <Grid item>
                                {amountToHuman(Number(r.status.tally.nays).toString(), decimals)}{coin}
                            </Grid>
                        </Grid>

                        <Grid container justifyContent='space-between' sx={{ paddingTop: 2 }}>
                            <Grid item>
                                <Button variant='contained' startIcon={<ThumbUpAltIcon />}> {t('Aye')}</Button>
                            </Grid>
                            <Grid item>
                                <Button variant='outlined' endIcon={<ThumbDownAltIcon />}> {t('Nay')}</Button>
                            </Grid>
                        </Grid>

                    </Paper>))
                : <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 3 }}>
                    {t('No active referendum')}
                </Grid>}
        </>
    )
}
