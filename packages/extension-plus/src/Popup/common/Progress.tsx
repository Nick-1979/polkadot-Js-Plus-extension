// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CircularProgress, Grid } from '@mui/material';
import React from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';

interface Props {
  title: string;
}

export default function Progress({ title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container direction='column' alignItems='center' justifyContent='center' sx={{ paddingTop: '40px' }} >
      <Grid item>
        <CircularProgress />
      </Grid>
      <Grid item sx={{ fontSize: 13, paddingTop: '20px' }}>
        {title}
      </Grid>
    </Grid>
  );
}
