// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description Lists all councilers information
*/
import { Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { ChainInfo, PersonsInfo } from '../../../../util/plusTypes';
import Member from './Member';

interface Props {
  personsInfo: PersonsInfo;
  membersType?: string;
  chain: Chain;
  chainInfo: ChainInfo;
}

export default function Members({ chain, chainInfo, membersType, personsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Grid item sx={{ color: grey[600], fontSize: 14, fontWeigth: 'bold', p: '10px 1px 10px', textAlign: 'center' }} xs={12}>
        {membersType}
      </Grid>

      {personsInfo.infos.length
        ? personsInfo.infos.map((p, index) => (
          <Member backed={personsInfo?.backed && personsInfo?.backed[index]} chain={chain} chainInfo={chainInfo} info={p} key={index} />
        ))
        : <Grid item sx={{ fontSize: 12, pt: 2, textAlign: 'center' }} xs={12}>
          {membersType &&
            <>{t('No ')}{membersType.toLowerCase()} {t(' found')}</>
          }
        </Grid>}
    </>
  );
}
