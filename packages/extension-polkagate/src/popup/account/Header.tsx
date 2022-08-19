// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens social recovery index page to choose between configuring your account and rescuing other account
 * */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { ArrowBackIosNewRounded as BackIcon, Menu as MenuIcon } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import React, { useContext } from 'react';

import { ActionContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';

interface Props {
  address: string;
  children?: React.ReactNode;
  genesisHash: string;
  icon: React.node;
}

export function Header({ address, children, icon, genesisHash }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const settings = useContext(SettingsContext);
  const chain = useMetadata(genesisHash, true);
  const onAction = useContext(ActionContext);// added for plus

  return (
    <>
      <Grid container alignItems='center' justifyContent='space-between' pt='26px'>
        <Grid item>
          <IconButton
            aria-label='menu'
            color='inherit'
            edge='start'
            onClick={() => onAction('/')}
            size='small'
            sx={{ p: '0px' }}
          >
            <BackIcon sx={{ color: 'secondary.main', fontSize: '24px' }} />
          </IconButton>
        </Grid>
        <Grid item textAlign='center'>
          {icon}
        </Grid>
        <Grid item>
          <IconButton
            aria-label='menu'
            color='inherit'
            edge='start'
            // onClick={_toggleSettings}
            size='small'
            sx={{ p: '0px' }}
          >
            <MenuIcon sx={{ color: 'secondary.main', fontSize: 40 }} />
          </IconButton>
        </Grid>
      </Grid>
      {children}
    </>
  );
}