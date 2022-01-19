// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CheckRounded, Clear, ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Button as MuiButton, FormControl, FormHelperText, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useContext, useEffect, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
// import { updateMeta } from '../../../../extension-ui/messaging';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import Identicon from '@polkadot/react-identicon';
import keyring from '@polkadot/ui-keyring';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { BackButton, Button } from '../../../../extension-ui/src/components';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import PlusHeader from '../../components/PlusHeader';
import Popup from '../../components/Popup';
import contribute from '../../util/contribute';
import getNetworkInfo from '../../util/getNetwork';
import { Auction, Crowdloan, TransactionDetail } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';
import Fund from './Fund';

interface Props {
  auction: Auction;
  crowdloan: Crowdloan;
  confirmModalOpen: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  decimals: number;
  endpoints: LinkOption[];
  selectedBlockchain: string;

}

export default function ConfirmCrowdloan({ auction,
  confirmModalOpen,
  crowdloan,
  decimals,
  endpoints,
  selectedBlockchain,
  setConfirmModalOpen }: Props): React.ReactElement<Props> {

  const { t } = useTranslation();

  const [password, setPassword] = useState<string>('');
  const [contributionAmountInHuman, setContributionAmountInHuman] = useState<string>('');
  const [passwordIsCorrect, setPasswordIsCorrect] = useState<number>(0);// 0: no password, -1: password incorrect, 1:password correct
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [allAddresesOnThisChain, setAllAddresesOnThisChain] = useState<string[]>([]);
  const [confirmingState, setConfirmingState] = useState<string>('');
  const { accounts } = useContext(AccountContext);
  const { hierarchy } = useContext(AccountContext);
  const [coin, setCoin] = useState<string>('');

  function showAlladdressesOnThisChain(prefix: number): void {
    const allAddresesOnSameChain = accounts.map((acc): string => {
      const publicKey = decodeAddress(acc.address);

      return encodeAddress(publicKey, prefix);
    });

    setAllAddresesOnThisChain(allAddresesOnSameChain);
  };

  useEffect(() => {
    const { coin, prefix } = getNetworkInfo(null, selectedBlockchain);

    setCoin(coin);

    if (prefix !== undefined) { showAlladdressesOnThisChain(prefix); }
  }, []);

  useEffect(() => {
    if (allAddresesOnThisChain.length) { setSelectedAddress(allAddresesOnThisChain[0]); }
  }, [allAddresesOnThisChain]);

  const handleConfirmModaClose = (): void => {
    setConfirmModalOpen(false);
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

      const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, decimals);

      const { block, failureText, fee, status, txHash } = await contribute(signer, crowdloan.fund.paraId, contributingAmountInMachine, selectedBlockchain)

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
      void saveHistory(null, hierarchy, selectedAddress, history, selectedBlockchain);
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
    <Popup handleClose={handleConfirmModaClose} showModal={confirmModalOpen}>
      <PlusHeader action={handleReject} chain={selectedBlockchain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small'/>} title={'Confirm'} />

      <Grid container sx={{ padding: '30px 40px 20px' }}>
        <FormControl fullWidth>
          <InputLabel id='selec-address'>{t('Account')}</InputLabel>
          <Select value={selectedAddress}
            label='Select address'
            onChange={handleAddressChange}
            sx={{ height: 50 }}

          >
            {allAddresesOnThisChain?.map((address) => (
              <MenuItem key={address} value={address}>
                <Grid container alignItems='center' justifyContent='space-between'>
                  <Grid item>
                    <Identicon
                      size={25}
                      theme={'polkadot'}
                      value={address}
                    />
                  </Grid>
                  <Grid item sx={{ fontSize: 13 }}>
                    {address}
                  </Grid>
                </Grid>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormHelperText>{t('Selected account to contribute')}</FormHelperText>

      </Grid>

      <Grid item sx={{ padding: '1px 40px 20px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          // error={reapeAlert || noFeeAlert || zeroBalanceAlert}
          fullWidth
          helperText={(t('Minimum contribution: ') + amountToHuman(auction.minContribution, decimals) + ' ' + coin)}
          label={t('Amount')}
          margin='dense'
          name='contributionAmount'
          // onBlur={(event) => handleTransferAmountOnBlur(event.target.value)}
          onChange={(event) => handleContributionAmountChange(event.target.value)}
          placeholder={amountToHuman(auction.minContribution, decimals)}
          size='medium'
          type='number'
          value={contributionAmountInHuman}
          variant='outlined'
        />
      </Grid>

      <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 16, padding: '1px 50px 5px' }} xs={12}>
        {t('Crowdloan to contribute')}
      </Grid>

      <Grid item sx={{ padding: '1px 30px' }} xs={12}>
        <Fund chainName={selectedBlockchain} crowdloan={crowdloan} endpoints={endpoints} />
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
