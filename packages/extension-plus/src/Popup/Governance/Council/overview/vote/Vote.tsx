// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { HowToReg as HowToRegIcon } from '@mui/icons-material';
import { Grid, Skeleton } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import { BackButton, Button } from '../../../../../../../extension-ui/src/components';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, Password, PlusHeader, Popup, Progress } from '../../../../../components';
import { PASSWORD_MAP } from '../../../../../util/constants';
import getVotingBond from '../../../../../util/getVoyingBond';
import { PersonsInfo } from '../../../../../util/plusTypes';
import { amountToHuman } from '../../../../../util/plusUtils';
import vote from '../../../../../util/vote';
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
  const [passwordStatus, setPasswordStatus] = useState<number>(PASSWORD_MAP.EMPTY);// 0: no password, -1: password incorrect, 1:password correct
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [votingBondBase, setVotingBondBase] = useState<bigint>();
  const [votingBondFactor, setVotingBondFactor] = useState<bigint>();
  const [votingBond, setVotingBond] = useState<bigint>();

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
  }, []);

  const handleClearPassword = (): void => {
    setPasswordStatus(PASSWORD_MAP.EMPTY);
    setPassword('');
  };

  const handleSavePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  };

  const handleVote = async () => {
    try {
      setIsVoting(true);
      const signer = keyring.getPair(selectedVoterAddress);

      signer.unlock(password);
      setPasswordStatus(PASSWORD_MAP.CORRECT);
      const { block, failureText, fee, status, txHash } = await vote(chain, selectedCandidates, votingBond, signer);

      console.log('vote failureText', failureText);
      setIsVoting(false);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASSWORD_MAP.INCORRECT);
      setIsVoting(false);
    }
  };

  return (
    <Popup handleClose={handleClose} showModal={showVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<HowToRegIcon fontSize='small' />} title={'Vote'} />

      <AllAddresses chain={chain} selectedAddress={selectedVoterAddress} setSelectedAddress={setSelectedVoterAddress} text={t('Select voter account')} />


      <Grid item xs={12} sx={{ textAlign: 'right', padding:'0px 40px 10px'}}>
         {t('Voting bond')}:{' '}
         {votingBond ?
          <>
           {amountToHuman(votingBond.toString(), decimals, 4)}{' '}{coin}
          </>
          :<Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }}/>
        }
      </Grid>

      {allCouncilInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>

          <Grid item xs={12} id='scrollArea' sx={{ height: '250px', overflowY: 'auto', paddingBottom:'5px' }}>
            <VoteMembers chain={chain} coin={coin} decimals={decimals} setSelectedCandidates={setSelectedCandidates} membersType={t('Accounts to vote')} personsInfo={allCouncilInfo} />
          </Grid>

          <Password
            handleClearPassword={handleClearPassword}
            handleSavePassword={handleSavePassword}
            handleIt={handleVote}
            password={password}
            passwordStatus={passwordStatus} />

          <Grid container item justifyContent='space-between' sx={{ padding: '5px 10px 0px' }} xs={12}>
            {/* {['success', 'failed'].includes(confirmingState)
          ? <Grid item xs={12}>
            <MuiButton fullWidth onClick={handleReject} variant='contained'
              color={confirmingState === 'success' ? 'success' : 'error'} size='large'>
              {confirmingState === 'success' ? t('Done') : t('Failed')}
            </MuiButton>
          </Grid>
          : <> */}
            <Grid item xs={1}>
              <BackButton onClick={handleClose} />
            </Grid>
            <Grid item xs={11} sx={{ paddingLeft: '10px' }}>
              <Button
                data-button-action=''
                isBusy={isVoting}
                isDisabled={!selectedCandidates.length}
                onClick={handleVote}
              >
                {t('Vote')}
              </Button>
            </Grid>
            {/* </>} */}
          </Grid>


        </Grid>
        : <Progress title={t('Loading members ...')} />
      }
    </Popup>
  );
}
