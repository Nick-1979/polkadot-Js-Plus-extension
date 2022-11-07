// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  this component provides a place to select a recipient and some amount to transfer to, moreover provides some
 * facilities like transfering ALL/Max amount considering existential deposit/fee
 * */

import type { Balance } from '@polkadot/types/interfaces';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { AccountJson, AccountWithChildren } from '../../../../extension-base/src/background/types';

import { ArrowBackIosRounded, CheckRounded as CheckRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import LoadingButton from '@mui/lab/LoadingButton';
import { Alert, Avatar, Box, Button, Divider, Grid, IconButton, InputAdornment, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Skeleton, TextField, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import Identicon from '@polkadot/react-identicon';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Chain } from '../../../../extension-chains/src/types';
import { NextStepButton } from '../../../../extension-ui/src/components';
import { AccountContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { DEFAULT_TYPE } from '../../../../extension-ui/src/util/defaultType';
import { PlusHeader, Popup } from '../../components';
import SelectProxy from '../../partials/SelectProxy';
import getLogo from '../../util/getLogo';
import { AccountsBalanceType, Recoded } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../util/plusUtils';
import isValidAddress from '../../util/validateAddress';
import ConfirmTransfer from './ConfirmTransfer';

interface Props {
  api: ApiPromise | undefined;
  sender: AccountsBalanceType;
  transferModalOpen: boolean;
  chain: Chain;
  children?: React.ReactNode;
  className?: string;
  setTransferModalOpen: Dispatch<SetStateAction<boolean>>;
  givenType?: KeypairType;
}


export default function TransferFunds({ api, chain, givenType, sender, setTransferModalOpen, transferModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);

  const [availableBalance, setAvailableBalance] = useState<string>('');
  const [nextButtonDisabled, setNextButtonDisabled] = useState(true);
  const [transferAmount, setTransferAmount] = useState<bigint>(0n);
  const [transferAmountInHuman, setTransferAmountInHuman] = useState('');
  const [reapeAlert, setReapAlert] = useState(false);
  const [feeAlert, setFeeAlert] = useState(false);
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [recepientAddressIsValid, setRecepientAddressIsValid] = useState(false);
  const [recepient, setRecepient] = useState<AccountsBalanceType | null>();
  const [transferBetweenMyAccountsButtonText, setTransferBetweenMyAccountsButtonText] = useState<string>(t('Transfer between my accounts'));
  const [ED, setED] = useState<bigint>(0n);
  const [allAmountLoading, setAllAmountLoading] = useState(false);
  const [safeMaxAmountLoading, setMaxAmountLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [senderAddressOpacity, setSenderAddressOpacity] = useState<number>(0.2);
  const [estimatedFee, setEstimatedFee] = useState<Balance>();
  const [transferAllType, setTransferAllType] = useState<string | undefined>(undefined);

  const decimals = api && api.registry.chainDecimals[0];
  const token = api && api.registry.chainTokens[0];
  const transfer = api && api.tx?.balances && api.tx.balances.transfer;

  useEffect(() => {
    if (!api || !transfer) { return; }

    // eslint-disable-next-line no-void
    void transfer(sender.address, transferAmount).paymentInfo(sender.address)
      .then((i) => setEstimatedFee(i?.partialFee)).catch(console.error);
  }, [api, sender.address, transfer, transferAmount]);

  useEffect(() => {
    if (recepientAddressIsValid) { setSenderAddressOpacity(0.7); } else setSenderAddressOpacity(0.2);
  }, [recepientAddressIsValid]);

  useEffect((): void => {
    if (!api) { return; }

    api.consts?.balances && setED(BigInt(api.consts.balances.existentialDeposit.toString()));
  }, [api]);

  useEffect((): void => {
    setAvailableBalance(balanceToHuman(sender, 'available'));
  }, [sender]);

  useEffect((): void => {
    decimals && setTransferAmount(amountToMachine(transferAmountInHuman, decimals));
  }, [decimals, transferAmountInHuman]);

  /** find an account in our list */
  function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
    return accounts.find(({ address }): boolean =>
      address === _address
    ) || null;
  }

  function findSubstrateAccount(accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
    const pkStr = publicKey.toString();

    return accounts.find(({ address }): boolean =>
      decodeAddress(address).toString() === pkStr
    ) || null;
  }

  const recodeAddress = useCallback((address: string, accounts: AccountWithChildren[], settings: SettingsStruct, chain?: Chain | null): Recoded => {
    /** decode and create a shortcut for the encoded address */
    const publicKey = decodeAddress(address);

    /** find our account using the actual publicKey, and then find the associated chain */
    const account = findSubstrateAccount(accounts, publicKey);
    const prefix = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    /** always allow the actual settings to override the display */
    return {
      account,
      formatted: encodeAddress(publicKey, prefix),
      genesisHash: account?.genesisHash,
      prefix,
      type: account?.type || DEFAULT_TYPE
    };
  }, []);

  const handleClearRecepientAddress = useCallback(() => {
    setNextButtonDisabled(true);
    // setAllAddresesOnThisChain(null);
    setRecepient(null);
    setRecepientAddressIsValid(false);
    setTransferBetweenMyAccountsButtonText(t('Transfer between my accounts'));
  }, [t]);

  const handleTransferModalClose = useCallback((): void => {
    setTransferModalOpen(false);
    handleClearRecepientAddress();
  }, [handleClearRecepientAddress, setTransferModalOpen]);

  function handleAddressIsValid(_isValid: boolean, _address: string, _name?: string) {
    setRecepient({ address: _address, chain: null, name: _name });
    setRecepientAddressIsValid(_isValid);
  }

  function handleRecepientAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isValid = isValidAddress(e.target.value);

    // TODO: double chekc the name should not be null!
    handleAddressIsValid(isValid, e.target.value);
  }

  useEffect(() => {
    if (!transferAmount) { return; }

    const available = sender?.balanceInfo?.available;

    if (!available) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    if (available <= transferAmount || Number(transferAmountInHuman) === 0) {
      setNextButtonDisabled(true);

      if (available <= transferAmount && Number(transferAmountInHuman) !== 0) {
        setNextButtonCaption(t('Insufficient Balance'));
      }
    } else {
      setNextButtonDisabled(false);
      setNextButtonCaption(t('Next'));
    }

    if (!estimatedFee) return;

    if (Number(transferAmountInHuman) < Number(availableBalance) && (Number(availableBalance) < Number(amountToHuman((estimatedFee.toBigInt() + ED + transferAmount).toString(), decimals)))) {
      return setReapAlert(true);
    } else {
      setReapAlert(false);
    }

    if (!(transferAllType === 'All') && sender.balanceInfo?.available === transferAmount + BigInt(String(estimatedFee))) {
      setFeeAlert(true);
    } else {
      setFeeAlert(false);
    }
  }, [transferAmountInHuman, availableBalance, ED, t, estimatedFee, transferAmount, decimals, sender?.balanceInfo?.available, transferAllType]);

  const handleTransferAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;

    /** must be set to prevent call TransferAll!!! */
    setTransferAllType(undefined);

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    const cutDecimals = fixFloatingPoint(value);

    setTransferAmountInHuman(cutDecimals);
  }, []);

  function handleAccountListClick(event: React.MouseEvent<HTMLElement>) {
    const selectedAddressTextTarget = event.target as HTMLInputElement;
    const selectedAddressText = selectedAddressTextTarget.innerText;
    const selectedAddres = selectedAddressText.split(' ').slice(-1);
    const lastIndex = selectedAddressText.lastIndexOf(' ');
    const selectedName = selectedAddressText.substring(0, lastIndex);

    handleAddressIsValid(true, String(selectedAddres), String(selectedName));
  }

  const HandleSetMax = useCallback(async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
    if (!sender || !sender.balanceInfo || String(sender?.balanceInfo?.available) === '0' || !recepient) return;
    const available = sender.balanceInfo.available;
    const { name } = event.target as HTMLButtonElement;

    setTransferAllType(name);

    if (name === 'All') {
      setAllAmountLoading(true);
    } else {
      setMaxAmountLoading(true);
    }

    let fee = estimatedFee;

    if (!fee && transfer) {
      const { partialFee } = await transfer(sender.address, sender.balanceInfo.available).paymentInfo(sender.address);

      fee = partialFee;
    }

    if (!fee) {
      console.log('fee is NULL');

      return;
    }

    setEstimatedFee(fee);
    let subtrahend = BigInt(fee.toString());

    if (name === 'Max') { subtrahend += ED; }

    const amount = BigInt(available) - subtrahend < 0 ? 0n : BigInt(available) - subtrahend;

    decimals && setTransferAmountInHuman(amountToHuman(String(amount), decimals));
    setTransferAmount(amount);
    setAllAmountLoading(false);
    setMaxAmountLoading(false);
  }, [ED, decimals, estimatedFee, recepient, sender, transfer]);

  const allAddresesOnSameChain = useMemo(() => {
    const all = accounts.map((acc): { account: AccountJson, formattedAddress: string } => {
      const accountByAddress = findAccountByAddress(accounts, acc.address);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const recoded = (chain?.definition.chainType === 'ethereum' ||
        accountByAddress?.type === 'ethereum' ||
        (!accountByAddress && givenType === 'ethereum'))
        ? { account: accountByAddress, formatted: acc.addres, type: 'ethereum' } as Recoded
        : recodeAddress(acc.address, accounts, settings, chain);

      return {
        account: acc,
        formattedAddress: String(recoded.formatted)
      };
    });

    return all.filter((a) => a.formattedAddress !== (sender.address));
  }, [accounts, chain, givenType, recodeAddress, sender.address, settings]);

  const acountList = (
    transferBetweenMyAccountsButtonText === t('Back to all')
      ? <Box sx={{ bgcolor: 'background.paper', height: '270px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%' }}>
        <nav aria-label='acount list'>
          <List subheader={<ListSubheader component='div' sx={{ textAlign: 'left' }}> {t('My Accounts')} </ListSubheader>}>
            {!allAddresesOnSameChain
              ? ''
              : allAddresesOnSameChain.map((a) => (
                // eslint-disable-next-line react/jsx-key
                <ListItem disablePadding>
                  <ListItemButton onClick={handleAccountListClick}>
                    <ListItemIcon>
                      <Avatar
                        alt={`${token ?? ''} logo`}
                        src={getLogo(chain)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${String(a.account.name)}  ${a.formattedAddress}`}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: 'medium',
                        letterSpacing: 0
                      }}
                    />
                  </ListItemButton>
                  <Divider light />
                </ListItem>
              ))}
          </List></nav>
      </Box>
      : ''
  );

  const showAlladdressesOnThisChain = useCallback((): void => {
    setTransferBetweenMyAccountsButtonText(
      transferBetweenMyAccountsButtonText !== t('Back to all')
        ? t('Back to all')
        : t('Transfer between my accounts'));
  }, [t, transferBetweenMyAccountsButtonText]);

  const handleNext = useCallback((): void => {
    handleConfirmModaOpen();
  }, []);

  function handleConfirmModaOpen(): void {
    setConfirmModalOpen(true);
  }
  
  const SendHeaderIcon = <SendOutlinedIcon fontSize='small' sx={{ transform: 'rotate(-45deg)' }} />;

  return (
    <Popup handleClose={handleTransferModalClose} showModal={transferModalOpen}>
      <PlusHeader action={handleTransferModalClose} chain={chain} closeText={'Close'} icon={SendHeaderIcon} title={'Transfer Funds'} />
      <Grid alignItems='center' container justifyContent='center' sx={{ padding: '5px 20px' }}>
        <Grid alignItems='center' container id='senderAddress' item justifyContent='flex-start' spacing={1} sx={{ opacity: senderAddressOpacity, padding: '20px 10px 50px' }} xs={12}>
          <Grid item sx={{ color: grey[800], fontSize: 13, textAlign: 'left' }} xs={1}>
            {t('Sender')}:
          </Grid>
          <Grid item sx={{ textAlign: 'center' }} xs={1}>
            <Identicon
              prefix={chain?.ss58Format ?? 42}
              size={20}
              theme={chain?.icon || 'polkadot'}
              value={sender.address}
            />
          </Grid>
          <Grid container item sx={{ fontSize: 14, textAlign: 'left' }} xs={10}>
            <Grid item sx={{ fontSize: 14, overflow: 'hidden', textAlign: 'left', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={12}>
              {sender.name}
            </Grid>
            <Grid item sx={{ fontSize: 14, textAlign: 'left' }}>
              {sender.address}
            </Grid>
          </Grid>
        </Grid>
        <Grid item sx={{ paddingBottom: '20px' }} xs={12}>
          <TextField
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    onClick={handleClearRecepientAddress}
                  >
                    {recepient !== null ? <ClearIcon /> : ''}
                  </IconButton>
                </InputAdornment>
              ),
              startAdornment: (
                <InputAdornment position='start'>
                  {recepientAddressIsValid ? <CheckRoundedIcon color='success' /> : ''}
                </InputAdornment>
              ),
              style: { fontSize: 14 }
            }}
            fullWidth
            helperText={t('Reciever and sender must be on the same network')}
            label={t('Recipient')}
            onChange={handleRecepientAddressChange}
            placeholder={t('Search, Public address')}
            size='medium'
            type='string'
            value={recepient ? recepient.address : ''}
            variant='outlined'
          />
          {!recepientAddressIsValid && recepient &&
            <Alert severity='error'>
              {t('Recipient address is invalid')}
            </Alert>
          }
        </Grid>
      </Grid>
      {!recepientAddressIsValid &&
        <Grid item sx={{ paddingLeft: '20px' }} xs={12}>
          <Button
            fullWidth
            onClick={showAlladdressesOnThisChain}
            startIcon={transferBetweenMyAccountsButtonText === t('Back to all') ? <ArrowBackIosRounded /> : null}
            sx={{ justifyContent: 'flex-start', marginTop: 2, textAlign: 'left' }}
            variant='text'
          >
            {transferBetweenMyAccountsButtonText}
          </Button>
          {acountList}
        </Grid>
      }
      {recepientAddressIsValid &&
        <div id='transferBody'>
          <Grid container item justifyContent='space-between' sx={{ padding: '30px 30px 20px' }} xs={12}>
            <Grid item sx={{ color: grey[800], fontSize: '15px', fontWeight: '600', marginTop: 5, textAlign: 'left' }} xs={3}>
              {t('Asset:')}
            </Grid>
            <Grid item xs={9}>
              <Box mt={2} sx={{ border: '1px groove silver', borderRadius: '10px', p: 1 }}>
                <Grid container justifyContent='flex-start' spacing={1}>
                  <Grid item xs={2}>
                    <Avatar
                      alt={`${token ?? ''} logo`}
                      src={getLogo(chain)}
                      sx={{ height: 45, width: 45 }}
                    />
                  </Grid>
                  <Grid container item justifyContent='flex-start' xs={10}>
                    <Grid sx={{ fontSize: '14px', textAlign: 'left' }} xs={12}>
                      {token || <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                      }
                    </Grid>
                    <Grid container item justifyContent='space-between' xs={12}>
                      <Grid id='availableBalance' sx={{ fontSize: '12px', textAlign: 'left' }}>
                        {t('Available Balance')}: {availableBalance}
                      </Grid>
                      <Grid item sx={{ fontSize: '11px', textAlign: 'left', color: grey[600] }} >
                        {t('Fee')} {': '}
                        {estimatedFee
                          ? estimatedFee.toHuman()
                          : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                        }
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item sx={{ color: grey[800], fontSize: '15px', fontWeight: '600', marginTop: '30px', textAlign: 'left' }} xs={3}>
              {t('Amount:')}
              <Grid data-testid='allButton' item>
                <Tooltip placement='right' title={t<string>('Transfer all amount and deactivate the account.')}>
                  <LoadingButton
                    color='primary'
                    disabled={safeMaxAmountLoading || !transfer}
                    loading={allAmountLoading}
                    name='All'
                    onClick={HandleSetMax}
                    size='small'
                    sx={{ display: 'inline-block', fontSize: '11px', padding: 0 }}
                    variant='outlined'
                  >
                    {t('All')}
                  </LoadingButton>
                </Tooltip>
              </Grid>
              <Grid data-testid='safeMaxButton' item>
                <Tooltip placement='right' title={t<string>('Transfer max amount where the account remains active.')}>
                  <LoadingButton
                    color='primary'
                    disabled={allAmountLoading || !transfer}
                    loading={safeMaxAmountLoading}
                    name='Max'
                    onClick={HandleSetMax}
                    size='small'
                    sx={{ display: 'inline-block', fontSize: '11px', padding: 0 }}
                    variant='outlined'
                  >
                    {t('Max')}
                  </LoadingButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Grid container item justifyContent='flex-start' sx={{ marginTop: '20px' }} xs={9}>
              <Grid item sx={{ height: '20px' }} xs={12}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
                  autoFocus
                  color='warning'
                  error={reapeAlert || feeAlert || zeroBalanceAlert}
                  fullWidth
                  helperText={reapeAlert
                    ? (t('Account will be reaped, existential deposit:') + amountToHuman(String(ED), decimals) + ' ' + token)
                    : (feeAlert ? t('Fee must be considered, use MAX button instead.') : (zeroBalanceAlert ? t('No available fund to transfer') : ''))}
                  label={t('Transfer Amount')}
                  margin='dense'
                  name='transferAmount'
                  onChange={handleTransferAmountChange}
                  size='medium'
                  type='number'
                  value={transferAmountInHuman}
                  variant='outlined'
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid data-testid='nextButton' sx={{ padding: '35px 30px 10px' }}>
            <NextStepButton
              data-button-action=''
              // isBusy={}
              isDisabled={nextButtonDisabled}
              onClick={handleNext}
            >
              {nextButtonCaption}
            </NextStepButton>
          </Grid>
          {recepient && api && api?.tx?.balances &&
            <ConfirmTransfer
              api={api}
              chain={chain}
              confirmModalOpen={confirmModalOpen}
              handleTransferModalClose={handleTransferModalClose}
              lastFee={estimatedFee}
              recepient={recepient}
              sender={sender}
              setConfirmModalOpen={setConfirmModalOpen}
              transferAllType={transferAllType}
              transferAmount={transferAmount}
            />
          }
        </div>
      }
    </Popup>
  );
}
