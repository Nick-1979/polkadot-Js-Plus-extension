// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens send review page
 * */


import { Avatar, Container, Divider, Grid, useTheme } from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useLocation } from 'react-router-dom';

import { Identicon } from '@polkadot/extension-ui/components';

import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Button, Header, Password, ShortAddress } from '../../components';
import getLogo from '../../util/getLogo';
import { isend, send } from '../../util/icons';
import { FormattedAddressState } from '../../util/types';

export default function Send(): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const { address, formatted, genesisHash } = useParams<FormattedAddressState>();
  const location = useLocation();
  const chain = useMetadata(genesisHash, true);
  const { accounts } = useContext(AccountContext);
  const [password, setPassword] = useState<string | undefined>();

  const prevUrl = `/send/${genesisHash}/${address}/${formatted}/`;
  const accountName = useMemo(() => accounts?.find((a) => a.address === address)?.name, [accounts, address]);

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
          {t('Review')}
        </div>
        <Divider sx={{ bgcolor: 'secondary.main', height: '2px', width: '81px', margin: 'auto' }} />
      </Header>
      <Grid alignItems='top' container justifyContent='center' sx={{ fontWeight: 400, letterSpacing: '-0.015em' }}>
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
      <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '5px' }} />
      <Grid alignItems='top' container justifyContent='center' sx={{ fontWeight: 400, letterSpacing: '-0.015em' }}>
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
      <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '15px' }} />
      <Grid alignItems='top' container justifyContent='center' sx={{ fontWeight: 400, letterSpacing: '-0.015em' }}>
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
      <Divider sx={{ bgcolor: 'secondary.main', height: '1px', mt: '5px' }} />
      <Grid item sx={{ fontSize: '16px', paddingTop: '15px' }} xs={4}>
        {t('Password')}:
      </Grid>
      <Password setValue={setPassword} value={password} />

      <Button style={{ mt: '15px' }} title={t('Send')} />

    </Container >
  );
}
