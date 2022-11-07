// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 *  here users can double check their transfer information before submitting it to the blockchain 
 * */

import { ArrowForwardRounded, InfoTwoTone as InfoTwoToneIcon, RefreshRounded, SendOutlined as SendOutlinedIcon } from '@mui/icons-material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { Alert, Avatar, Box, Button as MuiButton, CircularProgress, Divider, Grid, IconButton, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { AccountJson } from '@polkadot/extension-base/background/types';
import Identicon from '@polkadot/react-identicon';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../extension-chains/src/types';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../extension-ui/src/messaging';
import { ConfirmButton, Password, PlusHeader, Popup, ShortAddress } from '../../components';
import { ChooseProxy } from '../../partials';
import SelectProxy from '../../partials/SelectProxy';
import { broadcast } from '../../util/api';
import { PASS_MAP } from '../../util/constants';
import { AccountsBalanceType, Proxy, TransactionDetail } from '../../util/plusTypes';
import { amountToHuman, fixFloatingPoint, saveHistory } from '../../util/plusUtils';

interface Props {
  api: ApiPromise;
  sender: AccountsBalanceType;
  recepient: AccountsBalanceType;
  chain: Chain;
  className?: string;
  confirmModalOpen: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lastFee?: Balance;
  transferAmount: bigint;
  handleTransferModalClose: () => void;
  transferAllType?: string;
}

export default function ConfirmTx({ api, chain, confirmModalOpen, handleTransferModalClose, lastFee, recepient, sender, setConfirmModalOpen, transferAllType, transferAmount }: Props): React.ReactElement<Props> {
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
  const [proxy, setProxy] = useState<Proxy | undefined>();
  const [selectProxyModalOpen, setSelectProxyModalOpen] = useState<boolean>(false);

  const decimals = api.registry.chainDecimals[0];
  const token = api.registry.chainTokens[0];

  /** transferAll for Max, when Keep_Alive is true will transfer all available balance, probably because the sender has some unlocking funds */
  const transfer = transferAllType === 'All' ? (api.tx.balances.transferAll) : (api.tx.balances.transfer);

  useEffect(() => {
    setTransferAmountInHuman(amountToHuman(String(transferAmount), decimals));
  }, [chain, decimals, transferAmount]);

  useEffect(() => {
    setTransferAllAlert(['All', 'Max'].includes(transferAllType));
  }, [transferAllType]);

  useEffect(() => {
    setNewFee(lastFee);
  }, [lastFee]);

  useEffect(() => {
    if (!newFee) { return; }

    const total = amountToHuman((newFee.toBigInt() + transferAmount).toString(), decimals);

    setTotal(fixFloatingPoint(total));
  }, [decimals, newFee, transferAmount]);

  const handleConfirmModaClose = useCallback((): void => {
    setConfirmModalOpen(false);
    setState('');
  }, [setConfirmModalOpen]);

  const handleReject = useCallback((): void => {
    setConfirmModalOpen(false);
    handleTransferModalClose();
  }, [handleTransferModalClose, setConfirmModalOpen]);

  const handleChooseProxy = useCallback((): void => {
    setSelectProxyModalOpen(true);
  }, []);

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
    if (['confirming', 'success', 'failed'].includes(state)) { return; }

    setState('confirming');

    try {
      const signer = keyring.getPair(proxy?.delegate ?? sender.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      // const KeepAlive = transferAllType === 'Max';
      const params = transferAllType === 'All' ? [recepient.address, false] : [recepient.address, transferAmount];

      const { block, failureText, fee, status, txHash } = await broadcast(api, transfer, params, signer, sender.address, proxy);

      const currentTransactionDetail: TransactionDetail = {
        action: 'send',
        amount: amountToHuman(String(transferAmount), decimals),
        block,
        date: Date.now(),
        fee: fee || String(lastFee) || '',
        from: sender.address,
        hash: txHash || '',
        status: failureText || status,
        to: recepient.address
      };

      // eslint-disable-next-line no-void
      updateMeta(...saveHistory(chain, hierarchy, sender.address, currentTransactionDetail)).catch(console.error);

      setState(status);
    } catch (e) {
      console.log('password issue:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFee, chain, api, decimals, hierarchy, password, recepient.address, proxy, sender.address, transfer, transferAllType, transferAmount]);

  // function disable(flag: boolean) {
  //   return {
  //     opacity: flag ? '0.15' : '1',
  //     pointerEvents: flag ? 'none' : 'initial'
  //   };
  // }

  const addressWithIdenticon = (name: string | null, address: string): React.ReactElement => (
    <>
      <Grid item sx={{ textAlign: 'center' }} xs={3}>
        <Identicon
          prefix={chain?.ss58Format ?? 42}
          size={30}
          theme={chain?.icon || 'polkadot'}
          value={address}
        />
      </Grid>
      <Grid container item sx={{ fontSize: 14, textAlign: 'left' }} xs={7}>
        <Grid item sx={{ fontSize: 14, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={12}>
          {name || <ShortAddress address={address} />}
        </Grid>
        {name && <Grid item sx={{ color: grey[500], fontSize: 13, textAlign: 'left' }} xs={12}>
          <ShortAddress address={address} />
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
          <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, fontVariant: 'small-caps', justifyContent: 'flex-start', padding: '5px 10px 5px', textAlign: 'center' }} xs={3}>
            {t('transfer of')}
          </Grid>
          <Grid container item justifyContent='center' spacing={1} sx={{ fontSize: 20, fontWeight: 600, textAlign: 'center' }} xs={12}>
            <Grid item>
              {transferAmountInHuman}
            </Grid>
            <Grid item>
              {token}
            </Grid>
          </Grid>
        </Grid>
        <Grid alignItems='center' container item sx={{ padding: '30px 40px 20px' }} xs={12}>
          <Grid container item xs={6}>
            <Grid item sx={{ fontSize: 13, fontWeight: '600', textAlign: 'left' }}>
              {t('Network Fee')}
            </Grid>
            <Grid item sx={{ fontSize: 13, marginLeft: '5px', textAlign: 'left' }}>
              <Tooltip title={t<string>('Network fees are paid to network validators who process transactions on the network. This wallet does not profit from fees. Fees are set by the network and fluctuate based on network traffic and transaction complexity.')}>
                <InfoTwoToneIcon color='action' fontSize='small' />
              </Tooltip>
            </Grid>
            <Grid item sx={{ alignItems: 'center', fontSize: 13, textAlign: 'left' }}>
              <Tooltip title={t<string>('get newtwork fee now')}>
                <IconButton onClick={refreshNetworkFee} sx={{ top: -7 }}>
                  <RefreshRounded color='action' fontSize='small' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'right' }} xs={6}>
            {newFee?.toHuman() || <CircularProgress color='inherit' size={12} thickness={2} />}
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
            {transferAllAlert &&
              <Alert severity='warning' sx={{ fontSize: 12, p: 0, textAlign: 'center' }}>{t('Transfering {{type}} amount', { type: transferAllType })}!</Alert>
            }
          </Grid>
          <Grid container item justifyContent='flex-end' spacing={1} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'right' }} xs={3}>
            <Grid item>
              {total || ' ... '}
            </Grid>
            <Grid item>
              {token}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container item sx={{ p: '35px 20px' }} xs={12}>
        <Grid container item spacing={0.5} xs={12}>
          <Grid item xs>
            <Password
              autofocus={true}
              handleIt={handleConfirm}
              helper={proxy ? t('Please enter the proxy account password') : undefined}
              isDisabled={['confirming', 'success', 'failed'].includes(state) || (sender.isProxied && !proxy)}
              password={password}
              passwordStatus={passwordStatus}
              setPassword={setPassword}
              setPasswordStatus={setPasswordStatus}
            />
          </Grid>
          <ChooseProxy
            acceptableTypes={['Any']}
            api={api}
            chain={chain}
            headerIcon={<SendOutlinedIcon fontSize='small' sx={{ transform: 'rotate(-45deg)' }} />}
            onClick={handleChooseProxy}
            proxy={proxy}
            realAddress={sender.address}
            selectProxyModalOpen={selectProxyModalOpen}
            setProxy={setProxy}
            setSelectProxyModalOpen={setSelectProxyModalOpen}
          />
        </Grid>
        <ConfirmButton
          handleBack={handleConfirmModaClose}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
          isDisabled={sender.isProxied && !proxy}
          state={state}
        />
      </Grid>
    </Popup>
  );
}
