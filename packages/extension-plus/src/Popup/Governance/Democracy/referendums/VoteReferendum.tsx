// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Paper, Grid, Link, Divider, LinearProgress, Button } from '@mui/material';
import { DeriveReferendumExt } from '@polkadot/api-derive/types';
import { OpenInNew as OpenInNewIcon, CheckCircleOutline as CheckCircleOutlineIcon, ThumbsUpDown as ThumbsUpDownIcon, RemoveCircleOutline as RemoveCircleOutlineIcon, ThumbDownAlt as ThumbDownAltIcon, ThumbUpAlt as ThumbUpAltIcon, WhereToVote as WhereToVoteIcon } from '@mui/icons-material';
import { amountToHuman, remainingTime } from '../../../../util/plusUtils';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import React, { useEffect, useState } from 'react';
import { BLOCK_RATE, VOTE_MAP } from '../../../../util/constants';
import { AllAddresses, PlusHeader, Popup } from '../../../../components';
import { Chain } from '../../../../../../extension-chains/src/types';
import { ChainInfo } from '../../../../util/plusTypes';
import getBalanceAll from '../../../../util/getBalanceAll';


interface Props {
  vote: { refId: string, voteType: number };
  chain: Chain;
  chainInfo: ChainInfo;
  showVoteReferendumModal: boolean;
  handleVoteReferendumModalClose: () => void;
}

export default function VoteReferendum({ chain, chainInfo, handleVoteReferendumModalClose, showVoteReferendumModal, vote }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [votingBalance, setVotingBalance] = useState<string>('');

  useEffect(() => {
    if (!selectedAddress || !chain) return;
    // eslint-disable-next-line no-void
    void getBalanceAll(selectedAddress, chain).then((b) => {
      setVotingBalance(b?.votingBalance.toString());
    });
  }, [chain, selectedAddress]);

  return (
    <Popup showModal={showVoteReferendumModal} handleClose={handleVoteReferendumModalClose}>
      <PlusHeader action={handleVoteReferendumModalClose} chain={chain} closeText={'Close'} icon={<ThumbsUpDownIcon fontSize='small' />} title={'Vote'} />

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('Select voter account')} />

      <Grid xs={12} sx={{ textAlign: 'right', padding: 3 }}>
        {t('Voting Balance')}:
        {Number(amountToHuman(votingBalance, chainInfo.decimals)).toLocaleString()}
      </Grid>
      <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 3 }}>
        {vote.refId}
        {vote.voteType}
      </Grid>
    </Popup>
  )
}
