// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { AccountJson, AccountWithChildren } from '../../../../extension-base/src/background/types';

import { ArrowBackIosRounded, CheckRounded as CheckRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import LoadingButton from '@mui/lab/LoadingButton';
import { Alert, Avatar, Box, Button, Divider, Grid, IconButton, InputAdornment, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';

import Identicon from '@polkadot/react-identicon';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Chain } from '../../../../extension-chains/src/types';
import { NextStepButton } from '../../../../extension-ui/src/components';
import { AccountContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { DEFAULT_TYPE } from '../../../../extension-ui/src/util/defaultType';
import { PlusHeader, Popup } from '../../components';
import Hint from '../../components/Hint';
import getFee from '../../util/api/getFee';
import getLogo from '../../util/getLogo';
import getNetworkInfo from '../../util/getNetwork';
import { AccountsBalanceType, ChainInfo } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../util/plusUtils';
import isValidAddress from '../../util/validateAddress';
import ConfirmTx from './ConfirmTransfer';

interface Props {
  actions?: React.ReactNode;
  chainInfo: ChainInfo;
  sender: AccountsBalanceType;
  transferModalOpen: boolean;
  chain?: Chain | null;
  children?: React.ReactNode;
  className?: string;
  setTransferModalOpen: Dispatch<SetStateAction<boolean>>;
  givenType?: KeypairType;
}

interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  prefix?: number;
  type: KeypairType;
}

export default function TransferFunds({ chain, chainInfo, givenType, sender, setTransferModalOpen, transferModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const settings = useContext(SettingsContext);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(true);
  const [transferAmount, setTransferAmount] = useState<bigint>(0n);
  const [transferAmountInHuman, setTransferAmountInHuman] = useState('');
  const [reapeAlert, setReapAlert] = useState(false);
  const [noFeeAlert, setNoFeeAlert] = useState(false);
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [recepientAddressIsValid, setRecepientAddressIsValid] = useState(false);
  const [recepient, setRecepient] = useState<AccountsBalanceType | null>();
  const [allAddresesOnThisChain, setAllAddresesOnThisChain] = useState<AccountsBalanceType[] | null>();
  const [transferBetweenMyAccountsButtonText, setTransferBetweenMyAccountsButtonText] = useState<string>(t('Transfer between my accounts'));
  const [coin, setCoin] = useState('');
  const [decimals, setDecimals] = useState<number>(1);
  const [ED, setED] = useState(0);
  const [allAmountLoading, setAllAmountLoading] = useState(false);
  const [safeMaxAmountLoading, setsafeMaxAmountLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [senderAddressOpacity, setSenderAddressOpacity] = useState<number>(0.2);
  const [estimatedFee, setEstimatedFee] = useState<Balance>();

  const transfer = chainInfo?.api.tx.balances.transfer;

  useEffect(() => {
    if (!chainInfo || !transfer) return;

    // eslint-disable-next-line no-void
    void transfer(sender.address, 1 * 10 ** chainInfo.decimals).paymentInfo(sender.address)
      .then((i) => setEstimatedFee(i?.partialFee)).catch(console.error);
  }, [chainInfo, sender.address, transfer]);

  useEffect(() => {
    if (recepientAddressIsValid) { setSenderAddressOpacity(0.7); } else setSenderAddressOpacity(0.2);
  }, [recepientAddressIsValid]);

  useEffect((): void => {

    // TODO: get ED from chain, api.consts.balances.existentialDeposit
    const { ED } = getNetworkInfo(chain);

    setED(ED || 0);
  }, [chain]);

  useEffect((): void => {
    setAvailableBalance(balanceToHuman(sender, 'available'));
    setCoin(sender.balanceInfo?.coin);
    setDecimals(sender.balanceInfo?.decimals);
  }, [sender]);

  // find an account in our list
  function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
    return accounts.find(({ address }): boolean =>
      address === _address
    ) || null;
  }

  // find an account in our list
  function findSubstrateAccount(accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
    const pkStr = publicKey.toString();

    return accounts.find(({ address }): boolean =>
      decodeAddress(address).toString() === pkStr
    ) || null;
  }

  function recodeAddress(address: string, accounts: AccountWithChildren[], settings: SettingsStruct, chain?: Chain | null): Recoded {
    // decode and create a shortcut for the encoded address
    const publicKey = decodeAddress(address);

    // find our account using the actual publicKey, and then find the associated chain
    const account = findSubstrateAccount(accounts, publicKey);
    const prefix = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    // always allow the actual settings to override the display
    return {
      account,
      formatted: encodeAddress(publicKey, prefix),
      genesisHash: account?.genesisHash,
      prefix,
      type: account?.type || DEFAULT_TYPE
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleClearRecepientAddress() {
    setNextButtonDisabled(true);
    setAllAddresesOnThisChain(null);
    setRecepient(null);
    setRecepientAddressIsValid(false);
    setTransferBetweenMyAccountsButtonText(t('Transfer between my accounts'));
  }

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
    if (!Number(availableBalance)) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    if (Number(transferAmountInHuman) < Number(availableBalance) &&
      (Number(availableBalance) < Number(transferAmountInHuman) + (ED + Number(amountToHuman(estimatedFee?.toString(), decimals)))
      )) {
      setReapAlert(true);
    } else {
      setReapAlert(false);
    }

    if (Number(availableBalance) === Number(transferAmountInHuman) + Number(amountToHuman(estimatedFee?.toString(), decimals))) {
      setNoFeeAlert(true);
    } else {
      setNoFeeAlert(false);
    }

    if (Number(availableBalance) <= Number(transferAmountInHuman) || Number(transferAmountInHuman) === 0) {
      setNextButtonDisabled(true);

      if (Number(availableBalance) <= Number(transferAmountInHuman) && Number(transferAmountInHuman) !== 0) {
        setNextButtonCaption(t('Insufficient Balance'));
      }
    } else {
      setNextButtonDisabled(false);
      setNextButtonCaption(t('Next'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferAmountInHuman, availableBalance, ED, t]);

  function handleTransferAmountOnChange(value: string) {
    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    setTransferAmountInHuman(fixFloatingPoint(value));
  }

  function handleTransferAmountOnBlur(value: string) {
    let floatingPointDigit = 0;
    const v = value.split('.');

    if (v.length === 2) {
      floatingPointDigit = v[1].length;
      value = v[0] + v[1];
    }

    setTransferAmount(BigInt(Number(value)) * BigInt(10 ** (decimals - floatingPointDigit)));
  }

  function handleAccountListClick(event: React.MouseEvent<HTMLElement>) {
    const selectedAddressTextTarget = event.target as HTMLInputElement;
    const selectedAddressText = selectedAddressTextTarget.innerText;
    const selectedAddres = selectedAddressText.split(' ').slice(-1);
    const lastIndex = selectedAddressText.lastIndexOf(' ');
    const selectedName = selectedAddressText.substring(0, lastIndex);

    handleAddressIsValid(true, String(selectedAddres), String(selectedName));
  }

  const HandleSetMax = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
    if (!sender || !sender.balanceInfo || String(sender.balanceInfo.available) === '0' || !recepient) return;
    const available = sender.balanceInfo.available;

    const pairKey = keyring.getPair(String(sender.address));

    const { name } = event.target as HTMLButtonElement;

    if (name === 'All') {
      setAllAmountLoading(true);
    } else {
      setsafeMaxAmountLoading(true);
    }

    const fee = estimatedFee || await getFee(pairKey, String(recepient.address), BigInt(sender.balanceInfo.available), chain);

    if (!fee) {
      console.log('fee is NULL');

      return;
    }

    const { ED } = getNetworkInfo(chain);

    setEstimatedFee(fee);
    let subtrahend = BigInt(fee.toString());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (name === 'safeMax') {
      subtrahend += amountToMachine(String(ED), decimals);
    }

    let max = BigInt(available) - subtrahend;

    if (max <= 0) {
      max = 0n;
    }

    setTransferAmount(max);

    const fixedPointMax = fixFloatingPoint(Number(max) / (10 ** decimals));

    setTransferAmountInHuman(String(fixedPointMax));
    setAllAmountLoading(false);
    setsafeMaxAmountLoading(false);
    // });
  };

  const acountList = (
    transferBetweenMyAccountsButtonText === t('Back to all')
      ? <Box sx={{ bgcolor: 'background.paper', height: '300px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%' }}>
        <nav aria-label='acount list'>
          <List
            subheader={
              <ListSubheader
                component='div'
                sx={{ textAlign: 'left' }}
              >
                {t('My Accounts')}
              </ListSubheader>
            }
          >
            {!allAddresesOnThisChain
              ? ''
              : allAddresesOnThisChain.map((addr) => (
                // eslint-disable-next-line react/jsx-key
                <ListItem disablePadding>
                  <ListItemButton onClick={handleAccountListClick}>
                    <ListItemIcon>
                      <Avatar
                        alt={`${coin} logo`}
                        // src={getLogoSource(coin)}
                        src={getLogo(chain)}
                      // sx={{ height: 45, width: 45 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${String(addr.name)}  ${String(addr.address)}`}
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

  function showAlladdressesOnThisChain(): void {
    // toggle button text
    const condition = transferBetweenMyAccountsButtonText === t('Transfer between my accounts');

    setTransferBetweenMyAccountsButtonText(condition ? t('Back to all') : t('Transfer between my accounts'));

    if (condition) {
      let allAddresesOnSameChain = accounts.map((acc): AccountsBalanceType => {
        const accountByAddress = findAccountByAddress(accounts, acc.address);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const recoded = (chain?.definition.chainType === 'ethereum' ||
          accountByAddress?.type === 'ethereum' ||
          (!accountByAddress && givenType === 'ethereum'))
          ? { account: accountByAddress, formatted: acc.addres, type: 'ethereum' } as Recoded
          : recodeAddress(acc.address, accounts, settings, chain);

        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          address: String(recoded.formatted),
          // balanceInfo: null,
          chain: null,
          name: String(acc.name)
        };
      });

      allAddresesOnSameChain = allAddresesOnSameChain.filter((acc) => acc.address !== (sender.address));
      setAllAddresesOnThisChain(allAddresesOnSameChain);
    }
  }

  const handleNext = useCallback((): void => {
    handleConfirmModaOpen();
  }, []);

  function handleConfirmModaOpen(): void {
    setConfirmModalOpen(true);
  }

  function makeAddressShort(_address: string): React.ReactElement {
    return (
      <Box
        component='span'
        fontFamily='Monospace'
      // fontStyle='oblique'
      // fontWeight='fontWeightBold'
      >
        {_address.slice(0, 4) +
          '...' +
          _address.slice(-4)}
      </Box>
    );
  }

  return (
    <Popup handleClose={handleTransferModalClose} showModal={transferModalOpen}>
      <PlusHeader action={handleTransferModalClose} chain={chain} closeText={'Close'} icon={<SendOutlinedIcon fontSize='small' sx={{ transform: 'rotate(-45deg)' }} />} title={'Transfer Funds'} />

      <Grid alignItems='center' container justifyContent='center' sx={{ padding: '5px 20px' }}>

        <Grid alignItems='center' container id='senderAddress' item justifyContent='flex-start' spacing={1} sx={{ opacity: senderAddressOpacity, padding: '20px 10px 50px' }} xs={12}>
          <Grid item sx={{ color: grey[800], fontSize: 13, textAlign: 'left' }}>
            {t('Sender')}:
          </Grid>
          <Grid item>
            <Identicon
              prefix={chain?.ss58Format ?? 42}
              size={18}
              theme={chain?.icon || 'polkadot'}
              value={sender.address}
            />
          </Grid>
          <Grid item sx={{ fontSize: 12, textAlign: 'left' }}>
            {sender.name ? `${sender.name} (${sender.address})` : makeAddressShort(String(sender.address))}
          </Grid>
        </Grid>

        <Grid
          item
          sx={{ paddingBottom: '20px' }}
          xs={12}
        >
          <TextField
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    // eslint-disable-next-line react/jsx-no-bind
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
            // eslint-disable-next-line react/jsx-no-bind
            onChange={handleRecepientAddressChange}
            placeholder={t('Search, Public address')}
            size='medium'
            type='string'
            value={recepient ? recepient.address : ''}
            variant='outlined'
          />
          {!recepientAddressIsValid && recepient
            ? <Alert severity='error'>
              {t('Recipient address is invalid')}
            </Alert>
            : ''
          }

        </Grid>

      </Grid>

      {!recepientAddressIsValid &&
        <Grid
          item
          sx={{ paddingLeft: '20px' }}
          xs={12}
        >
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
        <div id='transferBody' >
          <Grid container item justifyContent='space-between' sx={{ padding: '30px 30px 20px' }} xs={12}          >
            <Grid
              item
              sx={{ color: grey[800], fontSize: '15px', fontWeight: '600', marginTop: 5, textAlign: 'left' }}
              xs={3}
            >
              {t('Asset:')}
            </Grid>
            <Grid
              item
              xs={9}
            >
              <Box
                mt={2}
                sx={{ border: '1px groove silver', borderRadius: '10px', p: 1 }}
              >
                <Grid
                  container
                  justifyContent='flex-start'
                  spacing={1}
                >
                  <Grid
                    item
                    xs={2}
                  >
                    <Avatar
                      alt={`${coin} logo`} // src={getLogoSource(coin)}
                      src={getLogo(chain)}
                      sx={{ height: 45, width: 45 }}
                    />
                  </Grid>
                  <Grid
                    container
                    direction='column'
                    item
                    justifyContent='flex-start'
                    xs={10}
                  >
                    <Grid sx={{ fontSize: '14px', textAlign: 'left' }}>{coin}</Grid>
                    <Grid id='availableBalance' sx={{ fontSize: '12px', textAlign: 'left' }}>{t('Available Balance')}: {availableBalance}</Grid>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item sx={{ fontSize: '15px', fontWeight: '600', color: grey[800], marginTop: '30px', textAlign: 'left' }} xs={3}>
              {t('Amount:')}
              <Grid data-testid='allButton' item>
                <Hint id='transferAll' tip={t<string>('Transfer all amount and deactivate the account.')}>
                  <LoadingButton
                    color='primary'
                    disabled={safeMaxAmountLoading}
                    loading={allAmountLoading}
                    name='All'
                    onClick={HandleSetMax}
                    size='small'
                    sx={{ display: 'inline-block', fontSize: '11px', padding: 0 }}
                    variant='outlined'
                  >
                    {t('All')}
                  </LoadingButton>
                </Hint>
              </Grid>

              <Grid data-testid='safeMaxButton' item>
                <Hint id='safeMax' tip={t<string>('Transfer max amount where the account remains active.')}>
                  <LoadingButton
                    color='primary'
                    disabled={allAmountLoading}
                    loading={safeMaxAmountLoading}
                    name='safeMax'
                    onClick={HandleSetMax}
                    size='small'
                    sx={{ display: 'inline-block', fontSize: '11px', padding: 0 }}
                    variant='outlined'
                  >
                    {t('Safe max')}
                  </LoadingButton>
                </Hint>
              </Grid>

            </Grid>
            <Grid
              container
              item
              justifyContent='flex-start'
              sx={{ marginTop: '20px' }}
              xs={9}
            >
              <Grid
                item
                xs={12}
              >
                <TextField
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
                  autoFocus
                  color='warning'
                  error={reapeAlert || noFeeAlert || zeroBalanceAlert}
                  fullWidth
                  helperText={reapeAlert
                    ? (t('Account will be reaped, existential deposit:') + String(ED) + ' ' + coin)
                    : (noFeeAlert ? t('Fee must be considered, use MAX button instead.') : (zeroBalanceAlert ? t('No available fund to transfer') : ''))}
                  label={t('Transfer Amount')}
                  margin='dense'
                  name='transfeAmount'
                  onBlur={(event) => handleTransferAmountOnBlur(event.target.value)}
                  onChange={(event) => handleTransferAmountOnChange(event.target.value)}
                  //  placeholder='0.00'
                  size='medium'
                  type='number'
                  value={transferAmountInHuman}
                  variant='outlined'
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid data-testid='nextButton' sx={{ padding: '40px 40px 10px' }}>
            <NextStepButton
              data-button-action=''
              // isBusy={}
              isDisabled={nextButtonDisabled}
              onClick={handleNext}
            >
              {nextButtonCaption}
            </NextStepButton>
          </Grid>
          {recepient
            ? <ConfirmTx
              chainInfo={chainInfo}
              availableBalance={availableBalance}
              chain={chain}
              confirmModalOpen={confirmModalOpen}
              handleTransferModalClose={handleTransferModalClose}
              lastFee={estimatedFee}
              recepient={recepient}
              sender={sender}
              setConfirmModalOpen={setConfirmModalOpen}
              transferAmount={transferAmount}
            />
            : ''}
        </div>
      }
    </Popup>
  );
}
