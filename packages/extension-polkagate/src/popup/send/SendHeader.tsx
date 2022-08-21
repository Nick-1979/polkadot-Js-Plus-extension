// Copyright 2019-2022 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component 
 * */

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Divider, Grid, Typography } from '@mui/material';
import React, { } from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ShortAddress } from '../../components';
import { send, isend, receive, stake, history, refresh, ireceive, istake, ihistory, irefresh } from '../../util/icons';

interface Props {
  accountName: string | undefined;
  formatted: string
}

export default function SendHeader({ accountName, formatted }: Props): React.ReactElement<Props> {
  const theme = useTheme();

  return (
    <Grid item textAlign='center'>
      <Grid alignItems='center' container justifyContent='center' spacing={1.2}>
        <Grid item>
      
        </Grid>
        <Grid item>
        </Grid>
      </Grid>
      <ShortAddress address={formatted} addressStyle={{ fontSize: '11px', fontWeight: 400, letterSpacing: '-0.015em' }} charsCount={13} showCopy />
      <Divider sx={{ bgcolor: 'secondary.main', height: '2px', mx: '40px' }} />
    </Grid>
  );
}
