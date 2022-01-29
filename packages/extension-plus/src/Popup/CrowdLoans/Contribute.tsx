// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AllOut as AllOutIcon, CheckRounded, Clear } from '@mui/icons-material';
import { Button as MuiButton, Grid, IconButton, InputAdornment, SelectChangeEvent, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useContext, useEffect, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';

import { BackButton, Button } from '../../../../extension-ui/src/components';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, PlusHeader, Popup } from '../../components';
import contribute from '../../util/contribute';
import { Auction, ChainInfo, Crowdloan, TransactionDetail } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';
import Fund from './Fund';

interface Props {
  auction: Auction;
  crowdloan: Crowdloan;
  contributeModal: boolean;
  setContributeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  endpoints: LinkOption[];
  chainInfo: ChainInfo;
}

export default function Contribute({ auction,
  chainInfo,
  contributeModal,
  crowdloan,
  endpoints,
  setContributeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(chainInfo.genesisHash, true);
  const [password, setPassword] = useState<string>('');
  const [contributionAmountInHuman, setContributionAmountInHuman] = useState<string>('');
  const [passwordIsCorrect, setPasswordIsCorrect] = useState<number>(0);// 0: no password, -1: password incorrect, 1:password correct
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [confirmingState, setConfirmingState] = useState<string>('');
  const { hierarchy } = useContext(AccountContext);

  const handleConfirmModaClose = (): void => {
    setContributeModalOpen(false);
  }

  function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail, _chainName?: string): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress, _chainName);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory, _chainName));
  }

  const handleConfirm = async (): Promise<void> => {
    setConfirmingState('confirming');

    try {
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordIsCorrect(1);

      const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, chainInfo.decimals);

      const { block, failureText, fee, status, txHash } = await contribute(signer, crowdloan.fund.paraId, contributingAmountInMachine, chain)

      const history: TransactionDetail = {
        action: 'contribute',
        amount: contributionAmountInHuman,
        block: block,
        date: Date.now(),
        fee: fee || '',
        from: selectedAddress,
        hash: txHash || '',
        status: failureText || status,
        to: ''
      };

      console.log('history', history);

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, selectedAddress, history);
    } catch (e) {
      console.log('error:', e);
      setPasswordIsCorrect(-1);
      setConfirmingState('');
    }
  };

  const handleReject = (): void => {
    setConfirmingState('');
    handleConfirmModaClose();
  };

  const handleAddressChange = (event: SelectChangeEvent) => {
    setSelectedAddress(event.target.value);
  };

  const handleConfirmCrowdloanModalBack = (): void => {
    handleConfirmModaClose();
  };

  const handleClearPassword = (): void => {
    setPasswordIsCorrect(0);
    setPassword('');
  };

  const handleSavePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  };

  function handleContributionAmountChange(value: string) {
    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    setContributionAmountInHuman(fixFloatingPoint(value));
  }

  return (
    <Popup handleClose={handleConfirmModaClose} showModal={contributeModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<AllOutIcon fontSize='small' />} title={'Contribute'} />

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('Select account to contribute')} />

      <Grid item sx={{ padding: '20px 40px 20px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          // error={reapeAlert || noFeeAlert || zeroBalanceAlert}
          fullWidth
          helperText={(t('Minimum contribution: ') + amountToHuman(auction.minContribution, chainInfo.decimals) + ' ' + chainInfo.coin)}
          label={t('Amount')}
          margin='dense'
          name='contributionAmount'
          // onBlur={(event) => handleTransferAmountOnBlur(event.target.value)}
          onChange={(event) => handleContributionAmountChange(event.target.value)}
          placeholder={amountToHuman(auction.minContribution, chainInfo.decimals)}
          size='medium'
          type='number'
          value={contributionAmountInHuman}
          variant='outlined'
        />
      </Grid>

      <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, padding: '1px 50px 5px', textAlign: 'center' }} xs={12}>
        {t('Crowdloan to contribute')}
      </Grid>

      <Grid item sx={{ padding: '1px 30px' }} xs={12}>
        {chain && <Fund coin={chainInfo.coin} decimals={chainInfo.decimals} crowdloan={crowdloan} endpoints={endpoints} />}
      </Grid>

      <Grid item sx={{ margin: '20px 30px 5px' }} xs={12}>
        <TextField
          InputLabelProps={{
            shrink: true
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  onClick={handleClearPassword}
                >
                  {password !== '' ? <Clear /> : ''}
                </IconButton>
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position='start'>
                {passwordIsCorrect === 1 ? <CheckRounded color='success' /> : ''}
              </InputAdornment>
            ),
            style: { fontSize: 16 }
          }}
          // autoFocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
          color='warning'
          // disabled={!ledger}
          error={passwordIsCorrect === -1}
          fullWidth
          helperText={passwordIsCorrect === -1 ? t('Password is not correct') : t('Please enter the stake account password')}
          label={t('Password')}
          onChange={handleSavePassword}
          onKeyPress={(event) => {
            if (event.key === 'Enter') { handleConfirm(); }
          }}
          size='medium'
          type='password'
          value={password}
          variant='outlined'
        />
      </Grid>

      <Grid container item justifyContent='space-between' sx={{ padding: '5px 30px 0px' }} xs={12}>
        {['success', 'failed'].includes(confirmingState)
          ? <Grid item xs={12}>
            <MuiButton fullWidth onClick={handleReject} variant='contained'
              color={confirmingState === 'success' ? 'success' : 'error'} size='large'>
              {confirmingState === 'success' ? t('Done') : t('Failed')}
            </MuiButton>
          </Grid>
          : <>
            <Grid item xs={1}>
              <BackButton onClick={handleConfirmCrowdloanModalBack} />
            </Grid>
            <Grid item xs={11} sx={{ paddingLeft: '10px' }}>
              <Button
                data-button-action=''
                isBusy={confirmingState === 'confirming'}
                isDisabled={!selectedAddress}
                onClick={handleConfirm}
              >
                {t('Confirm')}
              </Button>
            </Grid>
          </>}
      </Grid>
    </Popup>
  );
}
