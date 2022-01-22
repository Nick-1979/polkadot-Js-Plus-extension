// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */


import {HowToReg as HowToRegIcon} from '@mui/icons-material';
import { Grid } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, Password, PlusHeader, Popup, Progress } from '../../../../../components';
import getVotes from '../../../../../util/getVotes';
import Members from '../../Members';
import type { DeriveCouncilVote } from '@polkadot/api-derive/types';
import { BackButton, Button } from '../../../../../../../extension-ui/src/components';
import cancelVotes from '../../../../../util/cancelVotes';
import keyring from '@polkadot/ui-keyring';
import { PASSWORD_MAP } from '../../../../../util/constants';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import { CouncilInfo } from '../../../../../util/plusTypes';
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
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASSWORD_MAP.EMPTY);// 0: no password, -1: password incorrect, 1:password correct
  const [isVoting, setIsVoting] = useState<boolean>(false);
  
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
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordStatus(PASSWORD_MAP.CORRECT);
      const { block, failureText, fee, status, txHash } = await cancelVotes(chain, selectedAddress, signer);

      console.log('cancel vote', failureText);
      setIsVoting(false);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASSWORD_MAP.INCORRECT);
      // setConfirmingState('');
      setIsVoting(false);
    }
  };

  return (
    <Popup handleClose={handleClose} showModal={showVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<HowToRegIcon fontSize='small' />} title={'Vote'} />

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('select account to vote')} />

      {allCouncilInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>
         
          <Grid item xs={12} id='scrollArea' sx={{ height: '250px', overflowY: 'auto' }}>
            <VoteMembers chain={chain} coin={coin} decimals={decimals} membersType={t('Select accounts')} personsInfo={allCouncilInfo} />
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
                isDisabled={!selectedMembers.length}
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
