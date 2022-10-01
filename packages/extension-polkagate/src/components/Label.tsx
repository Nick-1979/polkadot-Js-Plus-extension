// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  label: string;
}

function Label ({ children, className, label }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default styled(Label)(() => `
  label {
    font-size: 14px;
    font-weight: 300;
    padding-left: 23px;
    text-transform: none;
  }
`);
