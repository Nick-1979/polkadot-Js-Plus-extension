// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  this componet is used to show a value, if not loaded shows skelton
 * */

import type { ThemeProps } from '../../../extension-ui/src/types';

import { Grid, GridDirection, Skeleton } from '@mui/material';
// import { ResponsiveStyleValue } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

export interface Props {
  value: string | number | null | undefined;
  unit?: string;
  title?: string;
  direction?: ResponsiveStyleValue<GridDirection> | undefined;
}

function ShowValue({ direction = 'row', title, unit, value }: Props): React.ReactElement<Props> {
  return (
    <Grid container direction={direction} item justifyContent='space-between' xs={12}>
      {title &&
        <Grid item>
          {title}
        </Grid>
      }
      <Grid item>
        {value !== undefined && value !== null
          ? <>
            {value}{' '}{unit}
          </>
          : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
        }
      </Grid>
    </Grid>
  );
}

export default styled(ShowValue)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
`);
