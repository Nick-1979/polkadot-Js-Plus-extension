// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

// eslint-disable-next-line simple-import-sort/imports
import type { ThemeProps } from '../../../extension-ui/src/types';
import { Box, Grid, Skeleton } from '@mui/material';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';

import { balanceToHuman } from '../util/plusUtils';
import { AccountsBalanceType } from '../util/plusTypes';

export interface Props {
  balance: AccountsBalanceType | null;
  type: string;
  chain: Chain;
  className?: string;
  price: number;
}

function getCoin(_myBalance: AccountsBalanceType): string {
  return !_myBalance || !_myBalance.balanceInfo ? '' : _myBalance.balanceInfo.coin;
}

function Balance({ balance, type, chain, price }: Props): React.ReactElement<Props> {
  const balString = balanceToHuman(balance, type)
  const bal = balString === ('' || '0') ? 0 : Number(balString);
  const label = type.charAt(0).toUpperCase() + type.slice(1);


  return (
    <>
      <span style={{ fontSize: 12, fontWeight: 500 }} >
        {label}: {' '}
      </span>

      {balance === null
        ? <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
        : <>
          <span style={{ fontSize: 11, fontWeight: 600 }} >
            {bal || '0.00'}{' '}
          </span>
        </>}
        
      <span style={{ fontSize: 12 }}>
        {balance && getCoin(balance)}
      </span>

      <div style={{ fontSize: 11 }}>
        $ {' '}{price * bal}
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

      .banner {
        font - size: 12px;
      line-height: 16px;
      position: absolute;
      top: 0;

      &.chain {
        background: ${theme.primaryColor};
      border-radius: 0 0 0 10px;
      color: white;
      padding: 0.1rem 0.5rem 0.1rem 0.75rem;
      right: 0;
      z-index: 1;
    }
  }

      .balanceDisplay {
        display: flex;
      justify-content: space-between;
      position: relative;

      .balance {
        position: absolute;
      left: 2px;
      top: 18px;
      color: ${theme.labelColor};
      font-size: 14px;
      font-weight: bold;
    }
      . availableBalance {
        position: absolute;
      right: 2px;
      top: -18px;
    }

      .transferIcon {
        display: flex;
      justify-content: space-between;
      position: relative;

      .svg-inline--fa {
        width: 14px;
      height: 14px;
      margin-right: 10px;
      color: ${theme.accountDotsIconColor};
      &:hover {
        color: ${theme.labelColor};
      cursor: pointer;
  }
}

      .refreshIcon {
        position: absolute;
      right: 2px;
      top: +36px;
    }

      .hiddenIcon, .visibleIcon {
        position: absolute;
      right: 2px;
      top: -18px;
    }

      .hiddenIcon {
        color: ${theme.errorColor};
      &:hover {
        color: ${theme.accountDotsIconColor};
      }
    }
  }

      .externalIcon, .hardwareIcon {
        margin - right: 0.3rem;
      color: ${theme.labelColor};
      width: 0.875em;
  }

      .identityIcon {
        margin - left: 15px;
      margin-right: 10px;

      & svg {
        width: 50px;
      height: 50px;
    }
  }

      .info {
        width: 100%;
  }

      .infoRow {
        display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      height: 30px;
    // border-radius: 4px;
  }

      img {
        max - width: 50px;
      max-height: 50px;
      border-radius: 50%;
  }

      .name {
        font - size: 16px;
      line-height: 22px;
      margin: 2px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 300px;
      white-space: nowrap;

      &.displaced {
        padding - top: 10px;
    }
  }

      .parentName {
        color: ${theme.labelColor};
      font-size: ${theme.inputLabelFontSize};
      line-height: 14px;
      overflow: hidden;
      padding: 0.25rem 0 0 0.8rem;
      text-overflow: ellipsis;
      width: 270px;
      white-space: nowrap;
  }

      .detailsIcon {
        background: ${theme.accountDotsIconColor};
      width: 3px;
      height: 19px;

      &.active {
        background: ${theme.primaryColor};
    }
  }

      .deriveIcon {
        color: ${theme.labelColor};
      position: absolute;
      top: 5px;
      width: 9px;
      height: 9px;
  }

      .movableMenu {
        margin - top: -20px;
      right: 28px;
      top: 0;

      &.isMoved {
        top: auto;
      bottom: 0;
    }
  }

      .settings {
        position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 40px;

      &:before {
        content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 1px;
      background: ${theme.boxBorderColor};
    }

      &:hover {
        cursor: pointer;
      background: ${theme.readonlyInputBackground};
    }
  }
      `);
