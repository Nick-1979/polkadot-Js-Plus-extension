// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description this component is used to submit a treasury proposal
*/

import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from '@mui/icons-material';
import { Grid, InputAdornment, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';
import { BN_HUNDRED, BN_MILLION } from '@polkadot/util';

import { Chain } from '../../../../../../extension-chains/src/types';
import { AccountContext } from '../../../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../../extension-ui/src/messaging';
import { AddressInput, ConfirmButton, Participator, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import Hint from '../../../../components/Hint';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo, nameAddress, TransactionDetail } from '../../../../util/plusTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint, saveHistory } from '../../../../util/plusUtils';

interface Props {
  address: string;
  chain: Chain;
  chainInfo: ChainInfo;
  showSubmitProposalModal: boolean;
  handleSubmitProposalModalClose: () => void;
}

export default function SubmitProposal({ address, chain, chainInfo, handleSubmitProposalModalClose, showSubmitProposalModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [value, setValue] = useState<bigint | undefined>();
  const [valueInHuman, setValueInHuman] = useState<string | undefined>();
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const [collateral, setCollateral] = useState<Balance | undefined>();

  const { api, decimals } = chainInfo;
  const tx = api.tx.treasury.proposeSpend;

  const bondPercentage = useMemo((): number => (api.consts.treasury.proposalBond.mul(BN_HUNDRED).div(BN_MILLION)).toNumber(), [api.consts.treasury.proposalBond]);
  const proposalBondMinimum = useMemo((): Balance => api.createType('Balance', api.consts.treasury.proposalBondMinimum), [api]);
  const proposalBondMaximum = useMemo((): Balance => api.createType('Balance', api.consts.treasury.proposalBondMaximum.unwrap()), [api]);

  useEffect(() => {
    if (!value) { return setCollateral(proposalBondMinimum); }

    const valuePercentage = api.createType('Balance', BigInt(bondPercentage) * value / 100n);
    let collateral = valuePercentage;

    if (valuePercentage.lt(proposalBondMinimum)) {
      collateral = proposalBondMinimum;
    } else if (valuePercentage.gt(proposalBondMaximum)) {
      collateral = proposalBondMaximum;
    }

    setCollateral(collateral);
  }, [proposalBondMinimum, proposalBondMaximum, bondPercentage, value, api]);

  useEffect(() => {
    if (!tx || !encodedAddressInfo?.address) return;
    const params = [value, beneficiaryAddress];

    setParams(params);

    // eslint-disable-next-line no-void
    beneficiaryAddress && void tx(...params).paymentInfo(encodedAddressInfo?.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);
  }, [beneficiaryAddress, encodedAddressInfo, tx, value]);

  useEffect(() => {
    if (!estimatedFee || !value || !availableBalance || !bondPercentage || !beneficiaryAddress) {
      setIsDisabled(true);
    } else {
      /** account must have available balance to bond */
      const valuePercentage = BigInt(bondPercentage) * value / 100n;
      const minBond = valuePercentage > proposalBondMinimum.toBigInt() ? valuePercentage : proposalBondMinimum.toBigInt();

      setIsDisabled(minBond + estimatedFee.toBigInt() >= availableBalance.toBigInt());
    }
  }, [availableBalance, bondPercentage, decimals, estimatedFee, proposalBondMinimum, value, beneficiaryAddress]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    try {
      if (!encodedAddressInfo?.address) {
        console.log(' address is not encoded');

        return;
      }

      setState('confirming');
      const pair = keyring.getPair(encodedAddressInfo.address);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair, encodedAddressInfo.address);

      const currentTransactionDetail: TransactionDetail = {
        action: 'submit_proposal',
        amount: amountToHuman(value, decimals),
        block,
        date: Date.now(),
        fee: fee || String(estimatedFee) || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: beneficiaryAddress ?? ''
      };

      updateMeta(...saveHistory(chain, hierarchy, encodedAddressInfo.address, currentTransactionDetail)).catch(console.error);

      setState(status);
    } catch (e) {
      console.log('error in submit proposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [encodedAddressInfo?.address, password, api, estimatedFee, tx, params, value, decimals, beneficiaryAddress, chain, hierarchy]);

  const handleReject = useCallback((): void => {
    setState('');
    handleSubmitProposalModalClose();
  }, [handleSubmitProposalModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValueInHuman(fixFloatingPoint(event.target.value))
    setValue(amountToMachine(event.target.value, decimals));
  }, [decimals]);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('will be allocated to the beneficiary if approved')}
      </Grid>
      {!!beneficiaryAddress &&
        <Grid item>
          <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
        </Grid>
      }
    </Grid>
  );

  return (
    <Popup handleClose={handleSubmitProposalModalClose} showModal={showSubmitProposalModal}>
      <PlusHeader action={handleSubmitProposalModalClose} chain={chain} closeText={'Close'} icon={<AddCircleOutlineRoundedIcon fontSize='small' />} title={t('Submit proposal')} />
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
      <Grid item sx={{ p: '24px 40px 1px' }} xs={12}>
        <AddressInput api={chainInfo.api} chain={chain} freeSolo selectedAddress={beneficiaryAddress} setSelectedAddress={setBeneficiaryAddress} title={t('Beneficiary')} />
      </Grid>
      <Grid item sx={{ p: '15px 40px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Value')}
          margin='dense'
          name='value'
          onChange={handleChange}
          placeholder='0'
          size='medium'
          type='number'
          value={valueInHuman}
          variant='outlined'
        />
      </Grid>
      <Grid item sx={{ fontSize: 12, fontWeight: 600, p: '20px 40px 0px' }} xs={12}>
        <Hint icon={true} id='Collateral' tip='value would need to be put up as collateral, calculated based on value '>
          {`${t('Collateral')}: ${collateral?.toHuman() ?? 0} `}
        </Hint>
      </Grid>
      <Grid container item justifyContent='space-between' sx={{ fontSize: 10, p: '0px 40px 0px' }} xs={12}>
        <Grid item>
          <Hint icon={true} id='pBond' tip='% of value would need to be put up as collateral'>
            {`${t('Proposal bond')}: ${bondPercentage.toFixed(2)} %`}
          </Hint>
        </Grid>
        <Grid container item justifyContent='space-between'>
          <Grid item>
            <Hint icon={true} id='minBond' tip='the minimum to put up as collateral'>
              {`${t('Minimum bond')}: ${proposalBondMinimum.toHuman()}`}
            </Hint>
          </Grid>
          <Grid item>
            <Hint icon={true} id='maxBond' tip={t('the maximum to put up as collateral')}>
              {`${t('Maximum bond')}: ${proposalBondMaximum.toHuman()}`}
            </Hint>
          </Grid>
        </Grid>
      </Grid>
      <Grid container item sx={{ p: '10px 30px', textAlign: 'center' }} xs={12}>
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
    </Popup>
  );
}
