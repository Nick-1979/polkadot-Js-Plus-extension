// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme } from '@mui/material/styles';
import styled, { css } from 'styled-components';

interface Props {
  withError?: boolean;
  theme?: Theme;
}
const TextBox = css(({ theme }: Props) => `
  background: ${theme.palette.background.paper};
  border-radius: 5px;
  border: 1px solid #BA2882;
  box-sizing: border-box;
  color: #FF46A0;
  display: block;
  font-size: 16px;
  min-height: 31px;
  padding: 12px;
  font-weight: 400;
  resize: none;
  width: 94%;
  margin: 6px auto;
  font-family: ${theme.typography.allVariants.fontFamily};
`);

export const TextArea = styled.textarea<Props>`${TextBox}`;
export const Input = styled.input<Props>`${TextBox} `;
