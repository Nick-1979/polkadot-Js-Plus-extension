// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountWithChildren } from '@polkadot/extension-base/background/types';

import { Container } from '@mui/material';
import React from 'react';

import PAccount from './PAccount';

interface Props extends AccountWithChildren {
  parentName?: string;
}

export default function AccountsTree({ parentName, suri, ...account }: Props): React.ReactElement<Props> {
  return (
    <Container disableGutters>
      <PAccount
        {...account}
        parentName={parentName}
        suri={suri}
      />
      {account?.children?.map((child, index) => (
        <AccountsTree
          key={`${index}:${child.address}`}
          {...child}
          parentName={account.name}
        />
      ))}
    </Container>
  );
}
