// Copyright 2019-2022 @polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { ThemeOptions } from '@mui/material';
import { red, grey, blue } from '@mui/material/colors';
import { baseTheme } from './baseTheme';

export const lightTheme: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: { main: '#000000' },
    secondary: grey,
  }
};