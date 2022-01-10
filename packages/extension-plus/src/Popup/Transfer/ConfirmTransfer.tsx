/* eslint-disable header/header */
// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';

import { ArrowForwardRounded, CheckRounded, Clear, InfoTwoTone as InfoTwoToneIcon, LaunchRounded, RefreshRounded } from '@mui/icons-material';
import { Alert, Avatar, Box, Button as MuiButton, CircularProgress, Container, Divider, Grid, IconButton, InputAdornment, Modal, TextField, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import Identicon from '@polkadot/react-identicon';
import keyring from '@polkadot/ui-keyring';

import { ActionText, BackButton, Button } from '../../../../extension-ui/src/components';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../../util/getLogo';
import getFee from '../../util/getFee';
import getNetworkInfo from '../../util/getNetwork';
import { AccountsBalanceType, TransactionDetail, TransactionStatus } from '../../util/pjpeTypes';
import { amountToHuman, fixFloatingPoint, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/pjpeUtils';
import signAndTransfer from '../../util/signAndTransfer';

interface Props {
  availableBalance: string;
  actions?: React.ReactNode;
  sender: AccountsBalanceType;
  recepient: AccountsBalanceType;
  chain?: Chain | null;
  children?: React.ReactNode;
  className?: string;
  confirmModalOpen: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  lastFee?: string;
  name?: string | null;
  parentName?: string | null;
  toggleActions?: number;
  type?: KeypairType;
  transferAmount: bigint;
  coin: string;
  handleTransferModalClose: any;
}

const PASS_MAP = {
  EMPTY: 0,
  INCORRECT: -1,
  CORRECT: 1
}

export default function ConfirmTx({
  availableBalance,
  chain,
  coin,
  confirmModalOpen,
  handleTransferModalClose,
  lastFee,
  recepient,
  sender,
  setConfirmModalOpen,
  transferAmount
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const network = chain ? chain.name.replace(' Relay Chain', '') : 'westend';

  const [fee, setFee] = useState<string>();
  const [total, setTotal] = useState<string | null>(null);
  const [confirmDisabled, setConfirmDisabled] = useState<boolean>(true);
  const [transactionHash, setTransactionHash] = useState<string>();
  const [failAlert, setFailAlert] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [transfering, setTransfering] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ blockNumber: null, success: null, text: null });
  const [transferAmountInHuman, setTransferAmountInHuman] = useState('');

  const { hierarchy } = useContext(AccountContext);
  // const settings = useContext(SettingsContext);

  useEffect(() => {
    const { decimals } = getNetworkInfo(chain);

    setTransferAmountInHuman(amountToHuman(String(transferAmount), decimals));
    console.log('chain:', chain);
  }, [chain, transferAmount]);

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    if (!transactionHash || !chain) {
      return;
    }

    // const { decimals } = getNetworkInfo(chain);

    // const currentTransactionDetail: TransactionDetail = {
    //   action: 'send',
    //   amount: amountToHuman(String(transferAmount), decimals),
    //   date: Date.now(),
    //   fee: String(fee),
    //   from: String(sender.address),
    //   hash: transactionHash,
    //   status: String(txStatus.text),
    //   to: String(recepient.address)
    // };

    // // eslint-disable-next-line @typescript-eslint/no-floating-promises
    // saveHistory(chain, hierarchy, sender.address, currentTransactionDetail);
  }, [transactionHash, txStatus, chain]);

  async function handleConfirmTransfer() {
    // console.log('handleConfirmTransfer is runing ...')
    setTransfering(true);

    try {
      const pair = keyring.getPair(String(sender.address));

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const { block, failureText, fee, status, txHash } = await signAndTransfer(pair, String(recepient.address), transferAmount, chain, setTxStatus)

      const { decimals } = getNetworkInfo(chain);

      const currentTransactionDetail: TransactionDetail = {
        action: 'send',
        amount: amountToHuman(String(transferAmount), decimals),
        block: block,
        date: Date.now(),
        fee: fee || '',
        from: String(sender.address),
        hash: txHash || '',
        status: failureText || status,
        to: String(recepient.address)
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (chain) { saveHistory(chain, hierarchy, sender.address, currentTransactionDetail); }

      setTransactionHash(txHash);
      setTransfering(false);

    } catch (e) {
      setPasswordStatus(PASS_MAP.INCORRECT);
      setTransfering(false);
    }
  }

  useEffect(() => {
    if (!confirmModalOpen) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getDefaultFeeAndSetTotal(lastFee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmModalOpen, lastFee]);

  useEffect(() => {
    setFailAlert(Number(total) > Number(availableBalance));
  }, [total, availableBalance]);

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

  function getDefaultFeeAndSetTotal(lastFee?: string): void {
    const { decimals, defaultFee } = getNetworkInfo(chain);

    lastFee = lastFee || defaultFee;

    setFee(amountToHuman(lastFee, decimals));

    const total = (Number(lastFee) + Number(transferAmount)) / (10 ** decimals);

    setTotal(fixFloatingPoint(total));

    // setConfirmDisabled(false);
  }

  function handleClearPassword() {
    setPasswordStatus(PASS_MAP.EMPTY);
    setPassword('');
    setConfirmDisabled(true);
  }

  function handleSavePassword(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setConfirmDisabled(false);

    if (event.target.value === '') { handleClearPassword(); }
  }

  function handleConfirmModaClose(): void {
    setConfirmModalOpen(false);
    setTransfering(false);
  }

  function handleReject(): void {
    setConfirmModalOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    handleTransferModalClose();
  }

  const openTxOnExplorer = useCallback(() => window.open('https://' + network + '.subscan.io/extrinsic/' + String(transactionHash), '_blank')
    , [network, transactionHash]);

  // function handleConfirmModaOpen(): void {
  //   setConfirmModalOpen(true);
  // }

  // function handleNext() {
  //   handleConfirmModaOpen();
  // }

  const refreshNetworkFee = (): void => {
    setFee('');
    const localConfirmDisabled = confirmDisabled;

    setConfirmDisabled(true);

    const pairKey = keyring.getPair(String(sender.address));

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getFee(pairKey, String(recepient.address), BigInt(transferAmount), chain)
      .then((f) => {
        if (!f) {
          console.log('fee is NULL');

          return;
        }

        const { decimals } = getNetworkInfo(chain);
        const t = transferAmount + BigInt(f);
        const fixedPointTotal = fixFloatingPoint(Number(t) / (10 ** decimals));

        setFee(amountToHuman(f, decimals));
        setTotal(fixedPointTotal);
        setConfirmDisabled(localConfirmDisabled);
      });
  };

  // function disable(flag: boolean) {
  //   return {
  //     opacity: flag ? '0.15' : '1',
  //     pointerEvents: flag ? 'none' : 'initial'
  //   };
  // }

  const addressWithIdenticon = (name: string | null, address: string): React.ReactElement => (
    <>
      <Grid item xs={4}>
        <Identicon
          prefix={42}
          size={40}
          theme={'polkadot'}
          value={address}
        />
      </Grid>
      <Grid item xs={6} sx={{ fontSize: 14, textAlign: 'left' }}>
        {name ? name : makeAddressShort(String(address))}
      </Grid>
    </>);

  return (
    <>
      <Modal
        hideBackdrop
        // eslint-disable-next-line react/jsx-no-bind
        onClose={handleConfirmModaClose}
        open={confirmModalOpen}
      >
        <div style={{
          backgroundColor: '#FFFFFF',
          display: 'flex',
          height: '100%',
          maxWidth: 700,
          position: 'relative',
          top: '5px',
          transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
          width: '560px'
        }}
        >
          <Container disableGutters maxWidth='md' sx={{ marginTop: 2 }}>
            <Grid container alignItems='center' >
              <Grid item xs={12} alignItems='center' container justifyContent='space-between' sx={{ padding: '0px 20px' }}>
                <Grid item sx={{ textAlign: 'right' }}>
                  <Avatar
                    alt={'logo'}
                    src={getLogo(chain)}
                  />
                </Grid>
                <Grid item justifyContent='center' sx={{ fontSize: 15 }}>
                  <div style={transfering ? { opacity: '0.4', pointerEvents: 'none' } : {}}>
                    <ActionText
                      // className={{'margin': 'auto'}}
                      onClick={handleReject}
                      text={t('Reject')}
                    />
                  </div>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Box fontSize={12} fontWeight='fontWeightBold'>
                  <Divider>
                    {/* <Chip
                      icon={<FontAwesomeIcon icon={faCoins} size='sm' />}
                      label={t('Select Validators')}
                      variant='outlined'
                    /> */}
                  </Divider>
                </Box>
              </Grid>
            </Grid>
            <Grid container alignItems='center' justifyContent='space-around' sx={{ paddingTop: '20px' }}>
              <Grid item container alignItems='center' justifyContent='flex-end' xs={5}>
                {addressWithIdenticon(sender.name, sender.address)}
              </Grid>
              <Grid item xs={2} >
                <Divider orientation='vertical' flexItem>
                  <Avatar sx={{ bgcolor: grey[300] }}>
                    <ArrowForwardRounded fontSize='small' />
                  </Avatar>
                </Divider>
              </Grid>
              <Grid item container alignItems='center' xs={5}>
                {addressWithIdenticon(recepient.name, recepient.address)}
              </Grid>
              <Grid item container xs={12} sx={{ backgroundColor: '#f7f7f7', padding: '25px 40px 25px' }}>
                <Grid item xs={3} sx={{ padding: '5px 10px 5px', borderRadius: '5px', border: '2px double grey', justifyContent: 'flex-start', fontSize: 15, textAlign: 'center', fontVariant: 'small-caps' }}>
                  {t('transfer of')}
                </Grid>
                <Grid item container justifyContent='center' spacing={1} xs={12} sx={{ fontSize: 18, fontFamily: 'fantasy', textAlign: 'center' }} >
                  <Grid item>
                    {transferAmountInHuman}
                  </Grid>
                  <Grid item>
                    {coin}
                  </Grid>
                </Grid>
              </Grid>
              <Grid item container alignItems='center' xs={12} sx={{ padding: '30px 40px 20px' }}>
                <Grid item container xs={6}>
                  <Grid item sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }}>
                    {t('Network Fee')}
                  </Grid>
                  <Grid item sx={{ fontSize: 13, marginLeft: '5px', textAlign: 'left' }}>
                    <Tooltip placement='right-end' title={t<string>('Network fees are paid to network validators who process transactions on the network. This wallet does not profit from fees. Fees are set by the network and fluctuate based on network traffic and transaction complexity.')} arrow>
                      <InfoTwoToneIcon color='action' fontSize='small' />
                    </Tooltip>
                  </Grid>
                  <Grid item sx={{ alignItems: 'center', fontSize: 13, textAlign: 'left' }}>
                    <IconButton onClick={refreshNetworkFee} sx={{ top: -7 }}>
                      <Tooltip placement='right-end' title={t<string>('get newtwork fee now')} arrow>
                        <RefreshRounded color='action' fontSize='small' />
                      </Tooltip>
                    </IconButton>
                  </Grid>
                </Grid>
                <Grid item xs={6} sx={{ fontSize: 13, textAlign: 'right' }}>
                  {fee || <CircularProgress color='inherit' thickness={1} size={20} />}
                  <Box fontSize={11} sx={{ color: 'gray' }}>
                    {fee ? 'estimated' : 'estimating'}
                  </Box>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item container alignItems='center' xs={12} sx={{ padding: '10px 40px 20px' }}>
                <Grid item xs={1} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }}>
                  {t('Total')}
                </Grid>
                <Grid item xs={8} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }}>
                  {failAlert
                    ? <Alert severity='warning' sx={{ fontSize: 11 }}>Transaction most likely fail, consider fee!</Alert>
                    : ''}
                </Grid>
                <Grid item xs={3} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'right' }}>
                  {total || ' ... '} {' '} {coin}
                </Grid>
              </Grid>
              <Grid item sx={{ margin: '20px 40px 1px' }} xs={12}>
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
                        {passwordStatus === PASS_MAP.CORRECT ? <CheckRounded color='success' /> : ''}
                      </InputAdornment>
                    ),
                    style: { fontSize: 16 }
                  }}
                  autoFocus
                  fullWidth
                  error={passwordStatus === PASS_MAP.INCORRECT}
                  helperText={passwordStatus === PASS_MAP.INCORRECT
                    ? t('Password is not correct')
                    : t('Please enter the password of the sender account')}
                  label={t('Password')}
                  onChange={handleSavePassword}
                  // eslint-disable-next-line react/jsx-no-bind
                  onKeyPress={(event) => {
                    if (event.key === 'Enter') { handleConfirmTransfer(); }
                  }}
                  size='medium'
                  color='warning'
                  type='password'
                  value={password}
                  variant='outlined'
                />
              </Grid>
            </Grid>
            <Grid container justifyContent='space-between' sx={{ padding: '40px 40px 10px' }}>
              {txStatus && (txStatus.success !== null)
                ? <Grid item xs={12}>
                  <MuiButton fullWidth onClick={handleReject} variant='contained' size='large' color={txStatus.success ? 'success' : 'error'}>
                    {txStatus.success ? t('Done') : t('Failed')}
                  </MuiButton>
                </Grid>
                : <>
                  <Grid item xs={1}>
                    <BackButton onClick={handleConfirmModaClose} />
                  </Grid>
                  <Grid item xs={11} sx={{ paddingLeft: '10px' }}>
                    <Button
                      data-button-action=''
                      isBusy={transfering}
                      isDisabled={confirmDisabled}
                      onClick={handleConfirmTransfer}
                    >
                      {t('Confirm')}
                    </Button>
                  </Grid>
                </>}
              {txStatus.blockNumber || transactionHash
                ?
                // <Grid alignItems='center' container item
                //   sx={{ border: '1px groove silver', borderRadius: '10px', fontSize: 12, fontWeight: 'bold', marginTop: '10px', p: 1 }}>
                //   <Grid item xs={10} sx={{ textAlign: 'center' }}>
                //     {txStatus.success || txStatus.success === null
                //       ? 'The transaction is ' + String(txStatus ? txStatus.text : '')
                //       : String(txStatus.text)
                //     }
                //     {', block number ' + String(txStatus.blockNumber)}
                //   </Grid>
                //   <Grid item xs={2} sx={{ textAlign: 'right' }}>
                //     <IconButton disabled={!transactionHash} size='small' onClick={openTxOnExplorer}>
                //       <LaunchRounded />
                //     </IconButton>
                //   </Grid>
                // </Grid>


                <Grid alignItems='center' container justifyContent='center' spacing={1} item sx={{ fontSize: 11 }}>
                  <Grid item  >
                    {txStatus.success || txStatus.success === null
                      ? 'The transaction is ' + String(txStatus ? txStatus.text : '')
                      : String(txStatus.text)
                    }
                    {', block number ' + String(txStatus.blockNumber)}
                  </Grid>
                  <Grid item  >
                    <IconButton disabled={!transactionHash} size='small' onClick={openTxOnExplorer}>
                      <LaunchRounded sx={{ fontSize: 10 }} />
                    </IconButton>
                  </Grid>
                </Grid>


                : ''
              }
            </Grid>

          </Container>
        </div>
      </Modal>
    </>
  );
}
