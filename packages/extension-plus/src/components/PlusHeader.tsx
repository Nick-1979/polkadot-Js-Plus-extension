// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { IconDefinition } from '@fortawesome/fontawesome-common-types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Divider, Grid } from '@mui/material';
import React from 'react';

import { Chain } from '../../../extension-chains/src/types';
import { ActionText } from '../../../extension-ui/src/components';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../util/getLogo';

interface Props {
  chain: string | Chain;
  // icon: IconDefinition;
  icon: React.ReactElement;
  title: string;
  closeText: string;
  action: () => void;
}

export default function PlusHeader({ action, chain, closeText, icon, title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 15, padding: '20px 20px 1px' }}>
        <Grid item sx={{ paddingBottom: '5px' }} xs={1}>
          <Avatar
            alt={'logo'}
            src={getLogo(chain)}
            sx={{ height: 30, width: 30 }}
          />
        </Grid>
        <Grid item container justifyContent='center' spacing={1} sx={{ fontWeight: 350 }} xs={10}>
          {/* <FontAwesomeIcon
          icon={icon}
          size='sm'
        /> */}
          <Grid item>
            {icon}
          </Grid>
          <Grid item sx={{ paddingBottom: '7px' }}>
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
      
      <Grid xs={12}>
        <Divider />
      </Grid>
    </>
  );
}
