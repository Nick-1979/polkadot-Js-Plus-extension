// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CircularProgress, Grid } from '@mui/material';
import React from 'react';

interface Props {
  title: string;
  pt?: number | string;
}

function Progress({ pt = '50px', title }: Props): React.ReactElement<Props> {
  return (
    <Grid
      alignItems='center'
      container
      direction='column'
      justifyContent='center'
      pt={pt}
    >
      <Grid item>
        <CircularProgress
          color='warning'
          thickness={2}
        />
      </Grid>
      <Grid
        item
        sx={{ fontSize: 13, paddingTop: '20px' }}
      >
        {title}
      </Grid>
    </Grid>
  );
}

export default React.memo(Progress);
