// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { Avatar, Grid, IconButton, useTheme } from '@mui/material';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { SHORT_ADDRESS_CHARACTERS } from '../util/constants';
import { copy, icopy } from '../assets/icons';

interface Props {
  address: string | AccountId | undefined;
  charsCount?: number;
  addressStyle?: any;
  showCopy?: boolean;
  inParentheses?: boolean;
}

export default function ShortAddress({ address, charsCount = SHORT_ADDRESS_CHARACTERS, addressStyle = {}, showCopy = false, inParentheses = false }: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <Grid alignItems='center' container justifyContent='center' sx={addressStyle}>
      <Grid item pr={showCopy ? 1 : 0}>
        {inParentheses ? '(' : ''}{address?.slice(0, charsCount)}...{address?.slice(-charsCount)}{inParentheses ? ')' : ''}
      </Grid>
      {showCopy &&
        <Grid item>
          <CopyToClipboard text={String(address)}>
            <IconButton
              sx={{ p: '0px', mb: '4px' }}
            >
              <Avatar
                alt={'copy'}
                src={theme.palette.mode === 'dark' ? copy : icopy}
                sx={{ height: '20px', width: '20px' }}
                variant='square'
              />
            </IconButton>
          </CopyToClipboard>

        </Grid>
      }
    </Grid>
  );
}
