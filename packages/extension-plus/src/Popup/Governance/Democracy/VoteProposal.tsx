// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Grid } from '@mui/material';
import { ThumbsUpDown as ThumbsUpDownIcon } from '@mui/icons-material';
import { amountToHuman } from '../../../util/plusUtils';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import React, { useEffect, useState } from 'react';
import { AllAddresses, PlusHeader, Popup } from '../../../components';
import { Chain } from '../../../../../extension-chains/src/types';
import { ChainInfo } from '../../../util/plusTypes';
import getBalanceAll from '../../../util/getBalanceAll';


interface Props {
  vote: { refId: string, voteType: number };
  chain: Chain;
  chainInfo: ChainInfo;
  showVoteProposalModal: boolean;
  handleVoteProposalModalClose: () => void;
}

export default function VoteProposal({ chain, chainInfo, handleVoteProposalModalClose, showVoteProposalModal, vote }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  useEffect(() => {
    if (!selectedAddress || !chain) return;
    // eslint-disable-next-line no-void
    void getBalanceAll(selectedAddress, chain).then((b) => {
      setVotingBalance(b?.votingBalance.toString());
    });
  }, [chain, selectedAddress]);

  return (
    <Popup showModal={showVoteProposalModal} handleClose={handleVoteProposalModalClose}>
      <PlusHeader action={handleVoteProposalModalClose} chain={chain} closeText={'Close'} icon={<ThumbsUpDownIcon fontSize='small' />} title={'Second'} />

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('Select voter account')} />

      <Grid xs={12} sx={{ textAlign: 'right', padding: 3 }}>
      </Grid>
      <Grid xs={12} sx={{ textAlign: 'center', paddingTop: 3 }}>
      </Grid>
    </Popup>
  )
}
