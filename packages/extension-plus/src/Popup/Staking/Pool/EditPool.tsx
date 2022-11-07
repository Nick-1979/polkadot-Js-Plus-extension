// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here a pool metaData and roles can be edited by root!
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { ThemeProps } from '../../../../../extension-ui/src/types';
import type { AccountsBalanceType, MyPoolInfo } from '../../../util/plusTypes';

import { SettingsApplicationsOutlined as SettingsApplicationsOutlinedIcon } from '@mui/icons-material';
import { Divider, Grid, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { BackButton, NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { AddressInput, PlusHeader, Popup } from '../../../components';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  chain: Chain;
  className?: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  showEditPoolModal: boolean;
  setEditPoolModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleConfirmStakingModalOpen: () => void;
  pool: MyPoolInfo;
  setNewPool: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>;
  newPool: MyPoolInfo | undefined;
}

function EditPool({ api, chain, handleConfirmStakingModalOpen, newPool, pool, setEditPoolModalOpen, setNewPool, setState, showEditPoolModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [metaData, setMetaData] = useState<string | null>(pool.metadata);
  const [root, setRoot] = useState<string | undefined>(pool.bondedPool?.roles?.root ? String(pool.bondedPool.roles.root) : undefined);
  const [nominator, setNominator] = useState<string | undefined>(pool.bondedPool?.roles?.nominator ? String(pool.bondedPool.roles.nominator) : undefined);
  const [stateToggler, setStateToggler] = useState<string | undefined>(pool.bondedPool?.roles?.stateToggler ? String(pool.bondedPool.roles.stateToggler) : undefined);
  const [nextToEditButtonDisabled, setNextToEditButtonDisabled] = useState<boolean>(true);
  const [isRootValid, setIsRootValid] = useState<boolean>(true);
  const [isNominatorValid, setIsNominatorValid] = useState<boolean>(true);
  const [isStateTogglerValid, setIsStateTogglerValid] = useState<boolean>(true);

  useEffect(() => {
    setNewPool(JSON.parse(JSON.stringify(pool)) as MyPoolInfo);
  }, [pool, setNewPool]);

  useEffect(() => {
    const validAddresses = isRootValid && isNominatorValid && isStateTogglerValid;

    setNextToEditButtonDisabled(JSON.stringify(pool) === JSON.stringify(newPool) || !validAddresses);
  }, [isNominatorValid, isRootValid, isStateTogglerValid, newPool, pool, root]);

  useEffect(() => {
    if (!newPool) { return; }

    const tempPool = { ...newPool };

    tempPool.metadata = metaData;
    tempPool.bondedPool.roles.root = root;
    tempPool.bondedPool.roles.nominator = nominator;
    tempPool.bondedPool.roles.stateToggler = stateToggler;

    setNewPool(tempPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominator, metaData, root, stateToggler, pool, setNewPool]);

  const handleEditPoolModalClose = useCallback(() => {
    setEditPoolModalOpen(false);
    setState('');
  }, [setEditPoolModalOpen, setState]);

  return (
    <>
      <Popup handleClose={handleEditPoolModalClose} showModal={showEditPoolModal}>
        <PlusHeader action={handleEditPoolModalClose} chain={chain} closeText={'Close'} icon={<SettingsApplicationsOutlinedIcon fontSize='small' />} title={'Edit Pool'} />
        <Grid container sx={{ pt: 2 }}>
          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, p: '20px 40px 1px' }}>
            <Grid item sx={{ pr: '5px' }} xs={10}>
              <TextField
                InputLabelProps={{ shrink: true }}
                autoFocus
                color='warning'
                fullWidth
                helperText={''}
                inputProps={{ style: { padding: '12px' } }}
                label={t('Pool metadata')}
                name='metaData'
                onChange={(e) => setMetaData(e.target.value)}
                placeholder='enter pool metadata'
                sx={{ height: '20px' }}
                type='text'
                value={metaData}
                variant='outlined'
              />
            </Grid>
            <Grid item xs>
              <TextField
                InputLabelProps={{ shrink: true }}
                disabled
                fullWidth
                inputProps={{ style: { padding: '12px', textAlign: 'center' } }}
                label={t('Pool Id')}
                name='nextPoolId'
                type='text'
                value={String(pool.member?.poolId ?? 0)}
                variant='outlined'
              />
            </Grid>
          </Grid>
          <Grid item sx={{ color: grey[600], fontSize: 16, p: '40px 40px 1px', textAlign: 'center' }} xs={12}>
            <Divider textAlign='left'> {t('Roles')}</Divider>
          </Grid>
          <Grid container item spacing={'10px'} sx={{ fontSize: 12, p: '20px 40px 5px' }}>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} disabled freeSolo selectedAddress={pool.bondedPool?.roles?.depositor ? String(pool.bondedPool.roles.depositor) : undefined} title={t('Depositor')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={root} setIsValid={setIsRootValid} setSelectedAddress={setRoot} title={t('Root')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={nominator} setIsValid={setIsNominatorValid} setSelectedAddress={setNominator} title={t('Nominator')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={stateToggler} setIsValid={setIsStateTogglerValid} setSelectedAddress={setStateToggler} title={t('State toggler')} />
            </Grid>
          </Grid>
          <Grid container item sx={{ p: '50px 34px' }} xs={12}>
            <Grid item xs={1}>
              <BackButton onClick={handleEditPoolModalClose} />
            </Grid>
            <Grid item sx={{ pl: 1 }} xs>
              <NextStepButton
                data-button-action='next to stake'
                isDisabled={nextToEditButtonDisabled}
                onClick={handleConfirmStakingModalOpen}
              >
                {t('Next')}
              </NextStepButton>
            </Grid>
          </Grid>
        </Grid>
      </Popup>
    </>
  );
}

export default styled(EditPool)`
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
