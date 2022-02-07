// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AllOut as AllOutIcon } from '@mui/icons-material';
import { Grid, InputAdornment, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup } from '../../components';
import broadcast from '../../util/api/broadcast';
import { PASS_MAP } from '../../util/constants';
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

export default function Contribute({auction, chainInfo, contributeModal, crowdloan, endpoints, setContributeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const chain = useMetadata(chainInfo.genesisHash, true);
  const auctionMinContributionInHuman = amountToHuman(auction.minContribution, chainInfo.decimals);

  const [password, setPassword] = useState<string>('');
  const [contributionAmountInHuman, setContributionAmountInHuman] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [confirmingState, setConfirmingState] = useState<string>('');
  const { hierarchy } = useContext(AccountContext);

  const handleConfirmModaClose = useCallback((): void => {
    setContributeModalOpen(false);
  }, [setContributeModalOpen]);

  function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail, _chainName?: string): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress, _chainName);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory, _chainName));
  }

  const handleConfirm = async (): Promise<void> => {
    try {
      setConfirmingState('confirming');
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, chainInfo.decimals);

      const api = chainInfo.api;
      const tx = api.tx.crowdloan.contribute;
      const params = [crowdloan.fund.paraId, contributingAmountInMachine, null];

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, signer);

      // const { block, failureText, fee, status, txHash } = await contribute(signer, crowdloan.fund.paraId, contributingAmountInMachine, chain);

      setConfirmingState(status);

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

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, selectedAddress, history);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setConfirmingState('');
    }
  };

  const handleReject = useCallback((): void => {
    setConfirmingState('');
    handleConfirmModaClose();
    onAction('/');
  }, [handleConfirmModaClose, onAction]);

  const handleBack = useCallback((): void => {
    handleConfirmModaClose();
  }, [handleConfirmModaClose]);

  const handleClearPassword = useCallback((): void => {
    setPasswordStatus(PASS_MAP.EMPTY);
    setPassword('');
  }, []);

  const handleSavePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);

    if (event.target.value === '') { handleClearPassword(); }
  }, [handleClearPassword]);

  function handleChange(value: string) {
    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    setContributionAmountInHuman(fixFloatingPoint(value));
  }

  return (
    <Popup handleClose={handleConfirmModaClose} showModal={contributeModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<AllOutIcon fontSize='small' />} title={'Contribute'} />

      {/* <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, padding: '10px 50px 5px', textAlign: 'center' }} xs={12}>
        {t('Crowdloan to contribute')}
      </Grid> */}

      <Grid item sx={{ padding: '10px 30px 40px' }} xs={12}>
        {chain && <Fund coin={chainInfo.coin} decimals={chainInfo.decimals} crowdloan={crowdloan} endpoints={endpoints} />}
      </Grid>

      <AllAddresses chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('Select account to contribute')} />

      <Grid item sx={{ p: '10px 50px 30px 80px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          // error={reapeAlert || noFeeAlert || zeroBalanceAlert}
          fullWidth
          helperText={(t('Minimum contribution: ') + auctionMinContributionInHuman + ' ' + chainInfo.coin)}
          label={t('Amount')}
          margin='dense'
          name='contributionAmount'
          // onBlur={(event) => handleTransferAmountOnBlur(event.target.value)}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={auctionMinContributionInHuman}
          size='medium'
          type='number'
          value={contributionAmountInHuman}
          variant='outlined'
        />
      </Grid>
      <Grid container item sx={{ p: '10px 20px' }} xs={12}>
        <Password
          handleClearPassword={handleClearPassword}
          handleIt={handleConfirm}
          handleSavePassword={handleSavePassword}
          password={password}
          passwordStatus={passwordStatus}
        />

        <ConfirmButton
          confirmingState={confirmingState}
          handleBack={handleBack}
          handleConfirm={handleConfirm}
          handleReject={handleBack}
          isDisabled={Number(contributionAmountInHuman) < Number(auctionMinContributionInHuman)}
        />
      </Grid>
    </Popup>
  );
}
