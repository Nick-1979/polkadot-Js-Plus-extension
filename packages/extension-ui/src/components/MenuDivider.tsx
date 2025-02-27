// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function MenuDivider ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className} />
  );
}

export default styled(MenuDivider)(({ theme }: Props) => `
padding-top: 10px; // added for plus 16->10
margin-bottom: 10px; // added for plus 16->10
  border-bottom: 1px solid ${theme.inputBorderColor};
`);
