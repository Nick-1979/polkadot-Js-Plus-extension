// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { ThemeProps } from '../../../extension-ui/src/types';

import { Help as HelpIcon } from '@mui/icons-material';
import { Grid, Tooltip, TooltipProps } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

export interface Props {
  children?: React.ReactNode;
  tip: string;
  place?: TooltipProps['placement'];
  id?: string;
  icon?: boolean;
}

function Hint({ children, icon = false, id, place, tip }: Props): React.ReactElement<Props> {
  return (
    <Tooltip
      id={id}
      placement={place}
      title={tip}
    >
      <Grid
        container
        item
        spacing={icon ? 0.2 : 0}
      >
        <Grid item>
          {icon && <HelpIcon
            color='disabled'
            fontSize='small'
            sx={{ pr: '3px' }}
          />}
        </Grid>
        <Grid
          item
          sx={icon ? { pb: '7px' } : {}}
        >
          {children}
        </Grid>
      </Grid>
    </Tooltip>
  );
}

export default styled(Hint)(({ theme }: ThemeProps) => `
  background: ${theme.accountBackground};
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  position: relative;
`);
