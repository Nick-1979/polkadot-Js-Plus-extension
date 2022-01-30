// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { ThemeProps } from '../../../extension-ui/src/types';
import type { Balance } from '@polkadot/types/interfaces';
import { Grid, Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';
import { amountToHuman, balanceToHuman } from '../util/plusUtils';

export interface Props {
    balance: Balance | bigint| string | number | null;
    decimals: number;
    coin: string;
    align?: 'start' | 'end' | 'left' | 'right' | 'center' | 'justify' | 'match-parent';
    title: string;
}

function GBalance({ balance, decimals, coin, title, align = 'right' }: Props): React.ReactElement<Props> {

    return (
        <Grid item xs={12} sx={{ padding: '0px 40px 10px', textAlign: align }}>
            {title}:{' '}
            {balance
                ? <>
                    {Number(amountToHuman(balance.toString(), decimals, 4)).toLocaleString()}{' '}{coin}
                </>
                : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
            }
        </Grid>
    );
}

export default styled(GBalance)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
`);
