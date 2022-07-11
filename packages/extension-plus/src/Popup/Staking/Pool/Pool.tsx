// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description showing a pool general info in a row
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Balance } from '@polkadot/types/interfaces';
import type { Chain } from '../../../../../extension-chains/src/types';
import type { MembersMapEntry, MyPoolInfo, PoolInfo } from '../../../util/plusTypes';

import { ExpandMore, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Grid, Paper, Switch, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';

import { BN } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress, ShowAddress, ShowBalance2 } from '../../../components';
import PoolMoreInfo from './PoolMoreInfo';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  pool: MyPoolInfo | undefined;
  poolsMembers?: MembersMapEntry[] | undefined;
  stakerId?: string;
  showCheck?: boolean;
  showHeader?: boolean;
  selectedPool?: PoolInfo;
  setSelectedPool?: React.Dispatch<React.SetStateAction<PoolInfo | undefined>>;
  showRoles?: boolean;
  showIds?: boolean;
  showMore?: boolean;
  showRewards?: boolean;
}

export default function Pool({ api, chain, pool, poolsMembers, selectedPool, stakerId, setSelectedPool, showCheck = false, showHeader = true, showIds, showMore = true, showRewards, showRoles }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showPoolInfo, setShowPoolInfo] = useState(false);
  const [staked, setStaked] = useState<Balance | undefined>();
  const [expanded, setExpanded] = useState<string>('roles');

  const poolId = pool?.poolId || pool?.member?.poolId as BN;

  // const rewardClaimable = pool?.rewardClaimable && api ? api.createType('Balance', pool.rewardClaimable) : undefined;
  // const balance = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.balance) : undefined;
  // const totalEarnings = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.totalEarnings) : undefined;
  // const balance = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.balance) : undefined;
  // const totalEarnings = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.totalEarnings) : undefined;
  // const staked = pool?.ledger && api ? api.createType('Balance', pool.ledger.active) : undefined;
  // const rewardClaimable = pool?.rewardClaimable && api ? api.createType('Balance', pool.rewardClaimable) : undefined;

  useEffect(() => {
    if (!(api && pool)) { return; }

    const mayPoolBalance = pool?.ledger?.active ?? pool?.bondedPool?.points
    const staked = mayPoolBalance ? api.createType('Balance', mayPoolBalance) : undefined;

    setStaked(staked);
  }, [api, pool, pool?.bondedPool?.points]);

  const handleMorePoolInfoOpen = useCallback(() => {
    setShowPoolInfo(true);
  }, []);

  const handleMorePoolInfoClose = useCallback(() => {
    setShowPoolInfo(false);
  }, []);

  const handleAccordionChange = useCallback((panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  }, []);

  return (
    <Grid container>
      {pool !== undefined && api
        ? pool
          ? <>
            {showHeader &&
              <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 0px 5px 5px', width: '100%' }}>
                <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
                  {showMore &&
                    <Grid item sx={{ textAlign: 'center' }} xs={1}>
                      {t('More')}
                    </Grid>
                  }
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {t('Index')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={4}>
                    {t('Name')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {t('State')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={showMore ? 3 : 4}>
                    {t('Staked')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={2}>
                    {t('Members')}
                  </Grid>
                </Grid>
              </Paper>
            }
            <Paper elevation={2} sx={{ backgroundColor: grey[100], mt: '4px', p: '1px 0px 2px 5px', width: '100%' }}>
              <Grid alignItems='center' container sx={{ fontSize: 11 }}>
                {showMore &&
                  <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
                    <MoreVertIcon fontSize='small' onClick={handleMorePoolInfoOpen} sx={{ cursor: 'pointer' }} />
                  </Grid>
                }
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {String(poolId)}
                </Grid>
                <Tooltip title={pool?.metadata ?? t('no name')}>
                  <Grid item sx={{ overflow: 'hidden', textAlign: 'center', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={4}>
                    {pool?.metadata ?? t('no name')}
                  </Grid>
                </Tooltip>
                {!showCheck &&
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {pool?.bondedPool?.state}
                  </Grid>
                }
                <Grid item sx={{ textAlign: 'center' }} xs={showMore ? 3 : 4}>
                  {staked?.toHuman() ?? 0}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={2}>
                  {pool?.bondedPool?.memberCounter}
                </Grid>
                {showCheck &&
                  <Grid item xs={1}>
                    <Switch checked={selectedPool && selectedPool.poolId.eq(poolId)} color='warning' onChange={() => setSelectedPool(pool)} size='small' />
                  </Grid>
                }
              </Grid>
            </Paper>
            {(showIds || showRoles || showRewards) &&
              <Grid container sx={{ pt: 1 }}>
                {showRoles &&
                  <Grid item xs={12}>
                    <Accordion disableGutters expanded={expanded === 'roles'} onChange={handleAccordionChange('roles')} sx={{ backgroundColor: grey[200], flexGrow: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMore sx={{ fontSize: 15 }} />} sx={{ fontSize: 11 }}>
                        {t('Roles')}
                      </AccordionSummary>
                      <AccordionDetails sx={{ overflowY: 'auto', p: 0 }}>
                        <Grid item xs={12}>
                          <Paper elevation={3} sx={{ p: '10px' }}>
                            {pool?.bondedPool?.roles?.root && <ShowAddress api={api} address={String(pool.bondedPool.roles.root)} chain={chain} role={'Root'} />}
                            {pool?.bondedPool?.roles?.depositor && <ShowAddress api={api} address={String(pool.bondedPool.roles.depositor)} chain={chain} role={'Depositor'} />}
                            {pool?.bondedPool?.roles?.nominator && <ShowAddress api={api} address={String(pool.bondedPool.roles.nominator)} chain={chain} role={'Nominator'} />}
                            {pool?.bondedPool?.roles?.stateToggler && <ShowAddress api={api} address={String(pool.bondedPool.roles.stateToggler)} chain={chain} role={'State toggler'} />}
                          </Paper>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                }
                {showIds && pool?.accounts &&
                  <Grid item xs={12}>
                    <Accordion disableGutters expanded={expanded === 'ids'} onChange={handleAccordionChange('ids')} sx={{ backgroundColor: grey[200], flexGrow: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMore sx={{ fontSize: 15 }} />} sx={{ fontSize: 11 }}>
                        {t('Ids')}
                      </AccordionSummary>
                      <AccordionDetails sx={{ overflowY: 'auto', p: 0 }}>
                        <Grid item xs={12}>
                          <Paper elevation={3} sx={{ p: '10px' }}>
                            <ShowAddress api={api} address={pool.accounts.stashId} chain={chain} role={'Stash id'} />
                            <ShowAddress api={api} address={pool.accounts.rewardId} chain={chain} role={'Reward id'} />
                          </Paper>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                }
                {showRewards && (!!pool?.rewardClaimable || !!pool?.rewardPool?.totalEarnings) &&
                  <Accordion disableGutters expanded={expanded === 'rewards'} onChange={handleAccordionChange('rewards')} sx={{ backgroundColor: grey[200], flexGrow: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ fontSize: 15 }} />} sx={{ fontSize: 11 }}>
                      {t('Rewards')}
                    </AccordionSummary>
                    <AccordionDetails sx={{ overflowY: 'auto', p: 0 }}>
                      <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: '10px' }}>
                          {!!pool?.rewardClaimable &&
                            <Grid color={grey[600]} container item justifyContent='space-between' sx={{ fontSize: 11, fontWeight: '600' }} xs={12}>
                              <Grid item>
                                {t('Pool claimable')}:
                              </Grid>
                              <Grid item>
                                <ShowBalance2 api={api} balance={pool.rewardClaimable} />
                              </Grid>
                            </Grid>}
                          {!!pool?.rewardPool?.totalEarnings &&
                            <Grid color={grey[600]} container item justifyContent='space-between' sx={{ fontSize: 11, fontWeight: '600' }} xs={12}>
                              <Grid item>
                                {t('Pool total earnings')}:
                              </Grid>
                              <Grid item>
                                <ShowBalance2 api={api} balance={pool.rewardPool.totalEarnings} />
                              </Grid>
                            </Grid>}
                        </Paper>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                }
              </Grid>
            }
          </>
          : <Grid item sx={{ fontSize: 12, pt: 7, textAlign: 'center' }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading pool ....')} />
      }
      {
        showPoolInfo && api && pool?.rewardPool &&
        <PoolMoreInfo
          api={api}
          chain={chain}
          handleMorePoolInfoClose={handleMorePoolInfoClose}
          pool={pool}
          poolId={poolId}
          poolsMembers={poolsMembers}
          stakerId={stakerId}
          showPoolInfo={showPoolInfo}
        />
      }
    </Grid>
  );
}
