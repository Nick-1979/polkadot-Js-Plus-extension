// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveCouncilVote } from '@polkadot/api-derive/types';

import { GroupRemove  as GroupRemoveIcon  } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup, Progress } from '../../../../../components';
import broadcast from '../../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../../util/constants';
import getChainInfo from '../../../../../util/getChainInfo';
import getVotes from '../../../../../util/getVotes';
import { PersonsInfo } from '../../../../../util/plusTypes';
import { amountToHuman } from '../../../../../util/plusUtils';
import Members from '../Members';

interface Props {
  chain: Chain;
  coin: string;
  decimals: number;
  allCouncilInfo: PersonsInfo;
  showMyVotesModal: boolean;
  setShowMyVotesModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MyVotes({ allCouncilInfo, chain, coin, decimals, setShowMyVotesModal, showMyVotesModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [votesInfo, seVotesInfo] = useState<DeriveCouncilVote>();
  const [filteredPersonsInfo, setFilteredPersonsInfo] = useState<PersonsInfo>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');

  const handleClose = useCallback((): void => {
    setShowMyVotesModal(false);
  }, [setShowMyVotesModal]);

  useEffect(() => {
    seVotesInfo(undefined); // reset votes when change address

    // eslint-disable-next-line no-void
    void getVotes(chain, selectedAddress).then((v) => {
      console.log('v:', v);
      seVotesInfo(v);
    });
  }, [selectedAddress, chain]);

  useEffect(() => {
    if (!votesInfo || !allCouncilInfo) return;

    setFilteredPersonsInfo({ infos: allCouncilInfo.infos.filter((p) => votesInfo.votes.includes(p.accountId)) });
  }, [votesInfo, allCouncilInfo]);

  const handleClearPassword = useCallback((): void => {
    setPasswordStatus(PASS_MAP.EMPTY);
    setPassword('');
  }, []);

  const handleSavePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  }, [handleClearPassword]);

  const handleCancelVotes = async () => {
    try {
      setState('confirming');
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { api } = await getChainInfo(chain);
      const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;
      const tx = electionApi.removeVoter;

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, [], signer);

      // TODO: can save to history here

      console.log('cancel vote', failureText);
      setState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  };

  return (
    <Popup handleClose={handleClose} showModal={showMyVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<GroupRemoveIcon  fontSize='small' />} title={'My Votes'} />

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('select account to view votes')} />

      {votesInfo && filteredPersonsInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>
          <Grid item xs={12} sx={{ fontSize: 12, paddingRight: '10px', textAlign: 'right' }}>
            {t('Staked:')} {Number(amountToHuman(votesInfo.stake.toString(), decimals)).toLocaleString()} {' '}{coin}
          </Grid>

          <Grid item xs={12} id='scrollArea' sx={{ height: '250px', overflowY: 'auto' }}>
            <Members chain={chain} coin={coin} decimals={decimals} membersType={t('Votes')} personsInfo={filteredPersonsInfo} />
          </Grid>

          <Grid container item sx={{ paddingTop: '5px' }} xs={12}>

            <Password
              handleClearPassword={handleClearPassword}
              handleSavePassword={handleSavePassword}
              handleIt={handleCancelVotes}
              password={password}
              passwordStatus={passwordStatus}
              isDisabled={!votesInfo?.votes.length} />

            <ConfirmButton
              handleBack={handleClose}
              handleConfirm={handleCancelVotes}
              handleReject={handleClose}
              isDisabled={!votesInfo?.votes.length}
              state={state}
              text='Cancel votes'
            />
          </Grid>

        </Grid>
        : <Progress title={t('Loading votes ...')} />
      }
    </Popup>
  );
}
