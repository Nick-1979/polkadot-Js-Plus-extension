// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CircularProgress, Grid } from '@mui/material';
import React from 'react';

interface Props {
  title: string;
}

function Progress({ title }: Props): React.ReactElement<Props> {

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

export default React.memo(Progress);