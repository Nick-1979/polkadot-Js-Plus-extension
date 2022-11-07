// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component show a list of validators, which is utilized in other components  
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { Grid } from '@mui/material';
import React, { useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../../components';
import { AccountsBalanceType, StakingConsts } from '../../../util/plusTypes';
import VTable from './VTable';
import ValidatorInfo from './ValidatorInfo';

interface Props {
  activeValidators?: DeriveStakingQuery[];
  chain: Chain;
  api: ApiPromise | undefined;
  validatorsInfo: DeriveStakingQuery[] | null;
  stakingConsts: StakingConsts | undefined;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  height: number;
  staker?: AccountsBalanceType | string;
  ledger?: StakingLedger | null;
}

export default function ValidatorsList({ activeValidators, api, chain, height, ledger, staker, stakingConsts, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showValidatorInfoModal, setShowValidatorInfoModal] = useState<boolean>(false);
  const [info, setInfo] = useState<DeriveStakingQuery | null>(null);

  /** put active validators at the top of the list **/
  React.useMemo(() => {
    activeValidators?.forEach((activeValidator) => {
      const index = validatorsInfo?.findIndex((v) => v.accountId === activeValidator?.accountId);

      if (validatorsInfo && index && activeValidator && index !== -1) {
        validatorsInfo.splice(index, 1);
        validatorsInfo.unshift(activeValidator);
      }
    });
  }, [validatorsInfo, activeValidators]);

  return (
    <>
      <Grid item xs={12}>
        {validatorsInfo && api
          ? <VTable
            activeValidators={activeValidators}
            api={api}
            chain={chain}
            height={height}
            setInfo={setInfo}
            setShowValidatorInfoModal={setShowValidatorInfoModal}
            stakingConsts={stakingConsts}
            validators={validatorsInfo}
            validatorsIdentities={validatorsIdentities}
          />
          : <Progress title={t('Loading validators....')} />
        }
      </Grid>
      {showValidatorInfoModal && info && api && chain &&
        <ValidatorInfo
          api={api}
          chain={chain}
          info={info}
          ledger={ledger}
          setShowValidatorInfoModal={setShowValidatorInfoModal}
          showValidatorInfoModal={showValidatorInfoModal}
          staker={staker}
          validatorsIdentities={validatorsIdentities}
        />
      }
    </>
  );
}
