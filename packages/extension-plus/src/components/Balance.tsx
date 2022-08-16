// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/** This component shows balances including a title, fund in crypto and equivalent in USD
 *  for different type of anaccount balance  (i.e., Total, Available, and Reserved) */

import type { ThemeProps } from '../../../extension-ui/src/types';

import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { FLOATING_POINT_DIGIT } from '../util/constants';
import { AccountsBalanceType } from '../util/plusTypes';
import { balanceToHuman } from '../util/plusUtils';

export interface Props {
  balance: AccountsBalanceType | null;
  type?: string;
  className?: string;
  price?: number;
}

export default function Balance({ balance, price, type }: Props): React.ReactElement<Props> {
  const balString = balanceToHuman(balance, 'total', FLOATING_POINT_DIGIT);
  const bal = balString === ('' || '0') ? 0 : Number(balString);

  return (
    <>
      {balance === null
        ? <Skeleton sx={{ fontWeight: 'bold', width: '70px', lineHeight: '16px' }} />
        : <div style={{ fontWeight: 400, fontSize: '20px', letterSpacing: '-0.015em' }}>
          {bal.toLocaleString() === '0' ? '0.00' : bal.toLocaleString()}{' '}  {balance && balance?.balanceInfo?.coin}
        </div>
      }
    </>
  );
}

// export default styled(Balance)(({ theme }: ThemeProps) => `
//       background: ${theme.accountBackground};
//       border: 1px solid ${theme.boxBorderColor};
//       box-sizing: border-box;
//       border-radius: 4px;
//       margin-bottom: 8px;
//       position: relative;
// `);
