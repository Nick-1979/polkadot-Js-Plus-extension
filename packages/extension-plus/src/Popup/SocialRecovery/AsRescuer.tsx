/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens rescuer page, where a rescuer can initiate, claim, and finally close a recovery
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Support as SupportIcon } from '@mui/icons-material';
import { Typography, Grid, Stepper, Step, StepButton } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../components';
import type { ApiPromise } from '@polkadot/api';
import type { PalletRecoveryRecoveryConfig, PalletRecoveryActiveRecovery } from '@polkadot/types/lookup';

import { AddressState, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';
import Confirm from './Confirm';
import AddNewAccount from './AddNewAccount';
import { remainingTime } from '../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  className?: string;
  handleCloseAsRescuer: () => void
  showAsRescuerModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
}

const steps = ['Initiate recovery', 'Claim recovery', 'Close recovery'];

function AsRescuer({ account, accountsInfo, addresesOnThisChain, api, handleCloseAsRescuer, recoveryConsts, showAsRescuerModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [lostAccountHelperText, setLostAccountHelperText] = useState<string | undefined>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [hasActiveRecoveries, setHasActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined | null>();
  const [isProxy, setIsProxy] = useState<boolean | undefined>();
  const [remainingBlocksToClaim, setRemainingBlocksToClaim] = useState<number | undefined>();
  const [friendsAccountsInfo, setfriendsAccountsInfo] = useState<DeriveAccountInfo[] | undefined>();
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});

  const resetPage = useCallback(() => {
    console.log('resetPage ...');

    setRemainingBlocksToClaim(undefined);
    setActiveStep(0);
    setCompleted({});
    setLostAccountHelperText(undefined);
    setIsProxy(undefined);
    setLostAccountRecoveryInfo(undefined);
  }, []);

  const handleNext = useCallback(() => {
    !state && setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, [state]);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  useEffect((): void => {
    api && hasActiveRecoveries && lostAccountRecoveryInfo && api.rpc.chain.getHeader().then((h) => {
      const currentBlockNumber = h.number.toNumber();
      const initiateRecoveryBlock = hasActiveRecoveries.created.toNumber();
      const delayPeriod = lostAccountRecoveryInfo.delayPeriod.toNumber();

      setRemainingBlocksToClaim(initiateRecoveryBlock + delayPeriod - currentBlockNumber);
    });
  }, [api, hasActiveRecoveries, lostAccountRecoveryInfo]);

  useEffect((): void => {
    if (isProxy) {
      if (hasActiveRecoveries) {
        const newCompleted = completed;

        completed[0] = true;
        completed[1] = true;
        setCompleted(newCompleted);
        setActiveStep(2);
      } else {
        const newCompleted = completed;

        completed[0] = true;
        completed[1] = true;
        completed[2] = true;
        setCompleted(newCompleted);
      }
    } else if (remainingBlocksToClaim && remainingBlocksToClaim <= 0) {
      const newCompleted = completed;

      completed[0] = true;
      setCompleted(newCompleted);
      setActiveStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProxy, remainingBlocksToClaim]);

  useEffect((): void => {
    if (activeStep === 1) {
      return setState('claimRecovery');
    }

    if (activeStep === 2) {
      return setState('closeRecovery');
    }
  }, [activeStep]);

  useEffect(() => {
    if (api && lostAccountRecoveryInfo?.friends) {
      Promise.all(
        lostAccountRecoveryInfo.friends.map((f) => api.derive.accounts.info(f))
      ).then((info) => setfriendsAccountsInfo(info))
        .catch(console.error);
    }
  }, [lostAccountRecoveryInfo, api]);

  useEffect(() => {
    if (!api || !lostAccount) {
      return;
    }

    // eslint-disable-next-line no-void
    void api.query.recovery.recoverable(lostAccount.accountId).then((r) => {
      setLostAccountRecoveryInfo(r.isSome ? r.unwrap() : null);
      console.log('is lost account recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'null');
    });
  }, [api, lostAccount]);

  useEffect(() => {
    if (lostAccount === undefined) {
      resetPage();
    }
  }, [lostAccount, resetPage]);

  useEffect(() => {
    if (!api || !account?.accountId || !lostAccount || lostAccountRecoveryInfo === undefined) {
      return;
    }

    if (lostAccountRecoveryInfo === null) {
      setHasActiveRecoveries(null);
    } else {
      // eslint-disable-next-line no-void
      void api.query.recovery.activeRecoveries(lostAccount.accountId, account.accountId).then((r) => {
        setHasActiveRecoveries(r.isSome ? r.unwrap() : null);
        console.log('hasActiveRecoveries:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
      });
    }

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(account.accountId).then((r) => {
      const proxy = r.isSome ? String(r.unwrap()) : null;

      setIsProxy(proxy === String(lostAccount.accountId));
      console.log('proxy address:', r.isSome ? r.unwrap().toString() : 'noch');
      console.log('is a proxy:', proxy === String(lostAccount.accountId));
    });
  }, [account?.accountId, api, chain?.ss58Format, lostAccount, lostAccountRecoveryInfo]);

  useEffect(() => {
    if (lostAccount) {
      if (lostAccountRecoveryInfo === undefined || hasActiveRecoveries === undefined || isProxy === undefined) {
        return;
      }

      if (lostAccountRecoveryInfo === null) {
        return setLostAccountHelperText(t<string>('The account is not recoverable'));
      }

      if (hasActiveRecoveries) {
        if (isProxy) {
          return setLostAccountHelperText(t<string>('This account is a proxy of the lost account, proceed to close recovery'));
        }

        if (remainingBlocksToClaim === undefined) {
          return;
        }

        if (remainingBlocksToClaim > 0) {
          return setLostAccountHelperText(t<string>('Remaining time to claim recovery'));
        } else {
          return setLostAccountHelperText(t<string>('Recovery can be claimed if the vouch threshold ({{threshold}}) is satisfied', { replace: { threshold: lostAccountRecoveryInfo.threshold } }));
        }
      }

      if (isProxy) {
        return setLostAccountHelperText(t<string>('The account is already a proxy, and recvery is also closed'));
      }

      if (lostAccountRecoveryInfo) {
        return setLostAccountHelperText(t<string>('The account is recoverable, proceed to initiate recovery'));
      }

      return setLostAccountHelperText(t<string>('The account is NOT recoverable'));
    }
  }, [hasActiveRecoveries, isProxy, lostAccount, lostAccountRecoveryInfo, remainingBlocksToClaim, t]);

  return (
    <Popup handleClose={handleCloseAsRescuer} showModal={showAsRescuerModal}>
      <PlusHeader action={handleCloseAsRescuer} chain={chain} closeText={'Close'} icon={<SupportIcon fontSize='small' />} title={'Rescue account'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item sx={{ borderBottom: 1, borderColor: 'divider', pb: '15px' }} xs={12}>
          <Stepper activeStep={activeStep} nonLinear>
            {steps.map((label, index) =>
              <Step completed={completed[index]} key={label}>
                <StepButton color='inherit' onClick={handleStep(index)}>
                  {label}
                </StepButton>
              </Step>
            )}
          </Stepper>
        </Grid>
        <Grid height='395px' item pt='55px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px 10px 15px' }} variant='subtitle2'>
            {t<string>('Enter a lost account address (or search by identity)')}:
          </Typography>
          <AddNewAccount account={lostAccount} accountsInfo={accountsInfo} addresesOnThisChain={addresesOnThisChain} chain={chain} label={t('Lost')} setAccount={setLostAccount} />
          {lostAccount &&
            <> {lostAccountHelperText
              ? <Grid pt='85px' textAlign='center'>
                <Typography sx={{ color: 'text.primary' }} variant='subtitle2'>
                  {lostAccountHelperText}
                </Typography>
              </Grid>
              : <Progress pt={1} title={t('Checking the account')} />
            }
            </>
          }
          {remainingBlocksToClaim && remainingBlocksToClaim > 0 &&
            <Grid fontSize={14} fontWeight={600} pt='20px' textAlign='center'>
              {remainingTime(remainingBlocksToClaim)}
            </Grid>
          }
        </Grid>
        <Grid item pt='10px' xs={12}>
          <Button
            data-button-action=''
            isDisabled={!lostAccount || !lostAccountRecoveryInfo || completed[2] || (remainingBlocksToClaim && remainingBlocksToClaim > 0)}
            onClick={handleNext}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {
        showConfirmModal && api && chain && state && account && lostAccount && recoveryConsts && lostAccountRecoveryInfo &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          friends={friendsAccountsInfo}
          lostAccount={lostAccount}
          recoveryConsts={recoveryConsts}
          recoveryDelay={lostAccountRecoveryInfo.delayPeriod.toNumber()}
          recoveryThreshold={lostAccountRecoveryInfo.threshold.toNumber()}
          rescuer={{ ...account, 'option': { deposit: lostAccountRecoveryInfo.deposit, friends: lostAccountRecoveryInfo.friends } }}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
        />
      }
    </Popup >
  );
}

export default styled(AsRescuer)`
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
