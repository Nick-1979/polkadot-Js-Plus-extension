// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { IconDefinition } from '@fortawesome/fontawesome-common-types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Divider, Grid } from '@mui/material';
import React from 'react';

import { Chain } from '../../../../extension-chains/src/types';
import { ActionText } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../../util/getLogo';

interface Props {
  chain: Chain;
  // icon: IconDefinition;
  icon:React.ReactElement;
  title: string;
  closeText: string;
  action: () => void;
}

export default function PlusHeader ({ action, chain, closeText, icon, title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid alignItems='center' container item justifyContent='space-between' sx={{fontSize: 15, padding: '20px 20px 1px' }}>
      <Grid item>
        <Avatar
          alt={'logo'}
          src={getLogo(chain)}
        />
      </Grid>
      <Grid item sx={{fontWeight: 500 }}>
        {/* <FontAwesomeIcon
          icon={icon}
          size='sm'
        /> */}
        {icon}
        {' '} {t<string>(title)}
      </Grid>
      <Grid item>
        <ActionText
          onClick={action}
          text={t<string>(closeText)}
        />
      </Grid>
      <Grid xs={12}>
        <Divider />
      </Grid>
    </Grid>
  );
}
