// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { ThemeProps } from '../../../extension-ui/src/types';

import React from 'react';
import ReactTooltip, { TooltipProps } from 'react-tooltip';
import styled from 'styled-components';

export interface Props {
  children: React.ReactNode;
  effect?: TooltipProps['effect'];
  tip: string;
  place?: TooltipProps['place'];
  id: string;
}

function Hint({ children, effect = 'solid', id, place = 'right', tip }: Props): React.ReactElement<Props> {
  return (
    <>
      <a
        data-for={id}
        data-iscapture='true'
        data-tip={tip}
      >

        {children}

      </a>
      <ReactTooltip
        effect={effect}
        id={id}
        multiline={true}
        place={place}
      />
    </>

  );
}

export default styled(Hint)(({ theme }: ThemeProps) => `
  background: ${theme.accountBackground};
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  position: relative;
`);
