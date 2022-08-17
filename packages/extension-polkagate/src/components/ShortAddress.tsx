// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { SHORT_ADDRESS_CHARACTERS } from '../util/constants';

interface Props {
  address: string | AccountId;
  charsCount?: number;
  addressStyle?: any;
}

export default function ShortAddress({ address, charsCount = SHORT_ADDRESS_CHARACTERS, addressStyle = {} }: Props): React.ReactElement {
  return (
    <span style={addressStyle}>
      {address.slice(0, charsCount)}...{address.slice(-charsCount)}
    </span>
  );
}
