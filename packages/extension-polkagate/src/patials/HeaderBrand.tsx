// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowBackIos as ArrowBackIosIcon, Close as CloseIcon, Menu as MenuIcon } from '@mui/icons-material';
import { Box, Container, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';

import Link from '../../../extension-ui/src/components/Link';
import useOutsideClick from '../../../extension-ui/src/hooks/useOutsideClick';
import MenuSettings from '../../../extension-ui/src/partials/MenuSettings';
import { logoBlack, logoWhite } from '../assets/logos';

interface Props {
  showBackArrow?: boolean;
  showSettings?: boolean;
  text?: React.ReactNode;
}

function HeaderBrand({ showBackArrow, showSettings, text }: Props): React.ReactElement<Props> {
  const [isAddOpen, setShowAdd] = useState(false);
  const [isSettingsOpen, setShowSettings] = useState(false);
  const addIconRef = useRef(null);
  const addMenuRef = useRef(null);
  const setIconRef = useRef(null);
  const setMenuRef = useRef(null);
  const theme = useTheme();

  useOutsideClick([addIconRef, addMenuRef], (): void => {
    isAddOpen && setShowAdd(!isAddOpen);
  });

  useOutsideClick([setIconRef, setMenuRef], (): void => {
    isSettingsOpen && setShowSettings(!isSettingsOpen);
  });

  const _toggleSettings = useCallback(
    () => setShowSettings((isSettingsOpen) => !isSettingsOpen),
    []
  );

  return (
    <Container sx={{
      background: showBackArrow ? 'transparent' : 'radial-gradient(88.81% 88.81% at 50% 50.75%, #99004F 0%, rgba(153, 0, 79, 0) 100%)',
      borderBottom: '0.5px solid #BA2882',
      lineHeight: 0,
      p: '18px 30px 11px'
    }}
    >
      <Grid
        alignItems='center'
        container
        justifyContent='space-between'
      >
        <Grid item>
          {showBackArrow
            ? <Link
              className='backlink'
              to='/'
            >
              <ArrowBackIosIcon sx={{ color: '#BA2882', fontSize: 25, stroke: '#BA2882', strokeWidth: 1.5 }} />
            </Link>
            : <Box
              component='img'
              src={theme.palette.mode === 'dark' ? logoWhite : logoBlack}
              sx={{ height: 38, width: 38 }}
            />
          }
        </Grid>
        <Grid item>
          <Typography
            color='#fff'
            sx={{ fontSize: showBackArrow ? '20px' : '30px', letterSpacing: '-0.015em' }}
            variant={showBackArrow ? 'h3' : 'h1'}
          >
            {text}
          </Typography>
        </Grid>
        <Grid
          item
          sx={{ height: '38px', visibility: !showSettings ? 'hidden' : 'visible' }}
        >
          <IconButton
            aria-label='menu'
            color='inherit'
            edge='start'
            onClick={_toggleSettings}
            size='small'
            sx={{ p: 0 }}
          >
            {!isSettingsOpen
              ? <MenuIcon sx={{ color: '#fff', fontSize: 38 }} />
              : <CloseIcon sx={{ color: '#fff', fontSize: 38 }} />}
          </IconButton>
        </Grid>
      </Grid>
      {
        isSettingsOpen && (
          <MenuSettings reference={setMenuRef} />
        )
      }
    </Container >
  );
}

export default React.memo(HeaderBrand);
