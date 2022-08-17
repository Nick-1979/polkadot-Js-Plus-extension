// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens social recovery index page to choose between configuring your account and rescuing other account
 * */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Container, Grid, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { useParams } from 'react-router';

import { AccountContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { useApi, useEndpoint } from '../../hooks';
import { AddressState } from '../../util/types';
import { Header } from './Header';
import { Identicon } from '@polkadot/extension-ui/components';
import { ShortAddress } from '../../components';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

interface Props extends ThemeProps {
  className?: string;
}

export default function Account({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const settings = useContext(SettingsContext);
  const { accounts } = useContext(AccountContext);
  const { address, genesisHash, formatted } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const endpoint = useEndpoint(accounts, address, chain);
  const api = useApi(endpoint);

  const name = React.useMemo(() => accounts?.find((a) => a.address === address)?.name, [accounts, address]);

  const icon = (
    <Identicon
      className='identityIcon'
      iconTheme={chain?.icon || 'polkadot'}
      // isExternal={isExternal}
      // onCopy={_onCopy}
      prefix={chain?.ss58Format ?? 42}
      size={58}
      value={formatted}
    />
  );
  const AccountBrief = () => (
    <Grid item textAlign='center'>
      <Grid container alignItems='center' justifyContent='center' spacing={1.5}>
        <Grid item>
          <Typography sx={{ fontWeight: 500, fontSize: '24px', lineHeight: '36px', letterSpacing: '-0.015em' }}> {name}</Typography>
        </Grid>
        <Grid item >
          <VisibilityOutlinedIcon sx={{ fontSize: '22px', pt: '5px' }} />
        </Grid>
      </Grid>
      <ShortAddress showCopy address={formatted} charsCount={13} addressStyle={{ fontWeight: 400, fontSize: '11px', lineHeight: '32px', letterSpacing: '-0.015em' }} />
    </Grid>
  );

  return (
    <Container>
      <Header address={address} genesisHash={genesisHash} icon={icon}>
        <AccountBrief />
      </Header>

    </Container>
  );
}