// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Container, Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { AccountsBalanceType, StakingConsts, ValidatorsName } from '../../util/plusTypes';
import Table from './VTable';

interface Props {
  activeValidator?: DeriveStakingQuery;
  chain?: Chain | null;
  validatorsInfo: DeriveStakingQuery[] | null;
  stakingConsts: StakingConsts;
  staker?: AccountsBalanceType;
  validatorsName: ValidatorsName[] | null;
}

export default function ValidatorsList({ activeValidator, chain, staker, stakingConsts, validatorsInfo, validatorsName }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [decimal, setDecimals] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(chain).then((r) => {
      setDecimals(r.decimals);
    });
  }, []);

  return (
    <Container disableGutters maxWidth='md'>
      <Grid alignItems='center' container>
        <Grid item xs={12}>

          {validatorsInfo
            ? <Table
              activeValidator={activeValidator}
              decimals={decimal}
              staker={staker}
              stakingConsts={stakingConsts}
              validators={validatorsInfo}
              validatorsName={validatorsName}
            />
            : <Progress title={t('Loading validators....')} />
          }
        </Grid>
      </Grid>
    </Container>
  );
}
