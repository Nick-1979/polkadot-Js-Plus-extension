// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here nominated validators are listed, which shows usefull information/notifications like current active nominator,
 *  oversubscribds, noActive in this era, Tune up to do rebag or putInFrontOf if needed, and also stop/change nominations are provided.
 * */

import type { Chain } from '../../../../../extension-chains/src/types';
import type { AccountsBalanceType, MyPoolInfo, PoolStakingConsts, StakingConsts, Validators } from '../../../util/plusTypes';

import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StopCircle as StopCircleIcon, TrackChanges as TrackChangesIcon } from '@mui/icons-material';
import { Button as MuiButton, Grid, Link } from '@mui/material';
import { blue } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { BN, BN_ZERO } from '@polkadot/util';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../../components';
import ValidatorsList from '../common/ValidatorsList';

interface Props {
  activeValidators: DeriveStakingQuery[] | undefined;
  nominatedValidators: DeriveStakingQuery[] | null;
  poolStakingConsts: PoolStakingConsts | undefined;
  stakingConsts: StakingConsts | undefined;
  noNominatedValidators: boolean | undefined;
  chain: Chain;
  api: ApiPromise | undefined;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  validatorsInfo: Validators | undefined;
  state: string;
  handleSelectValidatorsModalOpen: (arg0?: boolean) => void;
  handleStopNominating: () => void;
  staker: AccountsBalanceType;
  myPool: MyPoolInfo | undefined | null;
  getPoolInfo: (endpoint: string, stakerAddress: string, id?: number | undefined) => void;
  endpoint: string | undefined;
  setNoNominatedValidators: React.Dispatch<React.SetStateAction<boolean | undefined>>
}

function Nominations({ activeValidators, api, chain, endpoint, getPoolInfo, handleSelectValidatorsModalOpen, handleStopNominating, myPool, noNominatedValidators, nominatedValidators, poolStakingConsts, setNoNominatedValidators, staker, stakingConsts, state, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const points = myPool?.member?.points;
  const currentlyStaked = points ? new BN(points) : BN_ZERO;

  const handleRefresh = useCallback(() => {
    if (endpoint && staker?.address) {
      setNoNominatedValidators(undefined);
      getPoolInfo(endpoint, staker.address);

      setRefreshing(true);
    }
  }, [endpoint, getPoolInfo, setNoNominatedValidators, staker.address]);

  useEffect(() => {
    noNominatedValidators !== undefined && setRefreshing(false);
  }, [noNominatedValidators]);

  return (
    <>
      {nominatedValidators?.length && poolStakingConsts && !noNominatedValidators
        ? <Grid container px='5px'>
          <Grid item sx={{ height: '245px' }} xs={12}>
            <ValidatorsList
              activeValidators={activeValidators}
              api={api}
              chain={chain}
              height={220}
              ledger={myPool?.ledger}
              staker={myPool?.accounts?.stashId}
              stakingConsts={stakingConsts}
              validatorsIdentities={validatorsIdentities}
              validatorsInfo={nominatedValidators}
            />
          </Grid>
          {[myPool?.bondedPool?.roles?.root, myPool?.bondedPool?.roles?.nominator].includes(staker.address) &&
            <Grid container item justifyContent='space-between' pt='5px' xs={12}>
              <Grid item>
                <MuiButton
                  onClick={handleStopNominating}
                  size='medium'
                  startIcon={<StopCircleIcon />}
                  sx={{ color: 'black', textTransform: 'none' }}
                  variant='text'
                >
                  {t('Stop nominating')}
                </MuiButton>
              </Grid>
              <Grid item sx={{ textAlign: 'right' }}>
                <MuiButton
                  color='warning'
                  onClick={() => handleSelectValidatorsModalOpen()}
                  size='medium'
                  startIcon={<TrackChangesIcon />}
                  sx={{ textTransform: 'none' }}
                  variant='text'
                >
                  {t('Change validators')}
                </MuiButton>
              </Grid>
            </Grid>
          }
        </Grid>
        : !noNominatedValidators || noNominatedValidators === undefined
          ? <Progress title={'Loading ...'} />
          : <Grid container justifyContent='center'>
            <Grid item sx={{ textAlign: 'right', p: '10px' }} xs={12}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  color={blue[600]}
                  icon={faSyncAlt}
                  id='refreshIcon'
                  onClick={handleRefresh}
                  size='sm'
                  spin={refreshing}
                  title={t('refresh')}
                />
              </Link>
            </Grid>
            <Grid item sx={{ fontSize: 13, margin: '60px 10px 30px', textAlign: 'center' }} xs={12}>
              {t('No nominated validators found')}
            </Grid>
            <Grid item>
              {api && poolStakingConsts && currentlyStaked.gte(poolStakingConsts?.minNominatorBond) && [myPool?.bondedPool?.roles?.root, myPool?.bondedPool?.roles?.nominator].includes(staker.address) &&
                <NextStepButton
                  data-button-action='Set Nominees'
                  isBusy={validatorsInfo && state === 'setNominees'}
                  onClick={() => handleSelectValidatorsModalOpen(true)}
                >
                  {t('Set nominees')}
                </NextStepButton>
              }
            </Grid>
          </Grid>
      }
    </>
  );
}

export default React.memo(Nominations);
