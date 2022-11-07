// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here a pool privileged user can kick all members
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { ThemeProps } from '../../../../../extension-ui/src/types';
import type { AccountsBalanceType, MemberPoints, MembersMapEntry, MyPoolInfo } from '../../../util/plusTypes';

import { Output as OutputIcon } from '@mui/icons-material';
import { Button, Grid, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup } from '../../../components';
import { remainingTimeCountDown } from '../../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  className?: string;
  chain: Chain;
  setKickAllModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setState: React.Dispatch<React.SetStateAction<string>>;
  showKickAllModal: boolean;
  handleConfirmStakingModalOpen: () => void;
  pool: MyPoolInfo;
  poolsMembers: MembersMapEntry[] | undefined
  staker: AccountsBalanceType;
}

interface SessionIfo {
  eraLength: number;
  eraProgress: number;
  currentEra: number;
}

const steps = ['Unbound', 'Wait', 'Kick'];
const STEP_MAP = { UNBOUND: 0, WAIT: 1, KICK: 2 };

function KickAll({ api, chain, handleConfirmStakingModalOpen, pool, poolsMembers, setKickAllModalOpen, setState, showKickAllModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});
  const [remainingSecondsToKickAll, setRemainingSecondsToKickAll] = useState<number>();// in seconds
  const [sessionInfo, setSessionInfo] = useState<SessionIfo>();
  const [kickEraIndex, setKickEraIndex] = useState<number>();

  const resetPage = useCallback(() => {
    setActiveStep(STEP_MAP.UNBOUND);
    setCompleted({});
  }, []);

  const members = useMemo(() => {
    if (!poolsMembers) {
      return;
    }

    return poolsMembers[pool.poolId]?.map((m) => ({ accountId: m.accountId, points: m.member.points })) as MemberPoints[];
  }, [pool, poolsMembers]);

  const needsUnboundAll = useMemo(() => {
    if (!members) {
      return false;
    }

    const allMembersPoints = members.reduce((sum: BN, { points }) => sum.add(points), BN_ZERO);
    const myPoint = members.find((m) => m.accountId === staker.address)?.points ?? BN_ZERO;

    return !allMembersPoints.sub(myPoint).isZero();
  }, [members, staker.address]);

  useEffect(() => {
    if (!members) {
      return;
    }

    let latestEra = 0;
    const aRandomMember = members.find((m) => m.accountId !== staker.address);

    aRandomMember && api && api.query.nominationPools.poolMembers(aRandomMember.accountId).then((m) => {
      const member = m?.isSome ? m.unwrap() : undefined;

      const unbondingEras = JSON.parse(JSON.stringify(member.unbondingEras));

      for (const [era, _] of Object.entries(unbondingEras)) {
        if (Number(era) > latestEra) {
          latestEra = Number(era);
        }
      }

      setKickEraIndex(latestEra);
    });
  }, [api, members, staker]);

  useEffect(() => {
    if (needsUnboundAll) {
      return setActiveStep(STEP_MAP.UNBOUND);
    }

    setCompleted((pre) => {
      pre[STEP_MAP.UNBOUND] = true;

      return completed;
    });

    if (sessionInfo && kickEraIndex && sessionInfo?.currentEra < kickEraIndex) {
      return setActiveStep(STEP_MAP.WAIT);
    }

    if (sessionInfo && kickEraIndex && sessionInfo?.currentEra >= kickEraIndex) {
      setActiveStep(STEP_MAP.KICK);
      setCompleted((pre) => {
        pre[STEP_MAP.WAIT] = true;

        return completed;
      });
    }
  }, [completed, kickEraIndex, needsUnboundAll, sessionInfo, sessionInfo?.currentEra]);

  useEffect(() => {
    api && api.derive.session?.progress().then((sessionInfo) => {
      setSessionInfo({
        currentEra: Number(sessionInfo.currentEra),
        eraLength: Number(sessionInfo.eraLength),
        eraProgress: Number(sessionInfo.eraProgress)
      });
    }).catch(console.error);
  }, [api]);

  useEffect(() => {
    if (!sessionInfo || !kickEraIndex) {
      return;
    }

    if (sessionInfo.currentEra >= kickEraIndex) {
      return setRemainingSecondsToKickAll(0);
    }

    const diff = kickEraIndex - sessionInfo.currentEra;

    setRemainingSecondsToKickAll(((diff - 1) * sessionInfo.eraLength + (sessionInfo.eraLength - sessionInfo.eraProgress)) * 6);
  }, [kickEraIndex, sessionInfo]);

  useEffect((): void => {
    remainingSecondsToKickAll && remainingSecondsToKickAll > 0 && setTimeout(() => setRemainingSecondsToKickAll((remainingSecondsToKickAll) => remainingSecondsToKickAll - 1), 1000);
  }, [remainingSecondsToKickAll]);

  const handleKickAllModalClose = useCallback(() => {
    setKickAllModalOpen(false);
    setState('');
  }, [setKickAllModalOpen, setState]);

  const handleKickAll = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setKickAllModalOpen(false);
    setState(event.target.id);
    handleConfirmStakingModalOpen();
  }, [handleConfirmStakingModalOpen, setKickAllModalOpen, setState]);

  const remainingTime = useMemo(() => remainingTimeCountDown(remainingSecondsToKickAll), [remainingSecondsToKickAll]);

  return (
    <>
      <Popup handleClose={handleKickAllModalClose} showModal={showKickAllModal}>
        <PlusHeader action={handleKickAllModalClose} chain={chain} closeText={'Close'} icon={<OutputIcon fontSize='small' />} title={'Kick All'} />
        <Grid item sx={{ bgcolor: grey[200], borderBottom: 1, borderColor: 'divider', p: '25px 15px' }} xs={12}>
          <Stepper activeStep={activeStep} nonLinear>
            {steps.map((label, index) =>
              <Step completed={completed[index]} key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            )}
          </Stepper>
        </Grid>
        <Grid container sx={{ p: '20px 30px' }}>
          <Typography sx={{ py: '30px' }} variant='subtitle1'>
            {t('To kick all members out, their tokens must first be unbounded, then they can be kicked out after unlocking period is over.')}
          </Typography>
          <Typography sx={{ p: '40px 10px 20px' }} variant='subtitle2'>
            {t('◾️ Unbound {{member}} member{{s}}', { replace: { member: members?.length ? members.length - 1 : 0, s: members?.length && members.length === 2 ? '' : 's' } })}:
          </Typography>
          <Grid container justifyContent='center'>
            <Button
              color='warning'
              disabled={!needsUnboundAll}
              id='unboundAll'
              onClick={handleKickAll}
              sx={{ textTransform: 'none', width: '50%' }}
              variant='contained'
            >
              {needsUnboundAll ? t('Unbound') : t('Already unbounded')}
            </Button>
          </Grid>
          <Typography sx={{ p: '80px 10px 20px' }} variant='subtitle2'>
            {t('◾️ Kick {{member}} member{{s}} out', { replace: { member: members?.length ? members.length - 1 : 0, s: members?.length && members.length === 2 ? '' : 's' } })}:
          </Typography>
          <Typography color='info' fontWeight='bold' sx={{ p: '80px 2px 20px' }} variant='subtitle2'>
            {t(!needsUnboundAll && remainingTime !== 'finished' ? `(after ${remainingTimeCountDown(remainingSecondsToKickAll)})` : '')}
          </Typography>
          <Grid container justifyContent='center'>
            <Button
              color='warning'
              disabled={needsUnboundAll || (!!sessionInfo && !!kickEraIndex && sessionInfo.currentEra < kickEraIndex)}
              id='kickAll'
              onClick={handleKickAll}
              sx={{ textTransform: 'none', width: '50%' }}
              variant='contained'
            >
              {t('Kick')}
            </Button>
          </Grid>
        </Grid>
      </Popup>
    </>
  );
}

export default styled(KickAll)`
      height: calc(100vh - 2px);
      overflow: auto;
      scrollbar - width: none;

      &:: -webkit - scrollbar {
        display: none;
      width:0,
       }
      .empty-list {
        text - align: center;
  }`;
