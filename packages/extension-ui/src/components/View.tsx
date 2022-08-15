// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import { CssBaseline, PaletteMode, ThemeProvider, createTheme } from '@mui/material';
import { darkTheme as dark } from '../themes/dark';
import { lightTheme as light } from '../themes/light';
import { ColorContext } from '.';



// FIXME We should not import from index when this one is imported there as well
import { AvailableThemes, chooseTheme, Main, themes, ThemeSwitchContext } from '.';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function View({ children, className }: Props): React.ReactElement<Props> {
  // const [theme, setTheme] = useState(chooseTheme());

  // const switchTheme = useCallback(
  //   (theme: AvailableThemes): void => {
  //     console.log('themethemetheme', theme)
  //     localStorage.setItem('theme', theme);
  //     setTheme(theme);
  //   },
  //   []
  // );
  const [mode, setMode] = React.useState<PaletteMode>('dark');

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === 'light' ? 'dark' : 'light'
        );
      },
    }),
    []
  );

  const theme = React.useMemo(
    () => createTheme(mode === 'light' ? light : dark),
    [mode]
  );



  // const _theme = theme === 'light' ? light : dark;

  return (
    <ColorContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <BodyTheme theme={theme} />
        <Main className={className}>
          {children}
        </Main>
      </ThemeProvider>
    </ColorContext.Provider>
  );
}

const BodyTheme = createGlobalStyle<ThemeProps>`
  body {
    background-color: ${({ theme }: ThemeProps): string => theme.primary};
  }

  html {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export default View;
