// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { Grid } from '@mui/material';
import React from 'react';

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { SHORT_ADDRESS_CHARACTERS } from '../util/constants';

interface Props {
  address: string | AccountId;
  charsCount?: number;
  addressStyle?: any;
  showCopy: boolean;
}

export default function ShortAddress({ address, charsCount = SHORT_ADDRESS_CHARACTERS, addressStyle = {}, showCopy = false }: Props): React.ReactElement {
  return (
    <Grid container sx={addressStyle} justifyContent='center' spacing={1}>
      <Grid item>
        {address.slice(0, charsCount)}...{address.slice(-charsCount)}
      </Grid>
      <Grid item>
        <FileCopyOutlinedIcon sx={{ fontSize: '20px', pt: '5px' }} />
      </Grid>
    </Grid>
  );
}
