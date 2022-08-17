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

  const AccountBrief = () => (
    <Grid item justifyContent='cnter'>
      <Identicon
        className='identityIcon'
        iconTheme={chain?.icon || 'polkadot'}
        // isExternal={isExternal}
        // onCopy={_onCopy}
        prefix={chain?.ss58Format ?? 42}
        size={58}
        value={formatted}
      />
      <Typography> {name}</Typography>
      <ShortAddress address={formatted} />

    </Grid>
  );

  return (
    <Container>
      <Header address={address} genesisHash={genesisHash} >
        <AccountBrief />
      </Header>

    </Container>
  );
}