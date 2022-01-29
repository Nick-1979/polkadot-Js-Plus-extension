// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { ThemeProps } from '../../../extension-ui/src/types';

import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { AccountsBalanceType } from '../util/plusTypes';
import { balanceToHuman } from '../util/plusUtils';

export interface Props {
  balance: AccountsBalanceType | null;
  type: string;
  className?: string;
  price: number;
}

function getCoin(_myBalance: AccountsBalanceType): string {
  return !_myBalance || !_myBalance.balanceInfo ? '' : _myBalance.balanceInfo.coin;
}

function Balance({ balance, price, type }: Props): React.ReactElement<Props> {
  const balString = balanceToHuman(balance, type);
  const bal = balString === ('' || '0') ? 0 : Number(balString);
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <>
      <span style={{ fontSize: 12, fontWeight: 500 }}>
        {label}: {' '}
      </span>

      {balance === null
        ? <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
        : <>
          <span style={{ fontSize: 11, fontWeight: 600 }}>
            {bal || '0.00'}{' '}
          </span>
        </>}

      <span style={{ fontSize: 12 }}>
        {balance && getCoin(balance)}
      </span>

      <div style={{ fontSize: 11 }}>
        $ {' '}{parseFloat(String(price * bal)).toFixed(2)}
      </div>

    </>
  );
}

export default styled(Balance)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
`);
