// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { HowToReg as HowToRegIcon } from '@mui/icons-material';
import { Grid, Skeleton } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup, Progress } from '../../../../../components';
import broadcast from '../../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../../util/constants';
import getChainInfo from '../../../../../util/getChainInfo';
import getVotingBond from '../../../../../util/getVotingBond';
import { PersonsInfo } from '../../../../../util/plusTypes';
import { amountToHuman } from '../../../../../util/plusUtils';
import VoteMembers from './VoteMembers';

interface Props {
  chain: Chain;
  coin: string;
  allCouncilInfo: PersonsInfo;
  decimals: number;
  showVotesModal: boolean;
  setShowVotesModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Vote({ allCouncilInfo, chain, coin, decimals, setShowVotesModal, showVotesModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedVoterAddress, setSelectedVoterAddress] = useState<string>('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [votingBondBase, setVotingBondBase] = useState<bigint>();
  const [votingBondFactor, setVotingBondFactor] = useState<bigint>();
  const [votingBond, setVotingBond] = useState<bigint>();
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getVotingBond(chain).then((r) => {
      console.log('voting bond', r);
      setVotingBondBase(BigInt(r[0].toString()));
      setVotingBondFactor(BigInt(r[1].toString()));
    });
  }, [chain]);

  useEffect(() => {
    if (votingBondBase && votingBondFactor) { setVotingBond(BigInt(votingBondBase) + votingBondFactor * BigInt(selectedCandidates.length)); }
  }, [selectedCandidates, votingBondBase, votingBondFactor]);

  const handleClose = useCallback((): void => {
    setShowVotesModal(false);
  }, [setShowVotesModal]);

  const handleClearPassword = useCallback((): void => {
    setPasswordStatus(PASS_MAP.EMPTY);
    setPassword('');
  }, []);

  const handleSavePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  }, [handleClearPassword]);

  const handleVote = async () => {
    try {
      setState('confirming');
      const signer = keyring.getPair(selectedVoterAddress);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { api } = await getChainInfo(chain);
      const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;
      const tx = electionApi.vote;
      const params = [selectedCandidates, votingBond];

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, signer);

      // TODO: can save to history here

      console.log('vote failureText', failureText);
      setState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  };

  return (
    <Popup handleClose={handleClose} showModal={showVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<HowToRegIcon fontSize='small' />} title={'Vote'} />

      <AllAddresses chain={chain} selectedAddress={selectedVoterAddress} setSelectedAddress={setSelectedVoterAddress} text={t('Select voter account')} />

      <Grid item xs={12} sx={{ padding: '0px 40px 10px', textAlign: 'right' }}>
        {t('Voting bond')}:{' '}
        {votingBond
          ? <>
            {amountToHuman(votingBond.toString(), decimals, 4)}{' '}{coin}
          </>
          : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
        }
      </Grid>

      {allCouncilInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>

          <Grid item xs={12} id='scrollArea' sx={{ height: '250px', overflowY: 'auto', paddingBottom: '5px' }}>
            <VoteMembers chain={chain} coin={coin} decimals={decimals} membersType={t('Accounts to vote')} personsInfo={allCouncilInfo} setSelectedCandidates={setSelectedCandidates} />
          </Grid>

          <Grid container item sx={{ paddingTop: '5px' }} xs={12}>
            <Password
              handleClearPassword={handleClearPassword}
              handleSavePassword={handleSavePassword}
              handleIt={handleVote}
              password={password}
              passwordStatus={passwordStatus}
            />

            <ConfirmButton
              handleBack={handleClose}
              handleConfirm={handleVote}
              handleReject={handleClose}
              state={state}
              text='Vote'
            />
          </Grid>
        </Grid>
        : <Progress title={t('Loading members ...')} />
      }
    </Popup>
  );
}
