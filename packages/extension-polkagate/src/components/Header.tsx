// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens social recovery index page to choose between configuring your account and rescuing other account
 * */

import { ArrowBackIosNewRounded as BackIcon, Menu as MenuIcon } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import React, { useContext } from 'react';

import { ActionContext, SettingsContext } from '../../../extension-ui/src/components/contexts';

interface Props {
  address: string;
  children?: React.ReactNode;
  genesisHash: string;
  icon: React.node;
  preUrl: string;
}

export default function Header({ address, children, icon, genesisHash, preUrl = '/' }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);// added for plus

  return (
    <>
      <Grid container alignItems='center' justifyContent='space-between' pt='26px'>
        <Grid item>
          <IconButton
            aria-label='menu'
            color='inherit'
            edge='start'
            onClick={() => onAction(preUrl)}
            size='small'
            sx={{ p: '0px' }}
          >
            <BackIcon sx={{ color: 'secondary.main', fontSize: '30px' }} />
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