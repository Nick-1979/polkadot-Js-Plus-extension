/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens confiure page, to make an account recoverable or remove recovery, even close it 
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { PolicyOutlined as PolicyOutlinedIcon, GppMaybeOutlined as GppMaybeOutlinedIcon, AddModeratorOutlined as AddModeratorOutlinedIcon, VerifiedUserOutlined as VerifiedUserOutlinedIcon, InfoOutlined as InfoOutlinedIcon, Security as SecurityIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';

import { nameAddress, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import InfoTab from './InfoTab';
import RecoverableTab from './RecoverableTab';
import { Chain } from '@polkadot/extension-chains/types';
import CloseRecoveryTab from './CloseRecoveryTab';
import RecoveryChecking from './RecoveryCheckingTab';
import { ApiPromise } from '@polkadot/api';
import { PlusHeader, Popup } from '../../components';

interface Props extends ThemeProps {
  className?: string;
  account: DeriveAccountInfo | undefined;
  accountsInfo?: DeriveAccountInfo[] | undefined;
  addresesOnThisChain?: nameAddress[];
  api: ApiPromise | undefined;
  chain: Chain | null;
  recoveryConsts?: RecoveryConsts | undefined;
  recoveryInfo?: PalletRecoveryRecoveryConfig | null | undefined;
  rescuer: Rescuer | null | undefined;
  showConfigureModal: boolean;
  setConfigureModalOpen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  recoveryStatus?: string;
}

function Configure({ account, accountsInfo, addresesOnThisChain, api, chain, className, recoveryConsts, recoveryInfo, recoveryStatus, rescuer, setConfigureModalOpen, showConfigureModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [tabValue, setTabValue] = useState('configuration');
  const [status, setStatus] = useState<string | undefined>(recoveryStatus);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setConfigureModalOpen(false);
  }, [setConfigureModalOpen]);

  const ConfigureTabIcon = () => (
    <>
      {status === 'makeRecoverable' && <AddModeratorOutlinedIcon fontSize='small' />}
      {status === 'removeRecovery' && <VerifiedUserOutlinedIcon fontSize='small' />}
      {status === 'closeRecovery' && <GppMaybeOutlinedIcon fontSize='small' />}
      {!status && <PolicyOutlinedIcon fontSize='small' />}
    </>
  );

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfigureModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<SecurityIcon fontSize='small' />} title={t<string>('Configure my account')} />
      <Grid alignItems='center' container sx={{ px: '30px' }}>
        <Grid item sx={{ borderBottom: 1, borderColor: 'divider' }} xs={12}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab icon={<ConfigureTabIcon />} iconPosition='start' label={'Configuration'} sx={{ fontSize: 11 }} value='configuration' />
            <Tab icon={<InfoOutlinedIcon fontSize='small' />} iconPosition='start' label='Info' sx={{ fontSize: 11 }} value='info' />
          </Tabs>
        </Grid>
        {tabValue === 'configuration' && ((status === 'closeRecovery' && !rescuer) || !status) &&
          <RecoveryChecking
            recoveryInfo={recoveryInfo}
            rescuer={rescuer}
            setStatus={setStatus}
          />
        }
        {api && tabValue === 'configuration' && recoveryInfo !== undefined && status && ['makeRecoverable', 'removeRecovery'].includes(status) && account &&
          <RecoverableTab
            account={account}
            accountsInfo={accountsInfo}
            addresesOnThisChain={addresesOnThisChain}
            api={api}
            chain={chain}
            recoveryConsts={recoveryConsts}
            recoveryInfo={recoveryInfo}
          />
        }
        {tabValue === 'configuration' && status && status === 'closeRecovery' && rescuer && chain && account &&
          <CloseRecoveryTab
            account={account}
            api={api}
            chain={chain}
            rescuer={rescuer}
          />
        }
        {tabValue === 'info' &&
          <InfoTab
            api={api}
            recoveryConsts={recoveryConsts}
          />
        }
      </Grid>
    </Popup>
  );
}

export default styled(Configure)`
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
