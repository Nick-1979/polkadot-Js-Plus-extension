// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  render unstake tab in easy staking component
 * */

import { Alert, Button as MuiButton, Grid, InputAdornment, TextField } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { FormatBalance } from '../../../components';
import { AccountsBalanceType, MyPoolInfo, PoolStakingConsts } from '../../../util/plusTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint } from '../../../util/plusUtils';

interface Props {
  api: ApiPromise | undefined;
  poolStakingConsts: PoolStakingConsts | undefined;
  currentlyStaked: BN | undefined | null;
  pool: MyPoolInfo | undefined | null;
  handleConfirmStakingModalOpen: (state?: string | undefined, amount?: BN | undefined) => void;
  staker: AccountsBalanceType;
}

export default function Unstake({ api, currentlyStaked, handleConfirmStakingModalOpen, pool, poolStakingConsts, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [unstakeAmountInHuman, setUnstakeAmountInHuman] = useState<string | null>(null);
  const [nextToUnStakeButtonDisabled, setNextToUnStakeButtonDisabled] = useState(true);
  const [alert, setAlert] = useState<string>('');
  const [maxUnstake, setMaxUnstake] = useState<BN | undefined>();
  const [minDeposit, setMinDeposit] = useState<BN>(BN_ZERO);
  const [unstakeAmount, setUnstakeAmount] = useState<BN>(BN_ZERO);

  const stakerIsDepositor = useMemo(() => staker.address === String(pool?.bondedPool?.roles?.depositor), [staker, pool]);
  const poolIsDestroying = useMemo(() => pool?.bondedPool?.state && String(pool.bondedPool.state).toLowerCase() === 'destroying', [pool]);

  const UnableToPayFee = staker?.balanceInfo?.available && staker.balanceInfo.available === 0n;
  const decimals = api?.registry?.chainDecimals[0];
  const token = api?.registry?.chainTokens[0];

  useEffect(() => {
    if (!currentlyStaked || !pool || !poolStakingConsts) { return; }

    if (stakerIsDepositor && !poolIsDestroying) {
      const minDeposit = poolStakingConsts.minCreationBond;

      setMinDeposit(minDeposit);
      const depositorMaxUnstakeAble = currentlyStaked.sub(minDeposit);

      setMaxUnstake(depositorMaxUnstakeAble.gtn(0) ? depositorMaxUnstakeAble : BN_ZERO);
    } else {
      setMaxUnstake(currentlyStaked);
    }
  }, [currentlyStaked, pool, poolIsDestroying, poolStakingConsts, stakerIsDepositor]);

  const handleNextToUnstake = useCallback((): void => {
    handleConfirmStakingModalOpen('unstake', unstakeAmount);
  }, [handleConfirmStakingModalOpen, unstakeAmount]);

  const handleUnstakeAmountChanged = useCallback((value: string): void => {
    if (!decimals || !currentlyStaked || currentlyStaked?.isZero()) { return; }

    setAlert('');
    value = fixFloatingPoint(value);
    setUnstakeAmountInHuman(value);

    if (!Number(value)) { return; }

    const currentlyStakedInHuman = amountToHuman(currentlyStaked?.toString(), decimals);

    if (Number(value) > Number(currentlyStakedInHuman)) {
      setAlert(t('It is more than already staked!'));

      return;
    }

    const remainStaked = currentlyStaked.sub(new BN(String(amountToMachine(value, decimals))));
    const remainStakedInHumanToNumber = Number(amountToHuman(remainStaked.toString(), decimals));

    if (remainStakedInHumanToNumber > 0 &&
      ((minDeposit.gtn(0) && remainStaked.lt(minDeposit)) || (!stakerIsDepositor && poolStakingConsts?.minJoinBond && remainStaked.lt(poolStakingConsts?.minJoinBond)))) {
      const minShouldRemain = minDeposit.gtn(0) ? minDeposit : poolStakingConsts?.minJoinBond ?? BN_ZERO;

      setAlert(`Remained stake amount: ${amountToHuman(remainStaked.toString(), decimals)} should not be less than ${amountToHuman(minShouldRemain.toString(), decimals)} ${token}`);

      return;
    }

    if (currentlyStakedInHuman === value) {
      // to include even dust
      maxUnstake && setUnstakeAmount(maxUnstake);
    } else {
      setUnstakeAmount(Number(value) ? new BN(String(amountToMachine(value, decimals))) : BN_ZERO);
    }

    setNextToUnStakeButtonDisabled(false);
  }, [decimals, currentlyStaked, minDeposit, stakerIsDepositor, poolStakingConsts?.minJoinBond, t, token, maxUnstake]);

  const handleUnstakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setNextToUnStakeButtonDisabled(true);
    let value = event.target.value;

    if (Number(value) < 0) { value = String(-Number(value)); }

    handleUnstakeAmountChanged(value);
  }, [handleUnstakeAmountChanged]);

  const handleMaxUnstakeClicked = useCallback(() => {
    if (decimals && maxUnstake) {
      const v = amountToHuman(maxUnstake.toString(), decimals);

      handleUnstakeAmountChanged(v);
    }
  }, [maxUnstake, decimals, handleUnstakeAmountChanged]);

  return (
    <>
      <Grid item sx={{ p: '10px 30px 0px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
          autoFocus
          color='info'
          error={!currentlyStaked || currentlyStaked.ltn(Number(unstakeAmountInHuman)) || UnableToPayFee}
          fullWidth
          helperText={
            <>
              {currentlyStaked === undefined &&
                <Grid xs={12}>
                  {t('Fetching data from blockchain ...')}
                </Grid>}
              {(currentlyStaked === null || currentlyStaked?.isZero()) &&
                <Grid xs={12}>
                  {t('Nothing to unstake')}
                </Grid>
              }
              {currentlyStaked && !currentlyStaked?.isZero() && UnableToPayFee &&
                <Grid xs={12}>
                  {t('Unable to pay fee')}
                </Grid>
              }
            </>
          }
          inputProps={{ step: '.01' }}
          label={t('Amount')}
          name='unstakeAmount'
          onChange={handleUnstakeAmount}
          placeholder='0.0'
          sx={{ height: '50px' }}
          type='number'
          value={unstakeAmountInHuman}
          variant='outlined'
        />
      </Grid>
      <Grid container sx={{ height: '160px' }} title='Unstake'>
        <Grid container item justifyContent='flex-end' sx={{ p: '0px 30px 0px' }} xs={12}>
          <Grid item sx={{ fontSize: 12 }}>
            {currentlyStaked && !currentlyStaked?.isZero() &&
              <>
                {t('Max')}:
                <MuiButton
                  onClick={handleMaxUnstakeClicked}
                  sx={{ textTransform: 'none' }}
                  variant='text'
                >
                  <FormatBalance api={api} value={maxUnstake} />
                </MuiButton>
              </>
            }
          </Grid>
        </Grid>
        <Grid container item sx={{ fontSize: 13, fontWeight: '600', padding: '15px 30px 5px', textAlign: 'center' }} xs={12}>
          {alert &&
            <Grid item xs={12}>
              <Alert severity='error' sx={{ fontSize: 12 }}>
                {alert}
              </Alert>
            </Grid>
          }
        </Grid>
      </Grid>
      <Grid item sx={{ px: '10px' }} xs={12}>
        <NextStepButton
          data-button-action='next to unstake'
          isDisabled={nextToUnStakeButtonDisabled || UnableToPayFee}
          onClick={handleNextToUnstake}
        >
          {t('Next')}
        </NextStepButton>
      </Grid>

    </>
  );
}
