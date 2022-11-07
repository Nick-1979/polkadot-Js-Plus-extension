// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveProposal } from '@polkadot/api-derive/types';

import { RecommendOutlined as RecommendOutlinedIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import { AccountContext } from '../../../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../../extension-ui/src/messaging';
import { ConfirmButton, Participator, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo, nameAddress, TransactionDetail } from '../../../../util/plusTypes';
import { formatMeta, saveHistory } from '../../../../util/plusUtils';

interface Props {
  address: string;
  selectedProposal: DeriveProposal;
  chain: Chain;
  chainInfo: ChainInfo;
  showVoteProposalModal: boolean;
  handleVoteProposalModalClose: () => void;
}

export default function Second({ address, chain, chainInfo, handleVoteProposalModalClose, selectedProposal, showVoteProposalModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);

  const value = selectedProposal.image?.proposal;
  const meta = value?.registry.findMetaCall(value.callIndex);
  const description = formatMeta(meta?.meta);
  const { api } = chainInfo;

  const tx = api.tx.democracy.second;

  const params = useMemo(() =>
    api.tx.democracy.second.meta.args.length === 2
      ? [selectedProposal.index, selectedProposal.seconds.length]
      : [selectedProposal.index],
    [api.tx.democracy.second.meta.args.length, selectedProposal.index, selectedProposal.seconds.length]);

  useEffect(() => {
    if (!chainInfo || !tx || !encodedAddressInfo) { return; }

    // eslint-disable-next-line no-void
    void tx(...params).paymentInfo(encodedAddressInfo.address)
      .then((i) => setEstimatedFee(BigInt(String(i?.partialFee))))
      .catch(console.error);
  }, [chainInfo, params, encodedAddressInfo, tx]);

  const handleReject = useCallback((): void => {
    setState('');
    handleVoteProposalModalClose();
  }, [handleVoteProposalModalClose]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!encodedAddressInfo?.address) {
      console.log(' no encoded address!');

      return;
    }

    setState('confirming');

    try {
      const pair = keyring.getPair(encodedAddressInfo.address);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair, encodedAddressInfo.address);

      const currentTransactionDetail: TransactionDetail = {
        action: 'endorse',
        amount: '0',
        block,
        date: Date.now(),
        fee: fee || String(estimatedFee) || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: String(selectedProposal.index)
      };

      updateMeta(...saveHistory(chain, hierarchy, estimatedFee, encodedAddressInfo.address, currentTransactionDetail)).catch(console.error);

      setState(status);
    } catch (e) {
      console.log('error in second proposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [encodedAddressInfo?.address, password, api, tx, params, selectedProposal.index, chain, hierarchy]);

  return (
    <Popup handleClose={handleVoteProposalModalClose} showModal={showVoteProposalModal}>
      <PlusHeader action={handleVoteProposalModalClose} chain={chain} closeText={'Close'} icon={<RecommendOutlinedIcon fontSize='small' />} title={'Endorse'} />
      <Participator
        address={address}
        availableBalance={availableBalance}
        chain={chain}
        chainInfo={chainInfo}
        encodedAddressInfo={encodedAddressInfo}
        role={t('Seconder')}
        setAvailableBalance={setAvailableBalance}
        setEncodedAddressInfo={setEncodedAddressInfo}
      />
      <Grid sx={{ color: grey[600], fontSize: 11, p: '0px 48px 20px', textAlign: 'right' }} xs={12}>
        <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title='Fee' />
      </Grid>
      <Grid container item justifyContent='center' sx={{ height: '280px' }} xs={12}>
        <Grid item sx={{ fontWeight: '600', pt: '50px', textAlign: 'center' }} xs={12}>
          <Typography variant='h6'>
            {t('Proposal')}{': #'}{String(selectedProposal?.index)}
          </Typography>
        </Grid>
        <Grid item sx={{ p: '0px 30px', textAlign: 'center' }} xs={12}>
          <Typography variant='subtitle1'>
            {description}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item sx={{ p: '0px 30px', textAlign: 'center' }} xs={12}>
        <Password
          handleIt={handleConfirm}
          isDisabled={!!state || !availableBalance || availableBalance?.isZero()}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />
        <ConfirmButton
          handleBack={handleReject}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
          isDisabled={!availableBalance || availableBalance?.isZero()}
          state={state}
        />
      </Grid>
    </Popup>
  );
}
