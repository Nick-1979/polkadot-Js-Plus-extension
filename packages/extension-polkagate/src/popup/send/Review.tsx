// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens send review page
 * */

import { Avatar, Container, Divider, Grid, useTheme } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useLocation } from 'react-router-dom';

import { Identicon } from '@polkadot/extension-ui/components';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Button, Header, Password, ShortAddress } from '../../components';
import getLogo from '../../util/getLogo';
import { isend, send as sendIcon } from '../../util/icons';
import { FormattedAddressState } from '../../util/types';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto'; // added for plus
import { AccountsStore } from '@polkadot/extension-base/stores'; // added for plus
import {
  ChasingDots,
  Circle,
  CubeGrid,
  DoubleBounce,
  FadingCircle,
  FoldingCube,
  Pulse,
  RotatingPlane,
  ThreeBounce,
  WanderingCubes,
  Wave
} from 'better-react-spinkit'

export default function Send(): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const { address, formatted, genesisHash } = useParams<FormattedAddressState>();
  const location = useLocation();
  const onAction = useContext(ActionContext);
  const chain = useMetadata(genesisHash, true);
  const { accounts } = useContext(AccountContext);
  const [password, setPassword] = useState<string | undefined>();
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const prevUrl = `/send/${genesisHash}/${address}/${formatted}/`;
  const accountName = useMemo(() => accounts?.find((a) => a.address === address)?.name, [accounts, address]);

  const icon = (<Avatar
    alt={'logo'}
    src={theme.palette.mode === 'dark' ? sendIcon : isend}
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

  useEffect(() => {
    !location?.state?.amount && onAction(prevUrl);
  }, [location, onAction, prevUrl]);

  useEffect(() => {
    cryptoWaitReady()
      .then((): void => {
        console.log('keyring is loading');

        // load all the keyring data
        keyring.loadAll({ store: new AccountsStore() });

        console.log('keyring load completed');
      })
      .catch((error): void => {
        console.error('keyring load failed', error);
      });
  }, []);

  const send = useCallback(() => {
    try {
      const signer = keyring.getPair(formatted);

      signer.unlock(password);

      //1. checkPassword
      setIsConfirming(true);
      //2. send transaction
    } catch (e) {
      console.log('error:', e);
    }
  }, [formatted, password]);

  return (
    <Container disableGutters sx={{ px: '30px' }}>
      <Header address={address} genesisHash={genesisHash} icon={icon} preUrl={prevUrl} state={location?.state}>
        <div style={{ fontWeight: 500, fontSize: '24px', lineHeight: '36px', letterSpacing: '-0.015em', textAlign: 'center' }}>
          {t('Send Fund')}
        </div>
        <div style={{ fontWeight: 700, fontSize: '11px', lineHeight: '25px', letterSpacing: '-0.015em', textAlign: 'center' }}>
          {isConfirming ? t('Confirmation') : t('Review')}
        </div>
        <Divider sx={{ bgcolor: 'secondary.main', height: '2px', width: '81px', margin: 'auto' }} />
      </Header>
      {!isConfirming &&
        <>
          <Grid alignItems='top' container justifyContent='center' sx={{ fontWeight: 300, letterSpacing: '-0.015em' }}>
            <Grid item sx={{ fontSize: '16px', paddingTop: '15px' }} xs={4}>
              {t('From')}:
            </Grid>
            <Grid alignItems='center' container item sx={{ pt: '15px' }} xs={8}>
              <Grid item mt='7px' xs={1.5}>
                {identicon}
              </Grid>
              <Grid item sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '26px', pl: '8px' }} xs={10.5}>
                {accountName}
              </Grid>
              <Grid item>
                <ShortAddress address={formatted} addressStyle={{ fontSize: '16px' }} />
              </Grid>
            </Grid>
          </Grid>
          <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '8px' }} />
          <Grid alignItems='top' container justifyContent='center' sx={{ fontWeight: 300, letterSpacing: '-0.015em' }}>
            <Grid item sx={{ fontSize: '16px', paddingTop: '15px' }} xs={4}>
              {t('Amount')}:
            </Grid>
            <Grid alignItems='center' container item sx={{ pt: '15px' }} xs={8}>
              <Grid item xs={1.5}>
                {ChainLogo}
              </Grid>
              <Grid item sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '26px', pl: '8px' }} xs={10.5}>
                {location?.state?.amount} {location?.state?.api?.registry?.chainTokens[0]}
              </Grid>
              <Grid container item pt='10px'>
                <Grid item sx={{ fontSize: '14px', pr: '8px' }}>
                  {t('Fee')}:
                </Grid>
                <Grid item sx={{ fontSize: '16px' }}>
                  {location?.state?.fee?.toHuman()}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '8px' }} />
          <Grid alignItems='top' container justifyContent='center' sx={{ fontWeight: 300, letterSpacing: '-0.015em' }}>
            <Grid item sx={{ fontSize: '16px', paddingTop: '15px' }} xs={4}>
              {t('To')}:
            </Grid>
            <Grid alignItems='center' container item sx={{ pt: '15px' }} xs={8}>
              {/* <Grid item mt='7px'pr='8px' xs={1.5}>
            {identicon}
          </Grid> */}
              <Grid item sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '26px' }} xs={10.5}>
                {location?.state?.recepientName}
              </Grid>
              <Grid item>
                <ShortAddress address={location?.state?.recepient} addressStyle={{ fontSize: '16px' }} />
              </Grid>
            </Grid>
          </Grid>
          <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '8px' }} />
          <Grid item sx={{ fontSize: '16px', paddingTop: '15px' }} xs={4}>
            {t('Password')}:
          </Grid>
          <Password setValue={setPassword} value={password} />
          <Button _disabled={isConfirming} _onClick={send} style={{ mt: '20px' }} title={t('Send')} />
        </>}
      {isConfirming &&
        <>
          <Grid container justifyContent='center' pt='14px'>
            <Circle color='#E30B7B' size={86} scaleEnd={0.7} scaleStart={0.4} />
          </Grid>
          <Grid alignItems='center' container justifyContent='center' sx={{ fontWeight: 300, letterSpacing: '-0.015em', pt: '20px' }}>
            <Grid item sx={{ fontSize: '16px', maxWidth: '20%' }}>
              {t('From')}:
            </Grid>
            <Grid item sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '16px', pl: '8px', maxWidth: '40%', width: 'fit-content' }}>
              {accountName}
            </Grid>
            <Grid item xs={{ maxWidth: '30%', pl: '5px' }}>
              <ShortAddress address={formatted} addressStyle={{ fontSize: '16px' }} inParentheses />
            </Grid>
          </Grid>
          <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '8px' }} />
        </>}

    </Container>
  );
}
