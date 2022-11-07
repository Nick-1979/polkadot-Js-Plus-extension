// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { HowToReg as HowToRegIcon } from '@mui/icons-material';
import { Grid, InputAdornment, TextField, Tooltip } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import { AccountContext } from '../../../../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Participator, Password, PlusHeader, Popup, Progress, ShowBalance } from '../../../../../components';
import broadcast from '../../../../../util/api/broadcast';
import getVotingBond from '../../../../../util/api/getVotingBond';
import { PASS_MAP } from '../../../../../util/constants';
import { ChainInfo, nameAddress, PersonsInfo, TransactionDetail } from '../../../../../util/plusTypes';
import { amountToMachine, saveHistory } from '../../../../../util/plusUtils';
import VoteMembers from './VoteMembers';

interface Props {
  address: string;
  chain: Chain;
  allCouncilInfo: PersonsInfo;
  chainInfo: ChainInfo;
  showVotesModal: boolean;
  setShowVotesModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Vote({ address, allCouncilInfo, chain, chainInfo, setShowVotesModal, showVotesModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [votingBondBase, setVotingBondBase] = useState<bigint>();
  const [votingBondFactor, setVotingBondFactor] = useState<bigint>();
  const [votingBond, setVotingBond] = useState<Balance | undefined>();
  const [state, setState] = useState<string>('');
  const [voteValueInHuman, setVoteValueInHuman] = useState<string>('');
  const [voteValue, setVoteValue] = useState<Balance | undefined>();
  const [votingBalance, setVotingBalance] = useState<Balance | undefined>();
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean | undefined>();

  const { api, coin, decimals } = chainInfo;
  const params = useMemo(() => [selectedCandidates, voteValue], [selectedCandidates, voteValue]);

  const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;
  const tx = electionApi.vote;

  useEffect(() => {
    setConfirmButtonDisabled(!votingBalance || !estimatedFee || !votingBond || !voteValue?.gtn(0) || voteValue.add(estimatedFee).add(votingBond).gt(votingBalance));
  }, [estimatedFee, voteValue, votingBalance, votingBond]);

  useEffect(() => {
    if (!encodedAddressInfo) { return; }

    // eslint-disable-next-line no-void
    void api.derive.balances?.all(encodedAddressInfo.address).then((b) => {
      setVotingBalance(b?.votingBalance);
    }).catch(console.error);
  }, [api.derive.balances, encodedAddressInfo]);

  useEffect(() => {
    if (!encodedAddressInfo) { return; }

    // eslint-disable-next-line no-void
    void tx(...params).paymentInfo(encodedAddressInfo.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);
  }, [params, encodedAddressInfo, tx]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getVotingBond(chain).then((r) => {
      setVotingBondBase(BigInt(r[0].toString()));
      setVotingBondFactor(BigInt(r[1].toString()));
    });
  }, [chain]);

  useEffect(() => {
    if (votingBondBase && votingBondFactor) {
      const vBond = votingBondBase + votingBondFactor * BigInt(selectedCandidates.length);

      setVotingBond(api.createType('Balance', vBond));
    }
  }, [api, selectedCandidates, votingBondBase, votingBondFactor]);

  const handleClose = useCallback((): void => {
    setShowVotesModal(false);
  }, [setShowVotesModal]);

  const handleVote = useCallback(async () => {
    try {
      if (!encodedAddressInfo?.address) {
        console.log('no encoded address');

        return;
      }

      setState('confirming');
      const signer = keyring.getPair(encodedAddressInfo.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, signer, encodedAddressInfo.address);

      const currentTransactionDetail: TransactionDetail = {
        action: 'council_vote',
        amount: voteValueInHuman,
        block,
        date: Date.now(),
        fee: fee || String(estimatedFee) || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: ''
      };

      updateMeta(...saveHistory(chain, hierarchy, encodedAddressInfo.address, currentTransactionDetail)).catch(console.error);

      setState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [api, chain, encodedAddressInfo?.address, estimatedFee, hierarchy, params, password, tx, voteValueInHuman]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;

    setVoteValueInHuman(value);
    const valueToMachine = amountToMachine(value, decimals);

    setVoteValue(api.createType('Balance', valueToMachine));
  }, [api, decimals]);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('will be locked and used in elections')}
      </Grid>
      <Grid item>
        <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleClose} showModal={showVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<HowToRegIcon fontSize='small' />} title={'Vote'} />
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
      <Grid container item justifyContent='space-between' sx={{ pl: '115px', pr: '48px' }} xs={12}>
        <Grid item sx={{ fontSize: 11 }}>
          <Tooltip id='votingBond' placement='bottom' title={t('will be reserved for the duration of your vote')}>
            <ShowBalance balance={votingBond} chainInfo={chainInfo} decimalDigits={5} title={t('Voting bond')} />
          </Tooltip>
        </Grid>
        <Grid item sx={{ fontSize: 11 }}>
          <ShowBalance balance={votingBalance} chainInfo={chainInfo} decimalDigits={5} title={t('Voting balance')} />
        </Grid>
      </Grid>
      <Grid item sx={{ fontSize: 11, p: '5px 40px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { fontSize: 13 }, endAdornment: (<InputAdornment position='end' sx={{ fontSize: 10 }}>{coin}</InputAdornment>) }}
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Value')}
          margin='dense'
          name='value'
          onChange={handleChange}
          placeholder={t('Positive number')}
          size='medium'
          type='number'
          value={voteValueInHuman}
          variant='outlined'
        />
      </Grid>
      {allCouncilInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>
          <Grid id='scrollArea' item sx={{ height: '200px', overflowY: 'auto' }} xs={12}>
            <VoteMembers chain={chain} chainInfo={chainInfo} membersType={t('Accounts to vote')} personsInfo={allCouncilInfo} setSelectedCandidates={setSelectedCandidates} />
          </Grid>
          <Grid container item sx={{ paddingTop: '10px' }} xs={12}>
            <Password
              handleIt={handleVote}
              isDisabled={!!state || confirmButtonDisabled}
              password={password}
              passwordStatus={passwordStatus}
              setPassword={setPassword}
              setPasswordStatus={setPasswordStatus}
            />
            <ConfirmButton
              handleBack={handleClose}
              handleConfirm={handleVote}
              handleReject={handleClose}
              isDisabled={confirmButtonDisabled}
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
