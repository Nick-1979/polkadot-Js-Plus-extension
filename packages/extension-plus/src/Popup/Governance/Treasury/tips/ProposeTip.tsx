// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description this component is used to propose a treasury tip
*/

import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from '@mui/icons-material';
import { Grid, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import { AccountContext } from '../../../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../../extension-ui/src/messaging';
import { AddressInput, ConfirmButton, Participator, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import Hint from '../../../../components/Hint';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo, nameAddress, TransactionDetail } from '../../../../util/plusTypes';
import { saveHistory } from '../../../../util/plusUtils';

interface Props {
  address: string;
  chain: Chain;
  chainInfo: ChainInfo;
  showProposeTipModal: boolean;
  handleProposeTipModalClose: () => void;
}

export default function ProposeTip({ address, chain, chainInfo, handleProposeTipModalClose, showProposeTipModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const { api, decimals } = chainInfo;
  const tx = api.tx.tips.reportAwesome;

  const reportDeposit = useMemo((): Balance =>
    api.createType('Balance', (api.consts.tips.tipReportDepositBase).add((api.consts.tips.dataDepositPerByte).muln(reason.length))
    ), [api, reason.length]);

  const maximumReasonLength = api.consts.tips.maximumReasonLength.toNumber();

  useEffect(() => {
    if (!tx || !encodedAddressInfo?.address || !beneficiaryAddress) { return; }
    const params = [reason, beneficiaryAddress];

    setParams(params);

    // eslint-disable-next-line no-void
    void tx(...params).paymentInfo(encodedAddressInfo?.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);
  }, [beneficiaryAddress, decimals, encodedAddressInfo?.address, tx, reason]);

  useEffect(() => {
    if (!estimatedFee || !availableBalance) {
      setIsDisabled(true);
    } else {
      setIsDisabled(!(reason && beneficiaryAddress && estimatedFee.add(reportDeposit).lt(availableBalance)));
    }
  }, [availableBalance, beneficiaryAddress, estimatedFee, reason, reportDeposit]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    try {
      if (!encodedAddressInfo?.address) {
        console.log('no encded address');

        return;
      }

      setState('confirming');

      const pair = keyring.getPair(encodedAddressInfo.address);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair, encodedAddressInfo.address);

      const currentTransactionDetail: TransactionDetail = {
        action: 'Propose_tip',
        amount: '',
        block,
        date: Date.now(),
        fee: fee || String(estimatedFee) || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: String(beneficiaryAddress)
      };

      updateMeta(...saveHistory(chain, hierarchy, encodedAddressInfo.address, currentTransactionDetail)).catch(console.error);

      setState(status);
    } catch (e) {
      console.log('error in propose proposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [encodedAddressInfo?.address, estimatedFee, password, api, tx, params, beneficiaryAddress, chain, hierarchy]);

  const handleReject = useCallback((): void => {
    setState('');
    handleProposeTipModalClose();
  }, [handleProposeTipModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReason(event.target.value);
  }, []);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('declare why the recipient deserves a tip payout?')}
      </Grid>
      {!!beneficiaryAddress &&
        <Grid item>
          <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
        </Grid>
      }
    </Grid>);

  return (
    <Popup handleClose={handleProposeTipModalClose} showModal={showProposeTipModal}>
      <PlusHeader action={handleProposeTipModalClose} chain={chain} closeText={'Close'} icon={<AddCircleOutlineRoundedIcon fontSize='small' />} title={t('Propose tip')} />
      <Participator
        address={address}
        availableBalance={availableBalance}
        chain={chain}
        chainInfo={chainInfo}
        encodedAddressInfo={encodedAddressInfo}
        role={t('Proposer')}
        setAvailableBalance={setAvailableBalance}
        setEncodedAddressInfo={setEncodedAddressInfo}
      />
      <Grid item sx={{ p: '30px 40px 1px' }} xs={12}>
        <AddressInput api={chainInfo.api} chain={chain} freeSolo selectedAddress={beneficiaryAddress} setSelectedAddress={setBeneficiaryAddress} title={t('Beneficiary')} />
      </Grid>
      <Grid item sx={{ p: '10px 40px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { fontSize: 14 } }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Reason')}
          margin='dense'
          multiline
          name='reason'
          onChange={handleChange}
          rows={3}
          size='medium'
          type='text'
          value={reason}
          variant='outlined'
        />
      </Grid>
      <Grid alignItems='center' container item spacing={0.5} sx={{ fontSize: 13, p: '15px 50px', textAlign: 'left' }} xs={12}>
        <Hint icon place='bottom' tip={t('held on deposit for placing the tip report')}>
          {`${t('Report deposit')}: ${reportDeposit.toHuman()}`}
        </Hint>
      </Grid>
      <Grid container item sx={{ p: '25px 30px', textAlign: 'center' }} xs={12}>
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
    </Popup >
  );
}
