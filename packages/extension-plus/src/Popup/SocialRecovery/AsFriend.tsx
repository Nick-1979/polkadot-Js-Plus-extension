/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens friend page, where a friend can vouch for a lost account for a rescuer account
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon } from '@mui/icons-material';
import { Typography, Grid } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../components';
import type { ApiPromise } from '@polkadot/api';
import type { PalletRecoveryRecoveryConfig, PalletRecoveryActiveRecovery } from '@polkadot/types/lookup';

import { nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';
import Confirm from './Confirm';
import AddNewAccount from './AddNewAccount';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  chain: Chain | null;
  className?: string;
  handleCloseAsFriend: () => void
  showAsFriendModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
}

function AsFriend({ account, accountsInfo, addresesOnThisChain, api, chain, handleCloseAsFriend, recoveryConsts, showAsFriendModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [lostAccountHelperText, setLostAccountHelperText] = useState<string | undefined>();
  const [rescuerAccount, setRescuerAccount] = useState<DeriveAccountInfo | undefined>();
  const [rescuerAccountHelperText, setRescuerAccountHelperText] = useState<string | undefined>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [hasActiveRecoveries, setHasActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined | null>();
  const [isProxy, setIsProxy] = useState<boolean | undefined | null>();
  const [friendsAccountsInfo, setfriendsAccountsInfo] = useState<DeriveAccountInfo[] | undefined>();
  const [isFriend, setIsFriend] = useState<boolean | undefined>();

  const handleNextToInitiateRecovery = useCallback(() => {
    setState('vouchRecovery');
    setConfirmModalOpen(true);
  }, []);

  useEffect(() => {
    if (api && lostAccountRecoveryInfo?.friends) {
      Promise.all(
        lostAccountRecoveryInfo.friends.map((f) => api.derive.accounts.info(f))
      ).then((info) => setfriendsAccountsInfo(info))
        .catch(console.error);
    }
  }, [lostAccountRecoveryInfo, api]);

  useEffect(() => {
    if (lostAccountRecoveryInfo?.friends && account?.accountId) {
      const friendIndex = lostAccountRecoveryInfo.friends.findIndex((f) => f.toString() === account.accountId.toString());

      setIsFriend(friendIndex >= 0);
    }
  }, [account?.accountId, lostAccountRecoveryInfo]);

  const clearHelperTexts = useCallback(() => {
    setRescuerAccountHelperText(undefined);
    setLostAccountHelperText(undefined);
  }, []);

  useEffect(() => {
    if (!lostAccount) {
      clearHelperTexts();
      setIsFriend(undefined);
    }
  }, [clearHelperTexts, lostAccount]);

  useEffect(() => {
    if (!api || !lostAccount) { return; }

    // eslint-disable-next-line no-void
    void api.query.recovery.recoverable(lostAccount.accountId).then((r) => {
      setLostAccountRecoveryInfo(r.isSome ? r.unwrap() : null);
      console.log('is lost account recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [api, lostAccount]);

  useEffect(() => {
    if (lostAccount) {
      if (lostAccountRecoveryInfo === undefined) {
        return;
      }

      if (lostAccountRecoveryInfo === null) {
        return setLostAccountHelperText(t<string>('The account is not recoverable'));
      }

      setLostAccountHelperText(t<string>('The account is recoverable'));
    }
  }, [lostAccount, lostAccountRecoveryInfo, t]);

  useEffect(() => {
    if (rescuerAccount && lostAccountRecoveryInfo) {
      if (hasActiveRecoveries === undefined) {
        return;
      }

      if (hasActiveRecoveries === null) {
        return setRescuerAccountHelperText(t<string>('Account recovery for the lost account has not been initiated by this rescuer'));
      }

      setRescuerAccountHelperText(t<string>('The rescuer has initiated the recovery, proceed'));
    }
  }, [hasActiveRecoveries, lostAccountRecoveryInfo, rescuerAccount, t]);

  useEffect(() => {
    if (!api || !rescuerAccount?.accountId || !lostAccount || !lostAccountRecoveryInfo) { return; }

    const hasActiveRecoveries = api.query.recovery.activeRecoveries;

    // eslint-disable-next-line no-void
    void hasActiveRecoveries(lostAccount.accountId, rescuerAccount.accountId).then((r) => {
      setHasActiveRecoveries(r.isSome ? r.unwrap() : null);
      console.log('hasActiveRecoveries:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(rescuerAccount.accountId).then((r) => {
      const proxy = r.isSome ? r.unwrap().toString() : null;

      setIsProxy(proxy === lostAccount.accountId);
    });
  }, [api, lostAccount, lostAccountRecoveryInfo, rescuerAccount]);

  return (
    <Popup handleClose={handleCloseAsFriend} showModal={showAsFriendModal}>
      <PlusHeader action={handleCloseAsFriend} chain={chain} closeText={'Close'} icon={<AdminPanelSettingsOutlinedIcon fontSize='small' />} title={'Vouch account'} />
      <Grid container sx={{ p: '15px 20px' }}>
        <Grid item pt='15px' sx={{ height: '440px' }} xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle2'>
            {t<string>('Enter the lost account Id (identity), you want to vouch for')}:
          </Typography>
          <AddNewAccount account={lostAccount} accountsInfo={accountsInfo} addresesOnThisChain={addresesOnThisChain} chain={chain} helperText={lostAccountHelperText} label={t('Lost')} setAccount={setLostAccount} />
          {lostAccount && lostAccountRecoveryInfo && isFriend === false &&
            <Grid pt='85px' textAlign='center'>
              <Typography sx={{ color: 'error.main', p: '50px 10px 10px' }} variant='subtitle2'>
                {t<string>('You are not registered as a friend of the lost account!')}
              </Typography>
            </Grid>
          }
          {lostAccount && lostAccountRecoveryInfo && isFriend &&
            <>
              <Typography sx={{ color: 'text.primary', p: '30px 10px 10px' }} variant='subtitle2'>
                {t<string>('Enter the rescuer account Id (identity)')}:
              </Typography>
              <AddNewAccount account={rescuerAccount} accountsInfo={accountsInfo} addresesOnThisChain={addresesOnThisChain} chain={chain} label={t('Rescuer')} setAccount={setRescuerAccount} />
              {rescuerAccount &&
                <> {rescuerAccountHelperText
                  ? <Grid pt='85px' textAlign='center' fontSize={15} fontWeight={600}>
                      {rescuerAccountHelperText}
                  </Grid>
                  : <Progress pt={1} title={t('Checking the resuer account')} />
                }
                </>
              }
            </>
          }
        </Grid>
        <Grid item sx={{ pt: 3 }} xs={12}>
          <Button
            data-button-action=''
            isDisabled={!lostAccount || !lostAccountRecoveryInfo || !hasActiveRecoveries || !!isProxy}
            onClick={handleNextToInitiateRecovery}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {showConfirmModal && api && chain && state && account && lostAccount && rescuerAccount && recoveryConsts && lostAccountRecoveryInfo &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          friends={friendsAccountsInfo}
          lostAccount={lostAccount}
          recoveryConsts={recoveryConsts}
          recoveryDelay={lostAccountRecoveryInfo?.delayPeriod ? parseFloat((lostAccountRecoveryInfo.delayPeriod.toNumber() / (24 * 60 * 10)).toFixed(4)) : 0}
          recoveryThreshold={lostAccountRecoveryInfo.threshold.toNumber()}
          rescuer={rescuerAccount}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
        />
      }
    </Popup>
  );
}

export default styled(AsFriend)`
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
