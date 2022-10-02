// Copyright 2019-2022 @polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { ThemeOptions } from '@mui/material';
import { blue,grey, red } from '@mui/material/colors';

import { baseTheme } from './baseTheme';

export const lightTheme: ThemeOptions = {
  ...baseTheme,
  palette: {
    action: { active: '#000' },
    background: { default: '#E8E0E5', paper: '#fff' },
    mode: 'light',
    primary: { main: '#000000' },
    secondary: grey,
    text: { primary: '#000', secondary: '#99004F' }
  }
};
