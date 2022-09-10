// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Avatar, Divider, Grid } from '@mui/material';
import React from 'react';

import { Chain } from '../../../extension-chains/src/types';
import { ActionText } from '../../../extension-ui/src/components';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../util/getLogo';

interface Props {
  chain: string | Chain;
  icon: React.ReactElement;
  title: string;
  closeText: string;
  action: () => void;
}

function PlusHeader({ action, chain, closeText, icon, title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 15, padding: '20px 20px 1px' }}>
        <Grid item sx={{ pb: '5px' }} xs={1}>
          <Avatar
            alt={'logo'}
            src={getLogo(chain)}
            sx={{ height: 30, width: 30 }}
          />
        </Grid>
        <Grid container item justifyContent='center' spacing={1} sx={{ fontWeight: 350 }} xs={10}>
          <Grid item>
            {icon}
          </Grid>
          <Grid item sx={{ pb: '7px' }}>
            {t<string>(title)}
          </Grid>
        </Grid>
        <Grid item xs={1}>
          <ActionText
            onClick={action}
            text={t<string>(closeText)}
          />
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Divider />
      </Grid>
    </>
  );
}

export default React.memo(PlusHeader);