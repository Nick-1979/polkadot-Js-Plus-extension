// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { BlurOff as BlurOffIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React from 'react';

interface Props {
    text: string;
}

export default function NothingToShow({ text }: Props): React.ReactElement<Props> {
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
