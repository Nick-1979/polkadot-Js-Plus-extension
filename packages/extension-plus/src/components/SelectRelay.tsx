// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CircularProgress, FormControl, FormHelperText, Grid, InputLabel, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { RELAY_CHAINS } from '../util/constants';

interface Props {
  selectedBlockchain: string;
  handleChainChange: (event: SelectChangeEvent) => void;
  hasEmpty?: boolean
}

export default function SelectRelay({ selectedBlockchain, handleChainChange, hasEmpty = false }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <FormControl fullWidth>
      <InputLabel id='select-blockchain'>{t('Relay chain')}</InputLabel>
      <Select
        value={selectedBlockchain}
        label='Select blockchain'
        onChange={handleChainChange}
        sx={{ height: 50 }}
        // defaultOpen={true}
        native
      >
        {hasEmpty &&
          <option value={''}>
            {''}
          </option>
        }
        {RELAY_CHAINS.map((r) =>
          // <MenuItem key={r.name} value={r.name.toLowerCase()}>
          //   <Grid container alignItems='center' justifyContent='space-between'>
          //     <Grid item>
          //       <Avatar
          //         alt={'logo'}
          //         src={getLogo(r.name.toLowerCase())}
          //         sx={{ height: 24, width: 24 }}
          //       />
          //     </Grid>
          //     <Grid item sx={{ fontSize: 15 }}>
          //       {r.name}
          //     </Grid>
          //   </Grid>
          // </MenuItem>

          <option key={r.name} value={r.name.toLowerCase()}>
            {r.name.toLowerCase()}
          </option>
        )}
      </Select>
      {!selectedBlockchain && <FormHelperText>{t('Please select a relay chain')}</FormHelperText>}
    </FormControl>
  );
}
