// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component renders contribute page where users can easily contribute to an active crowdloan
 * */

import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AllOut as AllOutIcon } from '@mui/icons-material';
import { Grid, InputAdornment, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Participator, Password, PlusHeader, Popup } from '../../components';
import { ChooseProxy } from '../../partials';
import broadcast from '../../util/api/broadcast';
import { PASS_MAP } from '../../util/constants';
import { Auction, ChainInfo, Crowdloan, nameAddress, Proxy, TransactionDetail } from '../../util/plusTypes';
import { amountToMachine, fixFloatingPoint, saveHistory } from '../../util/plusUtils';
import Fund from './Fund';

interface Props {
  auction: Auction;
  crowdloan: Crowdloan;
  contributeModal: boolean;
  setContributeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  endpoints: LinkOption[];
  chainInfo: ChainInfo;
  address: string;
  myContributions: Map<string, Balance> | undefined;
}

export default function Contribute({ address, auction, chainInfo, contributeModal, crowdloan, myContributions, endpoints, setContributeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { hierarchy } = useContext(AccountContext);
  const { accounts } = useContext(AccountContext);

  const chain = useMetadata(chainInfo.genesisHash, true);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [contributionAmountInHuman, setContributionAmountInHuman] = useState<string>('');
  const [contributionAmount, setContributionAmount] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean | undefined>();
  const [proxy, setProxy] = useState<Proxy | undefined>();
  const [selectProxyModalOpen, setSelectProxyModalOpen] = useState<boolean>(false);

  const isProxied = useMemo(() => accounts?.find((acc) => acc.address === address)?.isExternal, [accounts, address]);

  const { api, coin, decimals } = chainInfo;
  const tx = api.tx.crowdloan.contribute;
  const minContribution = api.createType('Balance', auction.minContribution);

  useEffect(() => {
    if (!encodedAddressInfo) { return; }

    const dummyParams = ['2000', contributionAmount, null];

    // eslint-disable-next-line no-void
    void tx(...dummyParams).paymentInfo(encodedAddressInfo.address).then((i) => setEstimatedFee(i?.partialFee)).catch(console.error);
  }, [auction.minContribution, encodedAddressInfo, tx, contributionAmount]);

  useEffect(() => {
    setConfirmButtonDisabled(!estimatedFee || !availableBalance || !contributionAmount || contributionAmount.lt(minContribution) || contributionAmount.add(estimatedFee).gt(availableBalance));
  }, [availableBalance, contributionAmount, estimatedFee, minContribution]);

  const handleConfirmModaClose = useCallback((): void => {
    setContributeModalOpen(false);
  }, [setContributeModalOpen]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    try {
      if (!encodedAddressInfo) {
        console.log(' No encoded address');

        return;
      }

      setConfirmingState('confirming');
      const signer = keyring.getPair(proxy?.delegate ?? encodedAddressInfo?.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const params = [crowdloan.fund.paraId, contributionAmount, null];

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, signer, encodedAddressInfo.address, proxy);

      const history: TransactionDetail = {
        action: 'contribute',
        amount: contributionAmountInHuman,
        block,
        date: Date.now(),
        fee: fee || String(estimatedFee) || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: crowdloan.fund.paraId
      };

      updateMeta(...saveHistory(chain, hierarchy, encodedAddressInfo.address, history)).catch(console.error);

      setConfirmingState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setConfirmingState('');
    }
  }, [api, chain, contributionAmount, estimatedFee, contributionAmountInHuman, crowdloan.fund.paraId, encodedAddressInfo, hierarchy, password, proxy, tx]);

  const handleReject = useCallback((): void => {
    setConfirmingState('');
    handleConfirmModaClose();
    onAction('/');
  }, [handleConfirmModaClose, onAction]);

  const handleBack = useCallback((): void => {
    handleConfirmModaClose();
  }, [handleConfirmModaClose]);

  const handleChange = useCallback((value: string): void => {
    value = Number(value) < 0 ? String(-Number(value)) : value;
    const fixedVal = fixFloatingPoint(value);

    setContributionAmountInHuman(fixedVal);
    const contributingAmountInMachine = amountToMachine(fixedVal, decimals);

    setContributionAmount(api.createType('Balance', contributingAmountInMachine));
  }, [api, decimals]);


  const handleChooseProxy = useCallback((): void => {
    setSelectProxyModalOpen(true);
  }, []);

  return (
    <Popup handleClose={handleConfirmModaClose} showModal={contributeModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<AllOutIcon fontSize='small' />} title={'Contribute'} />
      <Grid container sx={{ padding: '20px 30px 40px' }}>
        {chain &&
          <Fund
            coin={coin}
            crowdloan={crowdloan}
            decimals={decimals}
            endpoints={endpoints}
            myContributions={myContributions}
          />}
      </Grid>
      <Participator
        address={address}
        availableBalance={availableBalance}
        chain={chain}
        chainInfo={chainInfo}
        encodedAddressInfo={encodedAddressInfo}
        role={t('Contributor')}
        setAvailableBalance={setAvailableBalance}
        setEncodedAddressInfo={setEncodedAddressInfo}
      />
      <Grid container item sx={{ p: '25px 40px 10px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          fullWidth
          helperText={
            <Grid
              container
              item
              justifyContent='space-between'
              xs={12}
            >
              <Grid item>
                {`${t('Minimum contribution')}: ${minContribution.toHuman()}`}
              </Grid>
              <Grid item>
                {t('Fee')} {': '}
                {estimatedFee
                  ? `${estimatedFee.toHuman()}`
                  : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                }
              </Grid>
            </Grid>
          }
          label={t('Contribution amount')}
          margin='dense'
          name='contributionAmount'
          onChange={(event) => handleChange(event.target.value)}
          placeholder={'0'}
          size='medium'
          type='number'
          value={contributionAmountInHuman}
          variant='outlined'
        />
      </Grid>
      <Grid container item sx={{ p: '20px' }} xs={12}>
        <Grid container item spacing={0.5} xs={12}>
          <Grid item xs>
            <Password
              handleIt={handleConfirm}
              isDisabled={!!confirmingState || confirmButtonDisabled || (isProxied && !proxy)}
              password={password}
              passwordStatus={passwordStatus}
              setPassword={setPassword}
              setPasswordStatus={setPasswordStatus}
            />
          </Grid>
          <ChooseProxy
            acceptableTypes={['Any', 'Auction', 'NonTransfer']}
            api={api}
            chain={chain}
            headerIcon={<FontAwesomeIcon icon={faCoins} size='sm' />}
            onClick={handleChooseProxy}
            proxy={proxy}
            realAddress={encodedAddressInfo?.address}
            selectProxyModalOpen={selectProxyModalOpen}
            setProxy={setProxy}
            setSelectProxyModalOpen={setSelectProxyModalOpen}
          />
        </Grid>
        <ConfirmButton
          handleBack={handleBack}
          handleConfirm={handleConfirm}
          handleReject={handleBack}
          isDisabled={confirmButtonDisabled}
          state={confirmingState}
        />
      </Grid>
    </Popup>
  );
}
