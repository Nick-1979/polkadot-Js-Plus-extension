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

export default function ShowBalance2({ api, balance }: Props): React.ReactElement<Props> {
  return (
    <>
      {balance !== undefined && api
        ? <FormatBalance api={api} value={balance} />
        : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
      }
    </>
  );
}
