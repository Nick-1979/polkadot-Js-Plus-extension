// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveCouncilVote } from '@polkadot/api-derive/types';

import { GroupRemove as GroupRemoveIcon } from '@mui/icons-material';
import { Container, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import { AccountContext } from '../../../../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Participator, Password, PlusHeader, Popup, Progress, ShowBalance } from '../../../../../components';
import broadcast from '../../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../../util/constants';
import { ChainInfo, nameAddress, PersonsInfo, TransactionDetail } from '../../../../../util/plusTypes';
import { saveHistory } from '../../../../../util/plusUtils';
import Members from '../Members';

interface Props {
  address: string;
  chain: Chain;
  chainInfo: ChainInfo;
  allCouncilInfo: PersonsInfo;
  showMyVotesModal: boolean;
  setShowMyVotesModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CancelVote({ address, allCouncilInfo, chain, chainInfo, setShowMyVotesModal, showMyVotesModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [votesInfo, seVotesInfo] = useState<DeriveCouncilVote>();
  const [votedPersonsInfo, setVotedPersonsInfo] = useState<PersonsInfo>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean | undefined>();

  const { api } = chainInfo;
  const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;
  const tx = electionApi.removeVoter;

  useEffect(() => {
    setConfirmButtonDisabled(!votesInfo?.votes?.length || !estimatedFee || !availableBalance || estimatedFee.gt(availableBalance));
  }, [availableBalance, estimatedFee, votesInfo?.votes?.length]);

  useEffect(() => {
    if (!encodedAddressInfo) { return; }

    // eslint-disable-next-line no-void
    void tx().paymentInfo(encodedAddressInfo.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);

    seVotesInfo(undefined); // reset votes when change address

    // eslint-disable-next-line no-void
    void api.derive.council.votesOf(encodedAddressInfo.address).then((v) => {
      console.log('v:', v);
      seVotesInfo(v);
    });
  }, [api.derive.council, encodedAddressInfo, tx]);

  const handleClose = useCallback((): void => {
    setShowMyVotesModal(false);
  }, [setShowMyVotesModal]);

  useEffect(() => {
    if (!votesInfo || !allCouncilInfo) { return; }

    const voted: PersonsInfo = { backed: [], infos: [] };

    allCouncilInfo.infos.forEach((p, index) => {
      if (p.accountId && votesInfo.votes.includes(p.accountId)) {
        voted.backed.push(allCouncilInfo.backed[index]);
        voted.infos.push(allCouncilInfo.infos[index]);
      }
    });
    setVotedPersonsInfo(voted);
  }, [votesInfo, allCouncilInfo]);

  const handleCancelVotes = useCallback(async () => {
    try {
      if (!encodedAddressInfo?.address) {
        console.log('no encoded address');

        return;
      }

      setState('confirming');
      const signer = keyring.getPair(encodedAddressInfo.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, [], signer, encodedAddressInfo.address);

      const currentTransactionDetail: TransactionDetail = {
        action: 'cancel_vote',
        amount: '',
        block,
        date: Date.now(),
        fee: fee || String(estimatedFee) || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: ''
      };

      updateMeta(...saveHistory(chain, hierarchy, estimatedFee, encodedAddressInfo.address, currentTransactionDetail)).catch(console.error);

      setState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [api, chain, encodedAddressInfo?.address, hierarchy, password, tx]);

  return (
    <Popup handleClose={handleClose} showModal={showMyVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<GroupRemoveIcon fontSize='small' />} title={'My Votes'} />
      <Participator
        address={address}
        availableBalance={availableBalance}
        chain={chain}
        chainInfo={chainInfo}
        encodedAddressInfo={encodedAddressInfo}
        role={t('Voter')}
        setAvailableBalance={setAvailableBalance}
        setEncodedAddressInfo={setEncodedAddressInfo}
      />
      <Grid container justifyContent='space-between' sx={{ color: grey[600], fontSize: 12, p: '0px 47px 10px 95px', textAlign: 'right' }}>
        <Grid item>
          <ShowBalance balance={votesInfo?.stake} chainInfo={chainInfo} title={t('Staked')} />
        </Grid>
        <Grid item>
          <ShowBalance balance={estimatedFee} chainInfo={chainInfo} title={t('Fee')} />
        </Grid>
      </Grid>
      <Container id='scrollArea' sx={{ height: '280px', overflowY: 'auto' }}>
        {votesInfo && votedPersonsInfo
          ? <Members chain={chain} chainInfo={chainInfo} membersType={t('Votes')} personsInfo={votedPersonsInfo} />
          : <Progress title={t('Loading votes ...')} />
        }
      </Container>
      <Grid container item sx={{ padding: '5px 30px' }} xs={12}>
        <Password
          handleIt={handleCancelVotes}
          isDisabled={confirmButtonDisabled || !!state}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus} />
        <ConfirmButton
          handleBack={handleClose}
          handleConfirm={handleCancelVotes}
          handleReject={handleClose}
          isDisabled={confirmButtonDisabled}
          state={state}
          text='Cancel votes'
        />
      </Grid>
    </Popup>
  );
}
