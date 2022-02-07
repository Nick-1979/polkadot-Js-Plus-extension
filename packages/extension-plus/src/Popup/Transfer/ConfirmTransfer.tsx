// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { KeypairType } from '@polkadot/util-crypto/types';

import { ArrowForwardRounded, RefreshRounded, InfoTwoTone as InfoTwoToneIcon } from '@mui/icons-material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { Avatar, Box, CircularProgress, Divider, Grid, IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import Identicon from '@polkadot/react-identicon';
import keyring from '@polkadot/ui-keyring';

import { AccountWithChildren } from '../../../../extension-base/src/background/types';
import { Chain } from '../../../../extension-chains/src/types';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../extension-ui/src/messaging';
import { ConfirmButton, Password, PlusHeader, Popup } from '../../components';
import getFee from '../../util/api/getFee';
import { PASS_MAP } from '../../util/constants';
import getNetworkInfo from '../../util/getNetwork';
import { AccountsBalanceType, TransactionDetail, TransactionStatus } from '../../util/plusTypes';
import { amountToHuman, fixFloatingPoint, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';
import signAndTransfer from '../../util/signAndTransfer';
import Hint from '../../components/Hint';

interface Props {
  availableBalance: string;
  actions?: React.ReactNode;
  sender: AccountsBalanceType;
  recepient: AccountsBalanceType;
  chain?: Chain | null;
  children?: React.ReactNode;
  className?: string;
  confirmModalOpen: boolean;
  decimals: number;
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

export default function ConfirmTx({
  availableBalance,
  chain,
  coin,
  confirmModalOpen,
  decimals,
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
  // const [transfering, setTransfering] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ blockNumber: null, success: null, text: null });
  const [transferAmountInHuman, setTransferAmountInHuman] = useState('');
  const { hierarchy } = useContext(AccountContext);
  const [state, setState] = useState<string>('');

  useEffect(() => {
    setTransferAmountInHuman(amountToHuman(String(transferAmount), decimals));
  }, [chain, decimals, transferAmount]);

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  async function handleConfirm() {
    setState('confirming');

    try {
      const pair = keyring.getPair(String(sender.address));

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const { block, failureText, fee, status, txHash } = await signAndTransfer(pair, String(recepient.address), transferAmount, chain, setTxStatus);

      setState(status);

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
    } catch (e) {
      console.log('password issue:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }

  useEffect(() => {
    if (!confirmModalOpen || !transferAmount) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises

    getDefaultFeeAndSetTotal(lastFee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmModalOpen, lastFee, transferAmount]);

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
    const { defaultFee } = getNetworkInfo(chain);

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
    // setTransfering(false);
    setState('');

  }

  function handleReject(): void {
    setConfirmModalOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    handleTransferModalClose();
  }

  const openTxOnExplorer = useCallback(() => window.open('https://' + network + '.subscan.io/extrinsic/' + String(transactionHash), '_blank')
    , [network, transactionHash]);

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
          prefix={chain?.ss58Format ?? 42}
          size={40}
          theme={chain?.icon || 'polkadot'}
          value={address}
        />
      </Grid>
      <Grid item xs={6} sx={{ fontSize: 14, textAlign: 'left' }}>
        {name || makeAddressShort(String(address))}
      </Grid>
    </>);

  return (
    <Popup handleClose={handleConfirmModaClose} showModal={confirmModalOpen}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm Transfer'} />

      <Grid container alignItems='center' justifyContent='space-around' sx={{ paddingTop: '10px' }}>
        <Grid item container alignItems='center' justifyContent='flex-end' xs={5}>
          {addressWithIdenticon(sender.name, sender.address)}
        </Grid>
        <Grid item>
          <Divider orientation='vertical' flexItem>
            <Avatar sx={{ bgcolor: grey[300] }}>
              <ArrowForwardRounded fontSize='small' />
            </Avatar>
          </Divider>
        </Grid>
        <Grid item container alignItems='center' xs={5}>
          {addressWithIdenticon(recepient.name, recepient.address)}
        </Grid>
      </Grid>

      <Grid data-testid='infoInMiddle' container alignItems='center' justifyContent='space-around' sx={{ paddingTop: '20px' }}>
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
              <Hint id='networkFee' tip={t<string>('Network fees are paid to network validators who process transactions on the network. This wallet does not profit from fees. Fees are set by the network and fluctuate based on network traffic and transaction complexity.')}>
                <InfoTwoToneIcon color='action' fontSize='small' />
              </Hint>
            </Grid>
            <Grid item sx={{ alignItems: 'center', fontSize: 13, textAlign: 'left' }}>
              <Hint id='networkFee' tip={t<string>('get newtwork fee now')}>
                <IconButton onClick={refreshNetworkFee} sx={{ top: -7 }}>
                  <RefreshRounded color='action' fontSize='small' />
                </IconButton>
              </Hint>
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
            {/* {failAlert
              ? <Alert severity='warning' sx={{ fontSize: 11 }}>{t('Transaction most likely fail, consider fee')}!</Alert>
              : ''} */}
          </Grid>

          <Grid item container justifyContent='flex-end' spacing={1} xs={3} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'right' }}>
            <Grid item>
              {total || ' ... '}
            </Grid>
            <Grid item>
              {coin}
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container item sx={{ p: '30px 20px' }} xs={12}>
        <Password
          autofocus={true}
          handleClearPassword={handleClearPassword}
          handleIt={handleConfirm}
          handleSavePassword={handleSavePassword}
          // isDisabled={}
          password={password}
          passwordStatus={passwordStatus}
        />

        <ConfirmButton
          state={state}
          handleBack={handleConfirmModaClose}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
        />
      </Grid>
    </Popup>
  );
}
