// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Grid } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';

interface Props extends ThemeProps {
  className?: string;
}


function Governance({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header
        showBackArrow
        smallMargin
        text={t<string>('Governance')}
      />
      <Grid container id='selectRelyChain' sx={{ padding: '5px 35px' }}>
      </Grid>

    </>
  );
}

export default styled(Governance)`
  height: calc(100vh - 2px);
  overflow: auto;
  scrollbar - width: none;

  &:: -webkit - scrollbar {
    display: none;
    width:0,
  }
  .empty-list {
    text-align: center;
  }
`;
