// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/**
 * @description here one can vote Aye or Nay to a referendum
 *
*/
import { ThumbDownAlt as ThumbDownAltIcon, ThumbUpAlt as ThumbUpAltIcon } from '@mui/icons-material';
import { FormControl, FormHelperText, Grid, InputAdornment, InputLabel, Select, SelectChangeEvent, Skeleton, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import { AccountContext } from '../../../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../../extension-ui/src/messaging';
import { ConfirmButton, Participator, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP, VOTE_MAP } from '../../../../util/constants';
import { ChainInfo, Conviction, nameAddress, TransactionDetail } from '../../../../util/plusTypes';
import { amountToMachine, fixFloatingPoint, saveHistory } from '../../../../util/plusUtils';

interface Props {
  address: string;
  voteInfo: { refId: string, voteType: number };
  chain: Chain;
  chainInfo: ChainInfo;
  convictions: Conviction[];
  showVoteReferendumModal: boolean;
  handleVoteReferendumModalClose: () => void;
}

export default function VoteReferendum({ address, chain, chainInfo, convictions, handleVoteReferendumModalClose, showVoteReferendumModal, voteInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [votingBalance, setVotingBalance] = useState<Balance | undefined>();
  const [voteValueInHuman, setVoteValueInHuman] = useState<string>();
  const [voteValue, setVoteValue] = useState<Balance | undefined>();
  const [selectedConviction, setSelectedConviction] = useState<number>(convictions[0].value);
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const { api, coin, decimals } = chainInfo;

  const isCurrentVote = !!api.query.democracy.votingOf;
  const tx = api.tx.democracy.vote;

  useEffect(() => {
    const voteValueInMachine = amountToMachine(voteValueInHuman, decimals);
    const voteValueInBalanceType = api.createType('Balance', voteValueInMachine);

    setVoteValue(voteValueInBalanceType);
  }, [api, decimals, voteValueInHuman]);

  useEffect(() => {
    if (!encodedAddressInfo) { return; }

    // eslint-disable-next-line no-void
    void api.derive.balances?.all(encodedAddressInfo.address).then((b) => {
      setVotingBalance(b?.votingBalance);
    }).catch(console.error);
  }, [api.derive.balances, encodedAddressInfo]);

  useEffect(() => {
    if (!tx || !encodedAddressInfo) {
      return;
    }

    const p = isCurrentVote
      ? [voteInfo.refId, { Standard: { vote: { aye: voteInfo.voteType, selectedConviction }, voteValue } }]
      : [voteInfo.refId, { aye: voteInfo.voteType, selectedConviction }];

    setParams(p);

    // eslint-disable-next-line no-void
    void tx(...p).paymentInfo(encodedAddressInfo.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);
  }, [chainInfo, isCurrentVote, encodedAddressInfo, selectedConviction, tx, voteInfo, voteValue, api.derive.balances]);

  useEffect(() => {
    if (!estimatedFee || !availableBalance || voteValue === undefined || !votingBalance) {
      setIsDisabled(true);
    } else {
      setIsDisabled(voteValue.add(estimatedFee).gt(votingBalance));
    }
  }, [availableBalance, estimatedFee, voteValue, votingBalance]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    try {
      if (!encodedAddressInfo?.address) {
        console.log('no encoded address');

        return;
      }

      setState('confirming');

      const pair = keyring.getPair(encodedAddressInfo.address);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair, encodedAddressInfo?.address);

      const currentTransactionDetail: TransactionDetail = {
        action: 'democracy_vote',
        amount: voteValueInHuman,
        block,
        date: Date.now(),
        fee: fee || String(estimatedFee) || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: voteInfo.refId
      };

      updateMeta(...saveHistory(chain, hierarchy, encodedAddressInfo.address, currentTransactionDetail)).catch(console.error);

      setState(status);
    } catch (e) {
      console.log('error in VoteProposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [encodedAddressInfo?.address, password, estimatedFee, api, tx, params, voteValueInHuman, voteInfo.refId, chain, hierarchy]);

  const handleReject = useCallback((): void => {
    setState('');
    handleVoteReferendumModalClose();
  }, [handleVoteReferendumModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVoteValueInHuman(fixFloatingPoint(event.target.value));
  }, []);

  const handleConvictionChange = useCallback((event: SelectChangeEvent<number>): void => {
    console.log('selected', event.target.value);
    setSelectedConviction(Number(event.target.value));
  }, []);

  const HelperText = () => (
    <Grid
      container
      item
      justifyContent='space-between'
      xs={12}
    >
      <Grid item>
        {t('This value is locked for the duration of the vote')}
      </Grid>
      <Grid item>
        {t('Fee')} {': '}
        {estimatedFee
          ? `${estimatedFee.toHuman()}`
          : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
        }
      </Grid>
    </Grid>);

  return (
    <Popup
      handleClose={handleVoteReferendumModalClose}
      showModal={showVoteReferendumModal}
    >
      <PlusHeader
        action={handleVoteReferendumModalClose}
        chain={chain}
        closeText={'Close'}
        icon={voteInfo.voteType === VOTE_MAP.AYE ? <ThumbUpAltIcon fontSize='small' /> : <ThumbDownAltIcon fontSize='small' />}
        title={`${t('Vote')} to ${voteInfo.refId}`}
      />
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
      <Grid
        item
        sx={{ color: grey[600], fontSize: 11, px: '48px', textAlign: 'right' }}
        xs={12}
      >
        <ShowBalance
          balance={votingBalance}
          chainInfo={chainInfo}
          decimalDigits={5}
          title={t('Voting balance')}
        />
      </Grid>
      <Grid
        item
        sx={{ p: '50px 40px 20px' }}
        xs={12}
      >
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Vote value')}
          margin='dense'
          name='voteValueInHuman'
          onChange={handleChange}
          placeholder='0'
          size='medium'
          type='number'
          value={voteValueInHuman}
          variant='outlined'
        />
      </Grid>
      <Grid
        item
        sx={{ p: '5px 40px 20px' }}
        xs={12}
      >
        <FormControl fullWidth>
          <InputLabel>{t('Locked for')}</InputLabel>
          <Select
            label='Select Convictions'
            native
            onChange={handleConvictionChange}
            sx={{ fontSize: 12, height: 50 }}
            value={selectedConviction}
          >
            {convictions?.map((c) => (
              <option
                key={c.value}
                style={{ fontSize: 13 }}
                value={c.value}
              >
                {c.text}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormHelperText>{t('The conviction to use for this vote with appropriate lock period')}</FormHelperText>
      </Grid>
      <Grid
        container
        item
        sx={{ p: '40px 30px', textAlign: 'center' }}
        xs={12}
      >
        <Password
          handleIt={handleConfirm}
          isDisabled={isDisabled || !!state}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />
        <ConfirmButton
          handleBack={handleReject}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
          isDisabled={isDisabled}
          state={state}
        />
      </Grid>
    </Popup>
  );
}
