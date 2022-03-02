// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE here users can double check their transfer information before submitting it to the blockchain */

import type { KeypairType } from '@polkadot/util-crypto/types';

import { ArrowForwardRounded, InfoTwoTone as InfoTwoToneIcon, RefreshRounded } from '@mui/icons-material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { Alert, Avatar, Box, CircularProgress, Divider, Grid, IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import Identicon from '@polkadot/react-identicon';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { AccountWithChildren } from '../../../../extension-base/src/background/types';
import { Chain } from '../../../../extension-chains/src/types';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../extension-ui/src/messaging';
import { ConfirmButton, Password, PlusHeader, Popup } from '../../components';
import Hint from '../../components/Hint';
import broadcast from '../../util/api/broadcast';
import { PASS_MAP } from '../../util/constants';
import { AccountsBalanceType, ChainInfo, TransactionDetail } from '../../util/plusTypes';
import { amountToHuman, fixFloatingPoint, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData, toShortAddress } from '../../util/plusUtils';

interface Props {
  actions?: React.ReactNode;
  chainInfo: ChainInfo;
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
  lastFee?: Balance;
  name?: string | null;
  parentName?: string | null;
  toggleActions?: number;
  type?: KeypairType;
  transferAmount: bigint;
  handleTransferModalClose: () => void;
  transferAllType?: string;
}

export default function ConfirmTx({ chain, chainInfo, confirmModalOpen, handleTransferModalClose, lastFee, recepient, sender, setConfirmModalOpen, transferAllType, transferAmount }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [newFee, setNewFee] = useState<Balance | null>();
  const [total, setTotal] = useState<string | null>(null);
  const [confirmDisabled, setConfirmDisabled] = useState<boolean>(true);
  const [transferAllAlert, setTransferAllAlert] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [transferAmountInHuman, setTransferAmountInHuman] = useState('');
  const { hierarchy } = useContext(AccountContext);
  const [state, setState] = useState<string>('');

  /** transferAll for Max, when Keep_Alive is true will transfer all available balance, probably because the sender has some unlocking funds */
  const transfer = transferAllType === 'All' ? (chainInfo?.api.tx.balances.transferAll) : (chainInfo?.api.tx.balances.transfer);

  useEffect(() => {
    setTransferAmountInHuman(amountToHuman(String(transferAmount), chainInfo?.decimals));
  }, [chain, chainInfo?.decimals, transferAmount]);

  useEffect(() => {
    setTransferAllAlert(['All', 'Max'].includes(transferAllType));
  }, [transferAllType]);

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    setNewFee(lastFee);
  }, [lastFee]);

  useEffect(() => {
    if (!newFee) return;

    const total = amountToHuman((newFee.toBigInt() + transferAmount).toString(), chainInfo?.decimals);

    setTotal(fixFloatingPoint(total));
  }, [chainInfo?.decimals, newFee, transferAmount]);

  function makeAddressShort(_address: string): React.ReactElement {
    return (
      <Box
        component='span'
        fontFamily='Monospace'
      // fontStyle='oblique'
      // fontWeight='fontWeightBold'
      >
        {toShortAddress(_address)}
      </Box>
    );
  }

  const handleConfirmModaClose = useCallback((): void => {
    setConfirmModalOpen(false);
    setState('');
  }, [setConfirmModalOpen]);

  const handleReject = useCallback((): void => {
    setConfirmModalOpen(false);
    handleTransferModalClose();
  }, [handleTransferModalClose, setConfirmModalOpen]);

  const refreshNetworkFee = useCallback(async (): Promise<void> => {
    setNewFee(null);
    const localConfirmDisabled = confirmDisabled;

    setConfirmDisabled(true);

    const { partialFee } = await transfer(sender.address, transferAmount).paymentInfo(sender.address);

    if (!partialFee) {
      console.log('fee is NULL');

      return;
    }

    setNewFee(partialFee);
    setConfirmDisabled(localConfirmDisabled);
  }, [confirmDisabled, sender.address, transfer, transferAmount]);

  const handleConfirm = useCallback(async () => {
    setState('confirming');

    try {
      const signer = keyring.getPair(String(sender.address));

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      // const KeepAlive = transferAllType === 'Max';
      const params = transferAllType === 'All' ? [recepient.address, false] : [recepient.address, transferAmount];

      const { block, failureText, fee, status, txHash } = await broadcast(chainInfo?.api, transfer, params, signer);

      const currentTransactionDetail: TransactionDetail = {
        action: 'send',
        amount: amountToHuman(String(transferAmount), chainInfo?.decimals),
        block: block,
        date: Date.now(),
        fee: fee || '',
        from: sender.address,
        hash: txHash || '',
        status: failureText || status,
        to: recepient.address
      };

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, sender.address, currentTransactionDetail);
      setState(status);
    } catch (e) {
      console.log('password issue:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [chain, chainInfo?.api, chainInfo?.decimals, hierarchy, password, recepient.address, sender.address, transfer, transferAllType, transferAmount]);

  // function disable(flag: boolean) {
  //   return {
  //     opacity: flag ? '0.15' : '1',
  //     pointerEvents: flag ? 'none' : 'initial'
  //   };
  // }

  const addressWithIdenticon = (name: string | null, address: string): React.ReactElement => (
    <>
      <Grid item sx={{ textAlign: 'center' }} xs={4}>
        <Identicon
          prefix={chain?.ss58Format ?? 42}
          size={30}
          theme={chain?.icon || 'polkadot'}
          value={address}
        />
      </Grid>
      <Grid container item sx={{ fontSize: 14, textAlign: 'left' }} xs={6}>
        <Grid item sx={{ fontSize: 14, textAlign: 'left' }} xs={12}>
          {name || makeAddressShort(String(address))}
        </Grid>
        {name && <Grid item sx={{ fontSize: 13, textAlign: 'left', color: grey[500] }} xs={12}>
          {makeAddressShort(String(address))}
        </Grid>
        }
      </Grid>
    </>);

  return (
    <Popup handleClose={handleConfirmModaClose} showModal={confirmModalOpen}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm Transfer'} />

      <Grid alignItems='center' container justifyContent='space-around' sx={{ paddingTop: '10px' }}>
        <Grid alignItems='center' container item justifyContent='flex-end' xs={5}>
          {addressWithIdenticon(sender.name, sender.address)}
        </Grid>
        <Grid item>
          <Divider flexItem orientation='vertical'>
            <Avatar sx={{ bgcolor: grey[300] }}>
              <ArrowForwardRounded fontSize='small' />
            </Avatar>
          </Divider>
        </Grid>
        <Grid alignItems='center' container item xs={5}>
          {addressWithIdenticon(recepient.name, recepient.address)}
        </Grid>
      </Grid>

      <Grid alignItems='center' container data-testid='infoInMiddle' justifyContent='space-around' sx={{ paddingTop: '20px' }}>
        <Grid container item sx={{ backgroundColor: '#f7f7f7', padding: '25px 40px 25px' }} xs={12}>
          <Grid item sx={{ padding: '5px 10px 5px', borderRadius: '5px', border: '2px double grey', justifyContent: 'flex-start', fontSize: 15, textAlign: 'center', fontVariant: 'small-caps' }} xs={3}>
            {t('transfer of')}
          </Grid>
          <Grid container item justifyContent='center' spacing={1} sx={{ fontSize: 18, fontFamily: 'fantasy', textAlign: 'center' }} xs={12} >
            <Grid item>
              {transferAmountInHuman}
            </Grid>
            <Grid item>
              {chainInfo?.coin}
            </Grid>
          </Grid>
        </Grid>
        <Grid alignItems='center' container item sx={{ padding: '30px 40px 20px' }} xs={12}>
          <Grid container item xs={6}>
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
          <Grid item sx={{ fontSize: 13, textAlign: 'right' }} xs={6}>
            {Number(amountToHuman(newFee?.toString(), chainInfo?.decimals, 5)) || <CircularProgress color='inherit' size={12} thickness={2} />}
            <Box fontSize={11} sx={{ color: 'gray' }}>
              {newFee ? 'estimated' : 'estimating'}
            </Box>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid alignItems='center' container item sx={{ padding: '10px 40px 20px' }} xs={12}>
          <Grid item sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }} xs={3}>
            {t('Total')}
          </Grid>
          <Grid item sx={{ height: '20px', p: '0px 10px' }} xs={6}>
            {transferAllAlert
              ? <Alert severity='warning' sx={{ fontSize: 12, p: 0, textAlign: 'center' }}>{t('Transfering {{type}} amount', { type: transferAllType })}!</Alert>
              : ''}
          </Grid>

          <Grid container item justifyContent='flex-end' spacing={1} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'right' }} xs={3}>
            <Grid item>
              {total || ' ... '}
            </Grid>
            <Grid item>
              {chainInfo?.coin}
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container item sx={{ p: '35px 20px' }} xs={12}>
        <Password
          autofocus={true}
          handleIt={handleConfirm}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />

        <ConfirmButton
          handleBack={handleConfirmModaClose}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
          state={state}
        />
      </Grid>
    </Popup>
  );
}
