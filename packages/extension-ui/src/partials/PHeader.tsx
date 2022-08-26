// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faArrowLeft, faCog, faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MenuIcon from '@mui/icons-material/Menu';
import { Avatar,Box,Container,Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import {logoWhite, logoBlack} from '../../../extension-polkagate/src/assets/logos/';
import InputFilter from '../components/InputFilter';
import Link from '../components/Link';
import useOutsideClick from '../hooks/useOutsideClick';
import useTranslation from '../hooks/useTranslation';
import MenuAdd from './MenuAdd';
import MenuSettings from './MenuSettings';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  onFilter?: (filter: string) => void;
  showAdd?: boolean;
  showBackArrow?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  smallMargin?: boolean;
  text?: React.ReactNode;
}

function Header({ children, className = '', onFilter, showAdd, showBackArrow, showSearch, showSettings, smallMargin = false, text }: Props): React.ReactElement<Props> {
  const [isAddOpen, setShowAdd] = useState(false);
  const [isSettingsOpen, setShowSettings] = useState(false);
  const [isSearchOpen, setShowSearch] = useState(false);
  const [filter, setFilter] = useState('');
  const { t } = useTranslation();
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

  const _toggleAdd = useCallback(
    () => setShowAdd((isAddOpen) => !isAddOpen),
    []
  );

  const _toggleSettings = useCallback(
    () => setShowSettings((isSettingsOpen) => !isSettingsOpen),
    []
  );

  const _onChangeFilter = useCallback(
    (filter: string) => {
      setFilter(filter);
      onFilter && onFilter(filter);
    },
    [onFilter]
  );

  const _toggleSearch = useCallback(
    (): void => {
      if (isSearchOpen) {
        _onChangeFilter('');
      }

      setShowSearch((isSearchOpen) => !isSearchOpen);
    },
    [_onChangeFilter, isSearchOpen]
  );

  return (
    <Container sx={{pt:'28px'}}>
      <Grid alignItems='center' container justifyContent='space-between'>
        <Grid item>
          {showBackArrow
            ? <Link
              className='backlink'
              to='/'
            >
              <FontAwesomeIcon
                className='arrowLeftIcon'
                icon={faArrowLeft}
              />
            </Link>
            : <Box component='img' sx={{ height: 45, width: 45, pt:'5px' }} src={theme.palette.mode === 'dark' ? logoWhite : logoBlack} />
          }

        </Grid>
        <Grid item >
          <Typography color='secondary' sx={{fontStyle: 'italic', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.015em'}}>
            {text}
          </Typography>
        </Grid>
        <Grid item>
          {showSettings && (
            <IconButton
              aria-label='menu'
              color='inherit'
              edge='start'
              onClick={_toggleSettings}
              size='small'
            >
              <MenuIcon sx={{ color:'secondary.main', fontSize: 40 }} />
            </IconButton>
          )}
        </Grid>
      </Grid>
      {
        isAddOpen && (
          <MenuAdd reference={addMenuRef} />
        )
      }
      {
        isSettingsOpen && (
          <MenuSettings reference={setMenuRef} />
        )
      }
      {children}
    </Container>
  );
}

export default React.memo(Header);

// export default React.memo(styled(Header)(({ theme }: Props) => `
//   max-width: 100%;
//   box-sizing: border-box;
//   font-weight: normal;
//   margin: 0;
//   position: relative;
//   margin-top: 25px;
//   margin-bottom: 13px;

//   && {
//     padding: 0 0 0;
//   }

//   > .container {
//     display: flex;
//     justify-content: space-between;
//     width: 100%;
//     // border-bottom: 1px solid ${theme.inputBorderColor};
//     // min-height: 50px;

//     .branding {
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       color: ${theme.info};
//       font-family: ${theme.fontFamily};
//       text-align: center;
//       margin-left: 24px;

//       .logo {
//         height: 45px;
//         width: 45px;
//         // margin: 8px 12px 12px 0;
//       }
//     }
    
//     .logoText {
//       display: flex;
//       align-self: center;
//       color: ${theme.info};
//       font-family: ${theme.fontFamily};
//       font-style: italic;
//       font-weight: 700;
//       font-size: 20px;
//       line-height: 36px;
//       display: block;
//       letter-spacing: -0.015em;
//       }

//     .popupMenus, .searchBarWrapper {
//       align-self: center;
//     }

//     .searchBarWrapper {
//       flex: 1;
//       display: flex;
//       justify-content: end;
//       align-items: center;;

//       .searchIcon {
//         margin-right: 8px;

//         &:hover {
//           cursor: pointer;
//         }
//       }
//     }

//     .popupToggle {
//       display: inline-block;
//       vertical-align: middle;

//       &:last-child {
//         margin-right: 24px;
//       }

//       &:hover {
//         cursor: pointer;
//       }
//     }

//     .inputFilter {
//       width: 100%
//     }

//     .popupToggle+.popupToggle {
//       margin-left: 8px;
//     }
//   }

//   .plusIcon, .cogIcon, .searchIcon {
//     color: ${theme.iconNeutralColor};

//     &.selected {
//       color: ${theme.primary};
//     }
//   }

//   .arrowLeftIcon {
//     color: ${theme.labelColor};
//     margin-right: 1rem;
//   }

//   .backlink {
//     color: ${theme.labelColor};
//     min-height: 52px;
//     text-decoration: underline;
//     width: min-content;

//     &:visited {
//       color: ${theme.labelColor};
//     }
//   }

//   &.smallMargin {
//     margin-bottom: 15px;
//   }
// `));
