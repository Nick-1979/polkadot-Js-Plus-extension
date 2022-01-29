// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveCouncilVote } from '@polkadot/api-derive/types';

import { CheckRounded, Clear, Preview as PreviewIcon } from '@mui/icons-material';
import { Button as MuiButton,Container, Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import { BackButton, Button } from '../../../../../../../extension-ui/src/components';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, Password, PlusHeader, Popup, Progress } from '../../../../../components';
import cancelVotes from '../../../../../util/cancelVotes';
import { PASS_MAP } from '../../../../../util/constants';
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
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);// 0: no password, -1: password incorrect, 1:password correct
  const [state, setState] = useState<string>('');

  const handleClose = useCallback((): void => {
    setShowMyVotesModal(false);
  }, []);

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

  const handleClearPassword = (): void => {
    setPasswordStatus(PASS_MAP.EMPTY);
    setPassword('');
  };

  const handleSavePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  };

  const handleCancelVotes = async () => {
    try {
      setState('confirming');
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const { block, failureText, fee, status, txHash } = await cancelVotes(chain, signer);

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
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<PreviewIcon fontSize='small' />} title={'My Votes'} />

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('select account to view votes')} />

      {votesInfo && filteredPersonsInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>
          <Grid item xs={12} sx={{ fontSize: 12, textAlign: 'right', paddingRight: '10px' }}>
            {t('Staked:')} {Number(amountToHuman(votesInfo.stake.toString(), decimals)).toLocaleString()} {' '}{coin}

          </Grid>
          <Grid item xs={12} id='scrollArea' sx={{ height: '250px', overflowY: 'auto' }}>
            <Members chain={chain} coin={coin} decimals={decimals} membersType={t('Votes')} personsInfo={filteredPersonsInfo} />
          </Grid>

          <Password
            handleClearPassword={handleClearPassword}
            handleSavePassword={handleSavePassword}
            handleIt={handleCancelVotes}
            password={password}
            passwordStatus={passwordStatus}
            isDisabled={!votesInfo?.votes.length} />

          <Grid container item justifyContent='space-between' sx={{ padding: '5px 10px 0px' }} xs={12}>
            {['success', 'failed'].includes(state)
              ? <Grid item xs={12}>
                <MuiButton fullWidth onClick={handleClose} variant='contained'
                  color={state === 'success' ? 'success' : 'error'} size='large'>
                  {state === 'success' ? t('Done') : t('Failed')}
                </MuiButton>
              </Grid>
              : <>
                <Grid item xs={1}>
                  <BackButton onClick={handleClose} />
                </Grid>
                <Grid item xs={11} sx={{ paddingLeft: '10px' }}>
                  <Button
                    data-button-action=''
                    isBusy={state === 'confirming'}
                    isDisabled={!votesInfo?.votes.length}
                    onClick={handleCancelVotes}
                  >
                    {t('Cancel votes')}
                  </Button>
                </Grid>
              </>}
          </Grid>
        </Grid>
        : <Progress title={t('Loading votes ...')} />
      }
    </Popup>
  );
}
