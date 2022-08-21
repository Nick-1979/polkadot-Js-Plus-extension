// Copyright 2019-2022 @polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import DarkIcon from '@mui/icons-material/Brightness4';
import LightIcon from '@mui/icons-material/Brightness7';
import { Box, IconButton, useTheme } from '@mui/material';
import React from 'react';

import { ColorContext } from './ColorContext';

export const SwitchModeButton = () => {
  const theme = useTheme();
  const colorMode = React.useContext(ColorContext);

  return (
    <Box
      sx={{
        display: 'flex',
        // minHeight: '10vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'left'
      }}
    >

      <IconButton
        color='primary'
        onClick={colorMode.toggleColorMode}
        sx={{ ml: 1 }}
      >
        {theme.palette.mode === 'dark' ? <LightIcon /> : <DarkIcon />}
      </IconButton>
      {theme.palette.mode} mode
    </Box>
  );
};
