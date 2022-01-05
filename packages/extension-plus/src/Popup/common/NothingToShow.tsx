/* eslint-disable header/header */
// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { BlurOff as BlurOffIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React from 'react';

interface Props {
    text: string;
}

export function NothingToShow({ text }: Props): React.ReactElement<Props> {
    return (
        <Grid alignItems='center' container direction='column' justifyContent='center' xs={12}>
            <Grid item sx={{ padding: '80px 0px 40px', textAlign: 'center' }}>
                <BlurOffIcon color='disabled' fontSize='large' />
            </Grid>

            <Grid item sx={{ fontSize: 14, textAlign: 'center' }}>
                {text}
            </Grid>
        </Grid>
    );
}
