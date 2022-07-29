// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens rescuer page, where a rescuer can initiate, claim, close and finally withdraw a recovery
 * */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo, DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { PalletRecoveryActiveRecovery, PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { HealthAndSafetyOutlined as HealthAndSafetyOutlinedIcon } from '@mui/icons-material';
import { Divider, Grid, Step, StepLabel, Stepper, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';
import { Button } from '@polkadot/extension-ui/components';
import { BN, BN_ZERO } from '@polkadot/util';
import { encodeAddress } from '@polkadot/util-crypto';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress, ShowBalance2, ShowValue } from '../../components';
import { nameAddress, RecoveryConsts, Rescuer, Voucher } from '../../util/plusTypes';
import { remainingTimeCountDown } from '../../util/plusUtils';
import { getVouchers } from '../../util/subquery';
import AddNewAccount from './AddNewAccount';
import Confirm from './Confirm';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  chain: Chain | null;
  className?: string;
  handleCloseAsRescuer: () => void
  showAsRescuerModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
  lastLostAccount?: DeriveAccountInfo;
}

const steps = ['Initiate', 'Wait', 'Withdraw'];
const STEP_MAP = { INIT: 0, WAIT: 1, WITHDRAW: 2 };

function AsRescuer({ account, accountsInfo, addresesOnThisChain, api, chain, handleCloseAsRescuer, lastLostAccount, recoveryConsts, showAsRescuerModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>(lastLostAccount);
  const [lostAccountHelperText, setLostAccountHelperText] = useState<string | undefined>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [lostAccountBalance, setLostAccountBalance] = useState<DeriveBalancesAll | undefined>();
  const [lostAccountLedger, setLostAccountLedger] = useState<StakingLedger | undefined | null>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [hasActiveRecoveries, setHasActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined | null>();
  const [isProxy, setIsProxy] = useState<boolean | undefined>();
  const [remainingBlocksToClaim, setRemainingBlocksToClaim] = useState<number | undefined>();
  const [remainingSecondsToClaim, setRemainingSecondsToClaim] = useState<number | undefined>();
  const [friendsAccountsInfo, setfriendsAccountsInfo] = useState<DeriveAccountInfo[] | undefined>();
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});
  const [currentEraIndex, setCurrentEraIndex] = useState<number | undefined>();
  const [redeemable, setRedeemable] = useState<BN | undefined>();
  const [unlocking, setUnlocking] = useState<BN | undefined>();
  const [spanCount, setSpanCount] = useState<number | undefined>();
  const [nextIsDisabled, setNextIsDisabled] = useState<boolean>(true);
  const [otherPossibleRescuers, setOtherPossibleRescuers] = useState<Rescuer[] | undefined>();
  const [receivedVouchers, setReceivedVouchers] = useState<number | undefined>();

  const otherPossibleRescuersDeposit = useMemo((): BN | undefined => {
    if (!otherPossibleRescuers?.length) {
      return;
    }

    let d = BN_ZERO;

    for (let i = 0; i < otherPossibleRescuers.length; i++) {
      d = d.add(otherPossibleRescuers[i]?.option?.deposit ?? BN_ZERO);
    }

    return (d);
  }, [otherPossibleRescuers]);

  const totalWithdrawable = useMemo((): BN => {
    return (lostAccountBalance?.availableBalance ?? BN_ZERO).add(redeemable ?? BN_ZERO).add(lostAccountRecoveryInfo?.deposit ?? BN_ZERO).add(otherPossibleRescuersDeposit ?? BN_ZERO);
  }, [lostAccountBalance, redeemable, lostAccountRecoveryInfo, otherPossibleRescuersDeposit]);

  const resetPage = useCallback(() => {
    console.log('resetPage ...');
    setState(undefined);
    setRemainingBlocksToClaim(undefined);
    setActiveStep(STEP_MAP.INIT);
    setCompleted({});
    setLostAccountHelperText(undefined);
    setIsProxy(undefined);
    setLostAccountRecoveryInfo(undefined);
    setLostAccountBalance(undefined);
    setHasActiveRecoveries(undefined);
  }, []);

  useEffect((): void => {
    console.log('activeStep ...', activeStep);
  }, [activeStep]);

  const handleNext = useCallback(() => {
    !state && setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, [state]);

  useEffect((): void => {
    const chainName = chain?.name.replace(' Relay Chain', '');

    chainName && lostAccount?.accountId && account?.accountId && lostAccountRecoveryInfo &&
      getVouchers(chainName, lostAccount.accountId, account.accountId).then((vouchers: Voucher[]) => {
        console.log('vouchers:', vouchers);
        let voucheCount = 0;

        for (let i = 0; i < vouchers?.length; i++) {
          if (lostAccountRecoveryInfo.friends.find((f) => String(f) === vouchers[i].friend)) {
            voucheCount++;
          }
        }

        setReceivedVouchers(voucheCount);
        console.log('voucheCount:', voucheCount);
      });
  }, [hasActiveRecoveries, lostAccount, account, lostAccountRecoveryInfo]);

  useEffect((): void => {
    remainingSecondsToClaim && remainingSecondsToClaim > 0 && setTimeout(() => setRemainingSecondsToClaim((remainingSecondsToClaim) => remainingSecondsToClaim - 1), 1000);
  }, [remainingSecondsToClaim]);

  useEffect((): void => {
    remainingBlocksToClaim && setRemainingSecondsToClaim(remainingBlocksToClaim * 6);
  }, [remainingBlocksToClaim]);

  useEffect((): void => {
    if (activeStep === STEP_MAP.WITHDRAW && totalWithdrawable?.gtn(0)) {
      return setNextIsDisabled(false);
    }

    if (activeStep === STEP_MAP.INIT && lostAccountRecoveryInfo && hasActiveRecoveries === null) {
      return setNextIsDisabled(false);
    }

    setNextIsDisabled(true);
  }, [activeStep, hasActiveRecoveries, lostAccount, lostAccountRecoveryInfo, totalWithdrawable]);

  useEffect((): void => {
    api && hasActiveRecoveries && lostAccountRecoveryInfo && api.rpc.chain.getHeader().then((h) => {
      const currentBlockNumber = h.number.toNumber();
      const initiateRecoveryBlock = hasActiveRecoveries.created.toNumber();
      const delayPeriod = lostAccountRecoveryInfo.delayPeriod.toNumber();

      setRemainingBlocksToClaim(initiateRecoveryBlock + delayPeriod - currentBlockNumber);
    });
  }, [api, hasActiveRecoveries, lostAccountRecoveryInfo]);

  useEffect((): void => {
    if (isProxy ||
      (receivedVouchers && lostAccountRecoveryInfo && receivedVouchers >= lostAccountRecoveryInfo.threshold.toNumber() && remainingBlocksToClaim !== undefined && remainingBlocksToClaim <= 0)
    ) {
      const newCompleted = completed;

      completed[STEP_MAP.INIT] = true;
      completed[STEP_MAP.WAIT] = true;
      setCompleted(newCompleted);
      setActiveStep(STEP_MAP.WITHDRAW);

      return;
    }

    if (hasActiveRecoveries) {
      const newCompleted = completed;

      completed[STEP_MAP.INIT] = true;
      setCompleted(newCompleted);
      setActiveStep(STEP_MAP.WAIT);
    }
  }, [completed, hasActiveRecoveries, isProxy, lostAccountRecoveryInfo, receivedVouchers, remainingBlocksToClaim]);

  useEffect((): void => {
    if (activeStep === STEP_MAP.WITHDRAW && isProxy === false) {
      return setState('withdrawWithClaim');
    }

    if (activeStep === STEP_MAP.WITHDRAW) {
      return setState('withdrawAsRecovered');
    }
  }, [activeStep, isProxy]);

  useEffect((): void => {
    // eslint-disable-next-line no-void
    api && void api.query.staking.currentEra().then((ce) => {
      setCurrentEraIndex(Number(ce));
    });
  }, [api]);

  useEffect((): void => {
    // get the lost account balances
    // eslint-disable-next-line no-void
    lostAccount?.accountId && activeStep === STEP_MAP.WITHDRAW && api && void api.derive.balances?.all(lostAccount.accountId).then((b) => {
      setLostAccountBalance(b);
      console.log('lost balances b', JSON.parse(JSON.stringify(b)));

      // eslint-disable-next-line no-void
      void api.query.staking.ledger(lostAccount.accountId).then((l) => {
        setLostAccountLedger(l.isSome ? l.unwrap() as unknown as StakingLedger : null);
        console.log('lost account ledger', JSON.parse(JSON.stringify(l)));
      });

      // eslint-disable-next-line no-void
      void api.query.recovery.activeRecoveries.entries().then((activeRecoveries) => {
        const otherPossibleRescuers = [];

        for (let i = 0; i < activeRecoveries.length; i++) {
          const [key, option] = activeRecoveries[i];

          if (encodeAddress('0x' + key.toString().slice(82, 146), chain?.ss58Format) === String(lostAccount.accountId)) { // if this is lostAccount Id
            const mightBeOtherRescuer = encodeAddress('0x' + key.toString().slice(162), chain?.ss58Format);

            if (mightBeOtherRescuer === account?.accountId?.toString()) { continue; } // to exclude me from the other possible rescuers list

            otherPossibleRescuers.push({
              accountId: encodeAddress('0x' + key.toString().slice(162), chain?.ss58Format),
              option: option.isSome ? option.unwrap() as unknown as PalletRecoveryActiveRecovery : undefined
            } as unknown as Rescuer);
          }
        }

        setOtherPossibleRescuers(otherPossibleRescuers);
      });
    });
  }, [account, isProxy, api, lostAccount, chain?.ss58Format, activeStep]);

  useEffect((): void => {
    if (!lostAccountLedger || !currentEraIndex || !lostAccount?.accountId) {
      return;
    }

    let unlockingValue = BN_ZERO;
    let redeemValue = BN_ZERO;

    for (const item of lostAccountLedger.unlocking) {
      if (currentEraIndex > Number(item.era)) {
        redeemValue = redeemValue.add(item.value.unwrap());
      } else {
        unlockingValue = unlockingValue.add(item.value.unwrap());
      }
    }

    !redeemValue.isZero() && api && api.query.staking.slashingSpans(lostAccount.accountId).then((optSpans) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      setSpanCount(optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1);
    });

    setUnlocking(unlockingValue);
    setRedeemable(redeemValue);
  }, [api, currentEraIndex, lostAccount?.accountId, lostAccountLedger]);

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
      setLostAccountRecoveryInfo(r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null);
      console.log('is lost account recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'null');
    });
  }, [api, lostAccount]);

  useEffect(() => {
    !lostAccount && resetPage();
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
        setHasActiveRecoveries(r.isSome ? r.unwrap() as unknown as alletRecoveryActiveRecovery : null);
        console.log('hasActiveRecoveries:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
      });
    }

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(account.accountId).then((r) => {
      const proxy = r.isSome ? String(r.unwrap()) : null;

      setIsProxy(proxy === String(lostAccount.accountId));
      console.log(`is a proxy ${proxy === String(lostAccount.accountId)} proxy address:${r.isSome ? r.unwrap().toString() : ''}`);
    });
  }, [account?.accountId, api, chain?.ss58Format, lostAccount, lostAccountRecoveryInfo]);

  useEffect(() => {
    if (lostAccountRecoveryInfo === undefined || !lostAccount || hasActiveRecoveries === undefined || isProxy === undefined) {
      return;
    }

    if (lostAccountRecoveryInfo === null && activeStep === STEP_MAP.INIT) {
      return setLostAccountHelperText(t<string>('The account is NOT recoverable'));
    }

    if (activeStep === STEP_MAP.INIT && api && recoveryConsts) {
      return setLostAccountHelperText(t<string>('Proceed to initiate recovery, {{deposit}} needs to be deposited', { replace: { deposit: api.createType('Balance', recoveryConsts?.recoveryDeposit).toHuman() } }));
    }

    if (activeStep === STEP_MAP.WAIT) {
      return setLostAccountHelperText(t<string>('Wait until the condition(s) will be met'));
    }

    if (activeStep === STEP_MAP.WITHDRAW) {
      return setLostAccountHelperText(t<string>('The lost account\'s balance(s) can be withdrawn'));
    }
  }, [hasActiveRecoveries, isProxy, lostAccount, lostAccountRecoveryInfo, remainingBlocksToClaim, t, receivedVouchers, activeStep, recoveryConsts, api]);

  return (
    <Popup handleClose={handleCloseAsRescuer} showModal={showAsRescuerModal}>
      <PlusHeader action={handleCloseAsRescuer} chain={chain} closeText={'Close'} icon={<HealthAndSafetyOutlinedIcon fontSize='small' />} title={'Rescue account'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item sx={{ borderBottom: 1, borderColor: 'divider', pb: '15px' }} xs={12}>
          <Stepper activeStep={activeStep} nonLinear>
            {steps.map((label, index) =>
              <Step completed={completed[index]} key={label}>
                <StepLabel>{label}</StepLabel>
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
            <> {lostAccountHelperText && (lostAccountRecoveryInfo === null || receivedVouchers !== undefined)
              ? <Grid fontSize={15} fontWeight={600} item pt='85px' textAlign='center'>
                {lostAccountHelperText}
              </Grid>
              : <Progress pt={1} title={t('Checking the account')} />
            }
            </>
          }
          {activeStep === STEP_MAP.WAIT && lostAccountRecoveryInfo && receivedVouchers !== undefined &&
            <Grid container fontSize={13} fontWeight={350} item p='10px' textAlign='center'>
              <Grid item xs={12}>
                <Divider light />
              </Grid>
              <Grid item pt='10px' xs={12}>
                <ShowValue title={('Remaining time')} value={remainingTimeCountDown(remainingSecondsToClaim)} />
              </Grid>
              <Grid item xs={12}>
                <ShowValue title={('Received vouchers')} value={`${receivedVouchers ?? 0}/${String(lostAccountRecoveryInfo.threshold)}`} />
              </Grid>
            </Grid>
          }
          {activeStep === STEP_MAP.WITHDRAW && lostAccountBalance &&
            <Grid container item justifyContent='center' sx={{ fontSize: 12 }} textAlign='center'>
              <Grid item xs={12}>
                <Divider light />
              </Grid>
              <Grid container item justifyContent='space-between' p='10px 20px 5px'>
                <Grid item>
                  <ShowBalance2 api={api} balance={lostAccountBalance.freeBalance.add(lostAccountBalance.reservedBalance)} title={t('Total')} />
                </Grid>
                <Grid item>
                  <ShowBalance2 api={api} balance={lostAccountBalance.availableBalance} title={t('Available')} />
                </Grid>
                <Grid item>
                  <ShowBalance2 api={api} balance={lostAccountBalance.reservedBalance} title={t('Reserved')} />
                </Grid>
              </Grid>
              {lostAccountLedger &&
                <Grid container item justifyContent='space-between' p='5px 20px'>
                  <Grid item>
                    <ShowBalance2 api={api} balance={lostAccountLedger.active.unwrap()} title={t('Staked')} />
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={redeemable} title={t('Redeemable')} />
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={unlocking} title={t('Unlocking')} />
                  </Grid>
                </Grid>
              }
              {!!otherPossibleRescuers?.length &&
                <Grid container item justifyContent='space-between' p='5px 20px'>
                  <Grid item>
                    <ShowValue direction='column' title={t('#Other rescuer(s)')} value={otherPossibleRescuers.length} />
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={otherPossibleRescuersDeposit} title={t('Total deposited')} />
                  </Grid>
                </Grid>
              }
            </Grid>
          }
        </Grid>
        <Grid item pt='10px' xs={12}>
          <Button
            data-button-action=''
            isDisabled={nextIsDisabled}
            onClick={handleNext}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {showConfirmModal && api && chain && state && account && lostAccount && recoveryConsts &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          friends={friendsAccountsInfo}
          lostAccount={lostAccount}
          otherPossibleRescuers={otherPossibleRescuers}
          recoveryConsts={recoveryConsts}
          recoveryDelay={lostAccountRecoveryInfo?.delayPeriod ? parseFloat((lostAccountRecoveryInfo.delayPeriod.toNumber() / (24 * 60 * 10)).toFixed(4)) : 0}
          recoveryThreshold={lostAccountRecoveryInfo?.threshold?.toNumber()}
          rescuer={{ ...account, option: hasActiveRecoveries ?? undefined }}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
          withdrawAmounts={{
            available: lostAccountBalance?.availableBalance ?? BN_ZERO,
            redeemable: redeemable ?? BN_ZERO,
            spanCount: spanCount ?? 0,
            staked: lostAccountLedger?.active?.unwrap() ?? BN_ZERO,
            totalWithdrawable
          }}
        />
      }
    </Popup>
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
