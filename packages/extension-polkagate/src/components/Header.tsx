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
import React, { useContext, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { ActionContext, SettingsContext } from '../../../extension-ui/src/components/contexts';

interface Props {
  address: string;
  children?: React.ReactNode;
  genesisHash: string;
  icon: React.node;
  preUrl: string;
  state?: any;
}

export default function Header({ address, children, icon, genesisHash, preUrl = '/', state = {} }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);// added for plus
  const history = useHistory();

  const gotoPreUrl = useCallback(() => {
    history.push({
      pathname: preUrl,
      state
    });
  }, [history, preUrl, state]);

  return (
    <>
      <Grid container alignItems='center' justifyContent='space-between' pt='26px'>
        <Grid item>
          <IconButton
            aria-label='menu'
            color='inherit'
            edge='start'
            onClick={gotoPreUrl}
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