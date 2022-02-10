// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Container, Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { AccountsBalanceType, ChainInfo, StakingConsts, ValidatorsName } from '../../util/plusTypes';
import ValidatorInfo from './ValidatorInfo';
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
  const [chainInfo, setChainInfo] = useState<ChainInfo>();
  const [showValidatorInfoModal, setShowValidatorInfoModal] = useState<boolean>(false);
  const [info, setInfo] = useState<DeriveStakingQuery>();

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getChainInfo(chain).then((r) => {
      setChainInfo(r);
    });
  }, []);

  useEffect(() => {
    if (!activeValidator || !validatorsInfo.length) return;

    // put active validator at the top of list
    const index = validatorsInfo.findIndex((v) => v.accountId === activeValidator.accountId);

    validatorsInfo.splice(index, 1);
    validatorsInfo.unshift(activeValidator);
  }, [activeValidator, validatorsInfo]);

  return (
    <Container disableGutters maxWidth='md'>
      <Grid alignItems='center' container>
        <Grid item xs={12}>

          {validatorsInfo
            ? <Table
              activeValidator={activeValidator}
              decimals={chainInfo?.decimals}
              setInfo={setInfo}
              setShowValidatorInfoModal={setShowValidatorInfoModal}
              staker={staker}
              stakingConsts={stakingConsts}
              validators={validatorsInfo}
              validatorsName={validatorsName}
            />
            : <Progress title={t('Loading validators....')} />
          }
        </Grid>
      </Grid>
      {showValidatorInfoModal && info &&
        <ValidatorInfo
          chain={chain}
          chainInfo={chainInfo}
          info={info}
          setShowValidatorInfoModal={setShowValidatorInfoModal}
          showValidatorInfoModal={showValidatorInfoModal}
          validatorsName={validatorsName}
        />
      }
    </Container>
  );
}
