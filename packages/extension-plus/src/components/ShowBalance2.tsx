// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description  this componet is used to show an account balance in some pages like contributeToCrowdloan
 * */
import type { Balance } from '@polkadot/types/interfaces';
import type { BN } from '@polkadot/util';
import type { ThemeProps } from '../../../extension-ui/src/types';

import { Grid, GridDirection, Menu, MenuItem, Paper, Skeleton } from '@mui/material';
import { ResponsiveStyleValue } from '@mui/system';
import React from 'react';
import styled from 'styled-components';

import { ApiPromise } from '@polkadot/api';

import FormatBalance from './FormatBalance';

export interface Props {
  balance: Balance | BN | bigint | string | number | null | undefined;
  api: ApiPromise | undefined;
  title?: string;
  direction?: ResponsiveStyleValue<GridDirection> | undefined;
}

function ShowBalance2({ api, balance, direction = 'column', title }: Props): React.ReactElement<Props> {
  return (
    <Grid alignItems='center' container data-testid='ShowBalance2' direction={direction} justifyContent='space-between'>
      {title && <>
        <Grid item sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.8px', lineHeight: '16px' }}>
          {title}
        </Grid>
      </>}
      <Grid item>
        {balance !== undefined && api
          ? <FormatBalance api={api} value={balance} />
          : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
        }
      </Grid>

    </Grid>
  );
}

export default styled(ShowBalance2)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
      `);
