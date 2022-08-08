// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens friend page, where a friend can vouch for a lost account for a rescuer account
 * */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { PalletRecoveryActiveRecovery, PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon } from '@mui/icons-material';
import { Alert, Grid, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';
import { NextStepButton } from '@polkadot/extension-ui/components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../components';
import { AlertType, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import AddNewAccount from './AddNewAccount';
import Confirm from './Confirm';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  chain: Chain;
  className?: string;
  handleCloseAsFriend: () => void
  showAsFriendModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
}

function AsFriend({ account, accountsInfo, addresesOnThisChain, api, chain, handleCloseAsFriend, recoveryConsts, showAsFriendModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [lostAccountHelperText, setLostAccountHelperText] = useState<AlertType | undefined>();
  const [rescuerAccount, setRescuerAccount] = useState<DeriveAccountInfo | undefined>();
  const [rescuerAccountHelperText, setRescuerAccountHelperText] = useState<AlertType | undefined>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [activeRecoveries, setActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined | null>();
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
      setIsFriend(!!lostAccountRecoveryInfo.friends.find((f) => f.toString() === account.accountId?.toString()));
    }
  }, [account?.accountId, lostAccountRecoveryInfo]);

  useEffect(() => {
    if (!lostAccount) {
      setRescuerAccountHelperText(undefined);
      setLostAccountHelperText(undefined);
      setIsFriend(undefined);
      setActiveRecoveries(undefined);
      setLostAccountRecoveryInfo(undefined);
    }
  }, [lostAccount]);

  useEffect(() => {
    if (!rescuerAccount) {
      setRescuerAccountHelperText(undefined);
      setActiveRecoveries(undefined);
    }
  }, [rescuerAccount]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    api && lostAccount && void api.query.recovery.recoverable(lostAccount.accountId).then((r) => {
      setLostAccountRecoveryInfo(r.isSome ? r.unwrap() : null);
      console.log('is lost account recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [api, lostAccount]);

  useEffect(() => {
    if (lostAccountRecoveryInfo === undefined || !t) {
      return;
    }

    if (lostAccountRecoveryInfo === null) {
      return setLostAccountHelperText({ severity: 'error', text: t<string>('The account is not recoverable') });
    }

    setLostAccountHelperText({ severity: 'success', text: t<string>('The account is recoverable') });
  }, [lostAccountRecoveryInfo, t]);

  useEffect(() => {
    if (activeRecoveries === undefined) {
      return;
    }

    if (activeRecoveries === null) {
      return setRescuerAccountHelperText({ severity: 'error', text: t<string>('Account recovery for the lost account has not been initiated by this rescuer') });
    }

    if (activeRecoveries.friends.find((f) => String(f) === String(account?.accountId))) {
      return setRescuerAccountHelperText({ severity: 'warning', text: t<string>('You have already vouched for these accounts!') });
    }

    setRescuerAccountHelperText({ severity: 'info', text: t<string>('The rescuer has initiated the recovery, proceed') });
  }, [account?.accountId, activeRecoveries, t]);

  useEffect(() => {
    if (!api || !rescuerAccount?.accountId || !lostAccount) {
      return;
    }

    const activeRecoveries = api.query.recovery.activeRecoveries;

    // eslint-disable-next-line no-void
    void activeRecoveries(lostAccount.accountId, rescuerAccount.accountId).then((r) => {
      setActiveRecoveries(r.isSome ? r.unwrap() : null);
      console.log('activeRecoveries:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(rescuerAccount.accountId).then((r) => {
      const proxy = r.isSome ? r.unwrap().toString() : null;

      setIsProxy(proxy === lostAccount.accountId);
    });
  }, [api, lostAccount, rescuerAccount]);

  return (
    <Popup handleClose={handleCloseAsFriend} showModal={showAsFriendModal}>
      <PlusHeader action={handleCloseAsFriend} chain={chain} closeText={'Close'} icon={<AdminPanelSettingsOutlinedIcon fontSize='small' />} title={'Vouch account'} />
      <Grid container sx={{ p: '15px 20px' }}>
        <Grid item pt='15px' sx={{ height: '440px' }} xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle2'>
            {t<string>('Enter the lost account address (or identity) that you want to vouch for')}:
          </Typography>
          <AddNewAccount account={lostAccount} accountsInfo={accountsInfo} addresesOnThisChain={addresesOnThisChain} chain={chain} helperText={lostAccountHelperText?.text} label={t('Lost')} setAccount={setLostAccount} />
          {lostAccount && lostAccountRecoveryInfo && isFriend === false &&
            <Grid fontSize={15} fontWeight={600} pt='85px' textAlign='center'>
              <Alert severity='error'>
                {t<string>('You are not registered as a friend of the lost account!')}
              </Alert>
            </Grid>
          }
          {lostAccount && !lostAccountRecoveryInfo &&
            <>
              {lostAccountRecoveryInfo === null && lostAccountHelperText
                ? <Grid fontSize={15} fontWeight={600} pt='85px' textAlign='center'>
                  <Alert severity={lostAccountHelperText.severity}>{lostAccountHelperText.text}</Alert>
                </Grid>
                : <Progress pt={1} title={t('Checking the lost account')} />
              }
            </>
          }
          {lostAccount && lostAccountRecoveryInfo && isFriend &&
            <>
              <Typography sx={{ color: 'text.primary', p: '30px 10px 10px' }} variant='subtitle2'>
                {t<string>('Enter the rescuer account address (or search by identity)')}:
              </Typography>
              <AddNewAccount account={rescuerAccount} accountsInfo={accountsInfo} addresesOnThisChain={addresesOnThisChain} chain={chain} label={t('Rescuer')} setAccount={setRescuerAccount} />
              {rescuerAccount &&
                <> {rescuerAccountHelperText
                  ? <Grid fontSize={15} fontWeight={600} pt='85px' textAlign='center'>
                    <Alert severity={rescuerAccountHelperText.severity}>{rescuerAccountHelperText.text}</Alert>
                  </Grid>
                  : <Progress pt={1} title={t('Checking the resuer account')} />
                }
                </>
              }
            </>
          }
        </Grid>
        <Grid item sx={{ pt: 3 }} xs={12}>
          <NextStepButton
            data-button-action=''
            isDisabled={!lostAccount || !lostAccountRecoveryInfo || !activeRecoveries || !!isProxy}
            onClick={handleNextToInitiateRecovery}
          >
            {t<string>('Next')}
          </NextStepButton>
        </Grid>
      </Grid>
      {showConfirmModal && api && state && account && lostAccount && rescuerAccount && recoveryConsts && lostAccountRecoveryInfo &&
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
