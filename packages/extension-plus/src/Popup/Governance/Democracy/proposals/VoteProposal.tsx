// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveProposal } from '@polkadot/api-derive/types';

import { ThumbsUpDown as ThumbsUpDownIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup } from '../../../../components';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo } from '../../../../util/plusTypes';
import { formatMeta } from '../../../../util/plusUtils';
import getChainInfo from '../../../../util/getChainInfo';
import broadcast from '../../../../util/broadcast';


interface Props {
  selectedProposal: DeriveProposal;
  chain: Chain;
  chainInfo: ChainInfo;
  showVoteProposalModal: boolean;
  handleVoteProposalModalClose: () => void;
}

export default function VoteProposal({ chain, chainInfo, handleVoteProposalModalClose, selectedProposal, showVoteProposalModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [confirmingState, setConfirmingState] = useState<string>('');

  const value = selectedProposal.image?.proposal;
  const meta = value?.registry.findMetaCall(value.callIndex);
  const description = formatMeta(meta?.meta);

  useEffect(() => {
    if (!selectedAddress || !chain) return;
    // eslint-disable-next-line no-void
    // void getBalanceAll(selectedAddress, chain).then((b) => {
    //   setVotingBalance(b?.votingBalance.toString());
    // });
  }, [chain, selectedAddress]);

  const handleClearPassword = useCallback((): void => {
    setPasswordStatus(PASS_MAP.EMPTY);
    setPassword('');
  }, []);

  const handleSavePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  }, [handleClearPassword]);

  const handleReject = useCallback((): void => {
    setConfirmingState('');
    handleVoteProposalModalClose();
  }, [handleVoteProposalModalClose]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setConfirmingState('confirming');

    try {
      const pair = keyring.getPair(selectedAddress);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { api } = await getChainInfo(chain);
      const params = api.tx.democracy.second.meta.args.length === 2
        ? [selectedProposal.index, selectedProposal.seconds.length]
        : [selectedProposal.index];

      const tx = api.tx.democracy.second;

      const { block, failureText, fee, status, txHash } = broadcast(api, tx, params, pair);

      
    } catch (e) {
      console.log('error in VoteProposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setConfirmingState('');
    }
  }, [chain, password, selectedAddress, selectedProposal.index, selectedProposal.seconds.length]);

  return (
    <Popup handleClose={handleVoteProposalModalClose} showModal={showVoteProposalModal}>
      <PlusHeader action={handleVoteProposalModalClose} chain={chain} closeText={'Close'} icon={<ThumbsUpDownIcon fontSize='small' />} title={'Second'} />

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('Select voter account')} />

      <Grid xs={12} sx={{ fontWeight: '600', p: '80px 40px', textAlign: 'center' }}>
        {t('Proposal')}{': #'}{String(selectedProposal?.index)}<br />
        {description}
      </Grid>

      <Grid container item sx={{ p: '80px 30px', textAlign: 'center' }} xs={12}>
        <Password
          handleClearPassword={handleClearPassword}
          handleIt={handleConfirm}
          handleSavePassword={handleSavePassword}
          password={password}
          passwordStatus={passwordStatus}
        />

        <ConfirmButton
          confirmingState={confirmingState}
          handleBack={handleReject}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
        />
      </Grid>

    </Popup>
  );
}
