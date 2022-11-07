// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description This component shows my selected pool's information
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '../../../../../extension-chains/src/types';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo } from '../../../util/plusTypes';

import { AutoDeleteRounded as AutoDeleteRoundedIcon, BlockRounded as BlockRoundedIcon, Output as OutputIcon, PlayCircleOutlined as PlayCircleOutlinedIcon, SettingsApplicationsOutlined as SettingsApplicationsOutlinedIcon } from '@mui/icons-material';
import { Button, Divider, Grid } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

import { BN } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Hint, Progress } from '../../../components';
import EditPool from './EditPool';
import KickAll from './KickAll';
import Pool from './Pool';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  staker: AccountsBalanceType;
  pool: MyPoolInfo | undefined | null;
  poolsMembers: MembersMapEntry[] | undefined;
  setState: React.Dispatch<React.SetStateAction<string>>;
  handleConfirmStakingModalOpen: () => void;
  setNewPool: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>;
  newPool: MyPoolInfo | undefined;
}

function PoolTab({ api, chain, handleConfirmStakingModalOpen, newPool, pool, poolsMembers, setNewPool, setState, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [showEditPoolModal, setEditPoolModalOpen] = useState<boolean>(false);
  const [showKickAllModal, setKickAllModalOpen] = useState<boolean>(false);

  const canChangeState = useMemo(() => pool?.bondedPool && staker?.address && [String(pool.bondedPool.roles.root), String(pool.bondedPool.roles.stateToggler)].includes(staker.address), [pool, staker]);
  const canEdit = useMemo(() => pool?.bondedPool && staker?.address && String(pool.bondedPool.roles.root) === staker.address, [pool, staker]);

  const canKickAll = useMemo(() => {
    if (!pool?.bondedPool || !staker || !poolsMembers || poolsMembers[pool.poolId]?.length === 1 ||
      ![String(pool.bondedPool.roles.root), String(pool.bondedPool.roles.stateToggler)].includes(staker.address) ||
      !['Blocked', 'Destroying'].includes(String(pool.bondedPool?.state))) {
      return false;
    }

    return true;
  }, [pool, staker, poolsMembers]);

  const handleStateChange = useCallback((state: string) => {
    if (!api) {
      return;
    }

    setState(state);
    handleConfirmStakingModalOpen();
  }, [api, handleConfirmStakingModalOpen, setState]);

  const handleEditPool = useCallback(() => {
    setState('editPool');
    setEditPoolModalOpen(true);
  }, [setState]);

  const handleKickAll = useCallback(() => {
    setState('kickAll');
    setKickAllModalOpen(true);
  }, [setState]);

  return (
    <Grid container px='5px'>
      {api && pool !== undefined
        ? pool
          ? <>
            <Pool api={api} chain={chain} pool={pool} poolsMembers={poolsMembers} showIds={!canChangeState && !canEdit} showRoles />
            <Grid container item justifyContent='space-between' sx={{ p: '15px 1px' }} xs={12}>
              {canChangeState &&
                <Grid container item xs={8}>
                  <Grid item>
                    <Button
                      disabled={pool?.bondedPool?.state && String(pool.bondedPool.state).toLowerCase() === 'destroying'}
                      onClick={() => handleStateChange('destroying')}
                      size='small'
                      startIcon={<AutoDeleteRoundedIcon fontSize='small' />}
                      sx={{ color: 'red', textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Destroy')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      disabled={['blocked', 'destroying'].includes(String(pool?.bondedPool?.state).toLowerCase())}
                      onClick={() => handleStateChange('blocked')}
                      size='small'
                      startIcon={<BlockRoundedIcon />}
                      sx={{ color: 'black', textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Block')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      color='warning'
                      disabled={['open', 'destroying'].includes(String(pool?.bondedPool?.state).toLowerCase())}
                      onClick={() => handleStateChange('open')}
                      size='small'
                      startIcon={<PlayCircleOutlinedIcon />}
                      sx={{ textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Open')}
                    </Button>
                  </Grid>
                </Grid>
              }
              {canChangeState &&
                <>
                  <Grid item>
                    <Divider orientation='vertical' />
                  </Grid>
                  <Grid item>
                    <Hint id='kickAll' place='top' tip='kick all members when pool is in Blocked or Destroying state, and not already kicked'>
                      <Button
                        color='warning'
                        disabled={!canKickAll}
                        onClick={handleKickAll}
                        size='medium'
                        startIcon={<OutputIcon />}
                        sx={{ textTransform: 'none' }}
                        variant='text'
                      >
                        {t('Kick all')}
                      </Button>
                    </Hint>
                  </Grid>
                </>}
              {canEdit &&
                <>
                  <Grid item>
                    <Divider orientation='vertical' />
                  </Grid>
                  <Grid item>
                    <Button
                      color='warning'
                      disabled={['destroying'].includes(String(pool?.bondedPool?.state).toLowerCase())}
                      onClick={handleEditPool}
                      size='medium'
                      startIcon={<SettingsApplicationsOutlinedIcon />}
                      sx={{ textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Edit')}
                    </Button>
                  </Grid>
                </>
              }
            </Grid>
          </>
          : <Grid item sx={{ fontSize: 12, pt: 7, textAlign: 'center' }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading ...')} />
      }
      {showEditPoolModal && pool &&
        <EditPool
          api={api}
          chain={chain}
          handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
          newPool={newPool}
          pool={pool}
          setEditPoolModalOpen={setEditPoolModalOpen}
          setNewPool={setNewPool}
          setState={setState}
          showEditPoolModal={showEditPoolModal}
        />
      }
      {showKickAllModal && pool &&
        <KickAll
          api={api}
          chain={chain}
          handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
          pool={pool}
          poolsMembers={poolsMembers}
          setKickAllModalOpen={setKickAllModalOpen}
          setState={setState}
          showKickAllModal={showKickAllModal}
          staker={staker}
        />
      }
    </Grid>

  );
}

export default React.memo(PoolTab);