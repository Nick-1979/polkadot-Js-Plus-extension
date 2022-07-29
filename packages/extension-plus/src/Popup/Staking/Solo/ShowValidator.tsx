// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description this component shows an individual validators info in a row in a table shape 
 * */

import type { AccountId } from '@polkadot/types/interfaces';

import { DirectionsRun as DirectionsRunIcon, MoreVert as MoreVertIcon, ReportProblemOutlined as ReportProblemOutlinedIcon } from '@mui/icons-material';
import { Grid, Paper, Switch, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { TFunction } from '@polkadot/apps-config/types';
import { Chain } from '@polkadot/extension-chains/types';

import { Identity, ShortAddress } from '../../../components';
import { SELECTED_COLOR } from '../../../util/constants';
import { StakingConsts } from '../../../util/plusTypes';

interface Props {
  api: ApiPromise;
  chain: Chain;
  stakingConsts: StakingConsts | undefined;
  validator: DeriveStakingQuery;
  showSwitch?: boolean;
  handleSwitched?: (event: React.ChangeEvent<HTMLInputElement>, validator: DeriveStakingQuery) => void;
  handleMoreInfo: (arg0: DeriveStakingQuery) => void;
  isSelected?: (arg0: DeriveStakingQuery) => boolean;
  isInNominatedValidators?: (arg0: DeriveStakingQuery) => boolean;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  activeValidator?: DeriveStakingQuery;
  showSocial?: boolean;
  t: TFunction;
}

function ShowValidator({ activeValidator, api, chain, handleMoreInfo, handleSwitched, isInNominatedValidators, isSelected, showSocial = true, showSwitch = false, stakingConsts, t, validator, validatorsIdentities }: Props) {
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined>();
  const isItemSelected = isSelected && isSelected(validator);
  const rowBackground = isInNominatedValidators && (isInNominatedValidators(validator) ? SELECTED_COLOR : '');
  const nominatorCount = validator.exposure.others.length;
  const isActive = validator.accountId === activeValidator?.accountId;
  const isOverSubscribed = stakingConsts && validator.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator;
  const total = String(validator.exposure.total).indexOf('.') === -1 && api.createType('Balance', validator.exposure.total);

  useEffect(() => {
    const info = validatorsIdentities?.find((v) => v?.accountId === validator?.accountId);

    if (info) {
      return setAccountInfo(info);
    }

    // eslint-disable-next-line no-void
    void api.derive.accounts.info(validator?.accountId).then((info) => {
      setAccountInfo(info);
    });
  }, [api, validator?.accountId, validatorsIdentities]);

  return (
    <Paper elevation={2} sx={{ backgroundColor: rowBackground, borderRadius: '10px', mt: '4px', p: '1px 10px 2px 0px' }}>
      <Grid alignItems='center' container sx={{ fontSize: 11 }}>
        <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
          <MoreVertIcon fontSize={showSwitch ? 'medium' : 'small'} onClick={() => handleMoreInfo(validator)} sx={{ cursor: 'pointer' }} />
        </Grid>
        <Grid item sx={{ fontSize: 11 }} xs={6}>
          {validatorsIdentities || accountInfo
            ? <Identity
              accountInfo={accountInfo}
              chain={chain}
              iconSize={showSwitch ? 24 : 20}
              showSocial={showSocial}
              totalStaked={total && showSwitch ? `Total staked: ${total.toHuman()}` : ''}
            />
            : <ShortAddress address={String(validator?.accountId)} fontSize={11} />
          }
        </Grid>
        {!showSwitch &&
          <Grid item sx={{ textAlign: 'left' }} xs={2}>
            {total ? total.toHuman() : ''}
          </Grid>
        }
        <Grid item sx={{ textAlign: 'center' }} xs={showSwitch ? 2 : 1}>
          {Number(validator.validatorPrefs.commission) / (10 ** 7) < 1 ? 0 : Number(validator.validatorPrefs.commission) / (10 ** 7)}%
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' xs={2}>
          <Grid item sx={{ textAlign: 'right' }} xs={2}>
            {!!nominatorCount && isActive &&
              <Tooltip placement='left' title={t && t('Active')}>
                <DirectionsRunIcon color='primary' sx={{ fontSize: '17px' }} />
              </Tooltip>
            }
          </Grid>
          <Grid item sx={{ textAlign: 'center' }} xs={'auto'}>
            {nominatorCount || 'waiting'}
          </Grid>
          <Grid item sx={{ textAlign: 'left' }} xs={2}>
            {!!nominatorCount && isOverSubscribed &&
              <Tooltip placement='left' title={t && t('Oversubscribed')}>
                <ReportProblemOutlinedIcon color='warning' sx={{ fontSize: '17px' }} />
              </Tooltip>
            }
          </Grid>
        </Grid>
        {showSwitch && <Grid item xs={1}>
          <Switch checked={isItemSelected} color='warning' onChange={(e) => handleSwitched(e, validator)} size='small' />
        </Grid>
        }

      </Grid>
    </Paper>
  );
}

export default React.memo(ShowValidator);
