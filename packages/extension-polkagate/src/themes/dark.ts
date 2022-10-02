// Copyright 2019-2022 @polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable sort-keys */

import { ThemeOptions } from '@mui/material';
import { blue, grey, red } from '@mui/material/colors';

import { baseTheme } from './baseTheme';

export const darkTheme: ThemeOptions = {
  ...baseTheme,

  palette: {
    mode: 'dark',
    primary: { main: '#99004F' },
    secondary: { main: '#E30B7B' },
    background: { default: '#180710', paper: '#000000' },
    text: { primary: '#FFFFFF', secondary: '#fff' },
    action: { disabled: '#fff', disabledBackground: '#4B4B4B' }
  }
};
