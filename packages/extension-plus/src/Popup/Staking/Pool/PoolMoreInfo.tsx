// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows a pool's info in a page including its members/roles list and links to subscan
 * */

import type { AccountId32 } from '@polkadot/types/interfaces';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';
import type { MembersMapEntry, MyPoolInfo } from '../../../util/plusTypes';

import { BubbleChart as BubbleChartIcon } from '@mui/icons-material';
import { Container, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useMemo } from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';
import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShortAddress } from '../../../components';
import { SELECTED_COLOR } from '../../../util/constants';
import Pool from './Pool';

interface Props {
  chain: Chain;
  api: ApiPromise;
  showPoolInfo: boolean;
  handleMorePoolInfoClose: () => void;
  pool: MyPoolInfo | undefined;
  poolId: number;
  poolsMembers: MembersMapEntry[] | undefined
}

export default function PoolMoreInfo({ api, chain, handleMorePoolInfoClose, pool, poolId, poolsMembers, showPoolInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const myPoolMembers = poolsMembers && pool ? poolsMembers[poolId] as unknown as MembersMapEntry : undefined;
  const roleIds = useMemo(() => pool?.bondedPool ? Object.values(pool.bondedPool.roles) as unknown as AccountId32[] : [], [pool]);

  return (
    <Popup handleClose={handleMorePoolInfoClose} id='scrollArea' showModal={showPoolInfo}>
      <PlusHeader action={handleMorePoolInfoClose} chain={chain} closeText={'Close'} icon={<BubbleChartIcon fontSize='small' />} title={'Pool Info'} />
      <Container sx={{ p: '0px 20px' }}>
        <Pool api={api} chain={chain} pool={pool} poolsMembers={poolsMembers} showIds showMore={false} showRewards showRoles />
        <Grid item sx={{ color: grey[600], fontSize: 15, p: '10px 0px 1px', textAlign: 'center' }} xs={12}>
          {t('Members')} ({myPoolMembers?.length ?? 0})
        </Grid>
        <Grid item sx={{ bgcolor: 'background.paper', height: '200px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%', pt: '10px' }} xs={12}>
          {myPoolMembers?.map(({ accountId, member }, index: number) => {
            const points = api.createType('Balance', member?.points ?? BN_ZERO); // FIXME: it is points not balance!!

            return (
              <Paper elevation={2} key={index} sx={{ bgcolor: roleIds.includes(accountId) ? SELECTED_COLOR : '', my: 1, p: '1px 10px 1px' }}>
                <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12 }}>
                  <Grid item xs={1}>
                    <Identicon
                      prefix={chain?.ss58Format ?? 42}
                      size={30}
                      theme={chain?.icon || 'polkadot'}
                      value={String(accountId)}
                    />
                  </Grid>
                  <Grid item sx={{ textAlign: 'left' }} xs={6}>
                    <ShortAddress address={String(accountId)} charsCount={8} fontSize={12} />
                  </Grid>
                  <Grid item sx={{ textAlign: 'right' }} xs={5}>
                    {points.toHuman()}
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Grid>
      </Container>
    </Popup>
  );
}
