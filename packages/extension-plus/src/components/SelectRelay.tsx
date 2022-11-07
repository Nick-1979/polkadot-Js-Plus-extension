// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Avatar, FormControl, FormHelperText, Grid, InputLabel, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { RELAY_CHAINS } from '../util/constants';
import getLogo from '../util/getLogo';

interface Props {
  selectedChain: string;
  handleChainChange: (event: SelectChangeEvent) => void;
  hasEmpty?: boolean
}

 function SelectRelay({ handleChainChange, hasEmpty = false, selectedChain }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid alignItems='center' container>
      <Grid item xs={1}>
        {selectedChain
          ? <Avatar
            alt={'chain logo'}
            src={getLogo(selectedChain)}
            sx={{ height: 32, width: 32 }}
          />
          : <HelpOutlineOutlinedIcon color='action' sx={{ fontSize: 36, paddingBottom: '15px' }} />
        }
      </Grid>
      <Grid item xs={11}>
        <FormControl fullWidth>
          <InputLabel id='select-blockchain'>{t('Relay chain')}</InputLabel>
          <Select
            label='Select blockchain'
            native
            onChange={handleChainChange}
            sx={{ height: 50 }}
            // defaultOpen={true}
            value={selectedChain}
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
          {!selectedChain && <FormHelperText>{t('Please select a relay chain')}</FormHelperText>}
        </FormControl>
      </Grid>

    </Grid>
  );
}

export default React.memo(SelectRelay);