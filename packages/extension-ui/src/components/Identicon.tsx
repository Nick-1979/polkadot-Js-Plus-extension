// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconTheme } from '@polkadot/react-identicon/types';
import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import Icon from '@polkadot/react-identicon';

interface Props {
  className?: string;
  iconTheme?: IconTheme;
  isExternal?: boolean | null;
  onCopy?: () => void;
  prefix?: number;
  value?: string | null;
  size?: number;
}

export default function Identicon({ className, iconTheme, onCopy, prefix, size = 58, value }: Props): React.ReactElement<Props> {
  return (
    <Icon
      className='icon'
      onCopy={onCopy}
      prefix={prefix}
      size={size}
      theme={iconTheme}
      value={value}
    />
  );
}

// export default styled(Identicon)(({ theme }: ThemeProps) => `
//   background: rgba(192, 192, 292, 0.25);
//   border-radius: 50%;
//   display: flex;
//   justify-content: center;

//   .container:before {
//     box-shadow: none;
//     background: '#F4F5F8';
//   }

//   svg {
//     circle:first-of-type {
//       display: none;
//     }
//   }
// `);
