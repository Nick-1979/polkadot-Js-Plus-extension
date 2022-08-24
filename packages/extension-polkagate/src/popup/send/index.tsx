// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens social recovery index page to choose between configuring your account and rescuing other account
 * */

import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { Balance } from '@polkadot/types/interfaces';

import { Avatar, Container, Divider, Grid, useTheme } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useHistory, useLocation } from 'react-router-dom';

import { ApiPromise } from '@polkadot/api';
import { Identicon } from '@polkadot/extension-ui/components';
import { BN, BN_ZERO } from '@polkadot/util';

import { AccountContext, ActionContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Amount, Button, Header, ShortAddress, ShowBalance, To } from '../../components';
import { useApi, useEndpoint } from '../../hooks';
import getLogo from '../../util/getLogo';
import { isend, send } from '../../util/icons';
import { FormattedAddressState } from '../../util/types';
import { amountToHuman, getFormattedAddress } from '../../util/utils';

interface Props {
  className?: string;
}

export default function Send({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const settings = useContext(SettingsContext);
  const history = useHistory();
  const theme = useTheme();
  const { address, formatted, genesisHash } = useParams<FormattedAddressState>();
  const location = useLocation();
  const chain = useMetadata(genesisHash, true);
  const { accounts } = useContext(AccountContext);
  const endpoint = useEndpoint(accounts, address, chain);
  const api = useApi(endpoint);
  const [apiToUse, setApiToUse] = useState<ApiPromise | undefined>(location?.state?.api);
  const [fee, setFee] = useState<Balance>();
  const [maxFee, setMaxFee] = useState<Balance>();
  const [recepient, setRecepient] = useState<string | undefined>(location?.state?.recepient);
  const [amount, setAmount] = useState<string>(location?.state?.amount ?? '0');
  const [balances, setBalances] = useState<DeriveBalancesAll | undefined>(location?.state?.balances as DeriveBalancesAll);

  const prevUrl = `/account/${genesisHash}/${address}/${formatted}/`;
  const decimals = apiToUse?.registry?.chainDecimals[0] ?? 1;
  const accountName = useMemo(() => accounts?.find((a) => a.address === address)?.name, [accounts, address]);
  const transfer = apiToUse && apiToUse.tx?.balances && apiToUse.tx.balances.transfer;
  const recepientName = useMemo(
    () =>
      accounts?.find((a) => getFormattedAddress(a.address, chain, settings?.prefix) === recepient)?.name ?? t('Unknown'),
    [accounts, chain, recepient, settings?.prefix, t]
  );

  const setWholeAmount = useCallback((type: string) => {
    if (!api || !balances?.availableBalance || !maxFee) {
      return;
    }

    const ED = type === 'max' ? api.consts.balances.existentialDeposit : BN_ZERO;
    const allAmount = amountToHuman(balances?.availableBalance.sub(maxFee).sub(ED).toString(), decimals);

    setAmount(allAmount);
  }, [api, balances?.availableBalance, decimals, maxFee]);

  const goToReview = useCallback(() => {
    balances && history.push({
      pathname: `/send/review/${genesisHash}/${address}/${formatted}/`,
      state: { amount, api: apiToUse, balances, fee, recepient, recepientName }
    });
  }, [balances, history, genesisHash, address, formatted, amount, apiToUse, fee, recepient, recepientName]);

  useEffect(() => {
    api && setApiToUse(api);
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    endpoint && apiToUse && void apiToUse.derive.balances?.all(formatted).then((b) => {
      setBalances(b);
    });
  }, [apiToUse, formatted, endpoint]);

  useEffect(() => {
    if (!apiToUse || !transfer) { return; }

    const amountInNumber = new BN(parseFloat(parseFloat(amount).toFixed(4)) * 10 ** 4).mul(new BN(10 ** (decimals - 4)));

    // eslint-disable-next-line no-void
    void transfer(formatted, amountInNumber).paymentInfo(formatted)
      .then((i) => setFee(i?.partialFee)).catch(console.error);
  }, [apiToUse, formatted, transfer, amount]);

  useEffect(() => {
    if (!apiToUse || !transfer || !balances) { return; }

    // eslint-disable-next-line no-void
    void transfer(formatted, balances.availableBalance).paymentInfo(formatted)
      .then((i) => setMaxFee(i?.partialFee)).catch(console.error);
  }, [apiToUse, formatted, transfer, balances]);

  const icon = (<Avatar
    alt={'logo'}
    src={theme.palette.mode === 'dark' ? send : isend}
    sx={{ height: '64px', width: '86px' }}
  />);

  const identicon = (
    <Identicon
      className='identityIcon'
      iconTheme={chain?.icon || 'polkadot'}
      // isExternal={isExternal}
      // onCopy={_onCopy}
      prefix={chain?.ss58Format ?? 42}
      size={25}
      value={formatted}
    />
  );

  const ChainLogo = (
    <Avatar
      alt={'logo'}
      src={getLogo(chain)}
      sx={{ height: 25, width: 25 }}
      variant='square'
    />
  );

  return (
    <Container disableGutters sx={{ px: '30px' }}>
      <Header address={address} genesisHash={genesisHash} icon={icon} preUrl={prevUrl}>
        <div style={{ fontWeight: 500, fontSize: '24px', lineHeight: '36px', letterSpacing: '-0.015em', textAlign: 'center' }}>
          {t('Send Fund')}
        </div>
        <div style={{ fontWeight: 700, fontSize: '11px', lineHeight: '25px', letterSpacing: '-0.015em', textAlign: 'center' }}>
          {t('On the same chain')}
        </div>
        <Divider sx={{ bgcolor: 'secondary.main', height: '2px', width: '81px', margin: 'auto' }} />
      </Header>
      <div style={{ fontSize: '16px', fontWeight: 300, paddingTop: '15px', letterSpacing: '-0.015em' }}>
        {t('From Account')}:
      </div>
      <Grid alignItems='center' container justifyContent='space-between' sx={{ pt: '7px', fontWeight: 300, letterSpacing: '-0.015em' }}>
        <Grid item mt='7px' xs={1}>
          {identicon}
        </Grid>
        <Grid item sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '26px', pl: '10px' }} xs={7}>
          {accountName}
        </Grid>
        <Grid item sx={{ textAlign: 'right' }} xs={4}>
          <ShortAddress address={formatted} addressStyle={{ fontSize: '18px' }} />
        </Grid>
      </Grid>
      <Grid alignItems='center' container>
        <Grid item mt='5px' xs={1}>
          {ChainLogo}
        </Grid>
        <Grid container item sx={{ pl: '10px', fontWeight: 300, letterSpacing: '-0.015em' }} xs={11}>
          <Grid alignItems='center' container item justifyContent='space-between'>
            <Grid item sx={{ fontSize: '14px' }}>
              {t('Available balance')}
            </Grid>
            <Grid item sx={{ fontSize: '18px' }}>
              <ShowBalance api={apiToUse} balance={balances?.availableBalance} />
            </Grid>
          </Grid>
          <Grid container item justifyContent='space-between' sx={{ lineHeight: '15px' }}>
            <Grid item sx={{ fontSize: '14px' }}>
              {t('Fee')}
            </Grid>
            <Grid item sx={{ fontSize: '18px' }}>
              <ShowBalance api={apiToUse} balance={fee} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '5px' }} />
      <div style={{ fontSize: '16px', fontWeight: 300, paddingTop: '7px', letterSpacing: '-0.015em' }}>
        {t('To')}:
      </div>
      <To address={recepient} setAddress={setRecepient} />
      <Grid item sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '38px', fontSize: '24px', fontWeight: 300, letterSpacing: '-0.015em' }} xs={12}>
        {recepientName}
      </Grid>
      <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '5px' }} />
      <div style={{ fontSize: '16px', fontWeight: 300, paddingTop: '8px', letterSpacing: '-0.015em' }}>
        {t('Amount')}:
      </div>
      <Amount setValue={setAmount} token={apiToUse?.registry?.chainTokens[0]} value={amount} />
      <Grid container sx={{ fontSize: '16px', fontWeight: 300, letterSpacing: '-0.015em', mt: '13px' }}>
        <Grid item onClick={() => setWholeAmount('all')} sx={{ textDecorationLine: 'underline', cursor: 'pointer' }}>
          {t('All amount')}
        </Grid>
        <Grid item px='10px'>
          <Divider orientation='vertical' sx={{ m: 'auto', height: '28px', width: '2px', borderColor: 'primary.main' }} />
        </Grid>
        <Grid item onClick={() => setWholeAmount('max')} sx={{ textDecorationLine: 'underline', cursor: 'pointer' }}>
          {t('Max amount')}
        </Grid>
      </Grid>
      <Button _disabled={!recepient} _onClick={goToReview} style={{ mt: '15px' }} title={t('Next')} />

    </Container>
  );
}
