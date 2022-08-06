// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  this component provides access to allstaking stuff,including stake,
 *  unstake, redeem, change validators, staking generak info,etc.
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';
import type { AccountsBalanceType, NominatorInfo, PutInFrontInfo, RebagInfo, RewardInfo, SavedMetaData, StakingConsts, SubQueryRewardInfo, SubscanRewardInfo, Validators } from '../../../util/plusTypes';

import { AddCircleOutlineOutlined, CheckOutlined, CircleOutlined as CircleOutlinedIcon, InfoOutlined as InfoOutlinedIcon, NotificationImportantOutlined as NotificationImportantOutlinedIcon, NotificationsActive as NotificationsActiveIcon, RemoveCircleOutlineOutlined, ReportOutlined as ReportOutlinedIcon } from '@mui/icons-material';
import { Badge, Box, CircularProgress, Grid, Tab, Tabs, Tooltip } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { BN } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../extension-ui/src/messaging';
import { PlusHeader, Popup } from '../../../components';
import getRewardsSlashes from '../../../util/api/getRewardsSlashes';
import { getStakingReward } from '../../../util/api/staking';
import { MAX_ACCEPTED_COMMISSION, MAX_REWARDS_TO_SHOW } from '../../../util/constants';
import { amountToHuman, balanceToHuman, prepareMetaData } from '../../../util/plusUtils';
import { getRewards } from '../../../util/subquery/staking';
import ConfirmStaking from './ConfirmStaking';
import InfoTab from './InfoTab';
import Nominations from './Nominations';
import Overview from './Overview';
import RewardChart from './RewardChart';
import SelectValidators from './SelectValidators';
import Stake from './Stake';
import TabPanel from './TabPanel';
import Unstake from './Unstake';

interface Props {
  account: AccountJson,
  chain: Chain;
  api: ApiPromise | undefined;
  ledger: StakingLedger | null;
  showStakingModal: boolean;
  setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
  staker: AccountsBalanceType;
  stakingConsts: StakingConsts | undefined;
  endpoint: string | undefined;
  nominatorInfo: NominatorInfo | undefined;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  validatorsInfo: Validators | undefined;
  localStrorageIsUpdate: boolean;
  currentEraIndex: number | undefined;
  gettingNominatedValidatorsInfoFromChain: boolean;
  validatorsInfoIsUpdated: boolean;
}

const workers: Worker[] = [];

BigInt.prototype.toJSON = function () {
  return this.toString()
};

export default function SoloStaking({ account, api, chain, currentEraIndex, endpoint, gettingNominatedValidatorsInfoFromChain, ledger, localStrorageIsUpdate, nominatorInfo, setStakingModalOpen, showStakingModal, staker, stakingConsts, validatorsIdentities, validatorsInfo, validatorsInfoIsUpdated }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [totalReceivedReward, setTotalReceivedReward] = useState<string>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showChartModal, setChartModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<bigint>(0n);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [currentlyStakedInHuman, setCurrentlyStakedInHuman] = useState<string | null>(null);
  const [selectedValidators, setSelectedValidatorsAcounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | null>(null);
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean>(false);
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [state, setState] = useState<string>('');
  const [tabValue, setTabValue] = useState(3);
  const [unstakeAmount, setUnstakeAmount] = useState<bigint>(0n);
  const [unlockingAmount, setUnlockingAmount] = useState<bigint>(0n);
  const [oversubscribedsCount, setOversubscribedsCount] = useState<number | undefined>();
  const [activeValidator, setActiveValidator] = useState<DeriveStakingQuery>();
  const [rewardsInfo, setRewardsInfo] = useState<RewardInfo[]>([]);
  const [rebagInfo, setRebagInfo] = useState<RebagInfo | undefined>();
  const [putInFrontInfo, setPutInFrontOfInfo] = useState<PutInFrontInfo | undefined>();
  const [redeemable, setRedeemable] = useState<bigint | null>(null);

  const decimals = api && api.registry.chainDecimals[0];
  const chainName = chain?.name.replace(' Relay Chain', '');

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const checkNeedsTuneUp = useCallback((endpoint: string, stakerAddress: string) => {
    checkNeedsRebag(endpoint, stakerAddress);
    checkNeedsPutInFrontOf(endpoint, stakerAddress);
  }, []);

  const checkNeedsRebag = (endpoint: string, stakerAddress: string) => {
    const needsRebag: Worker = new Worker(new URL('../../../util/workers/needsRebag.js', import.meta.url));

    workers.push(needsRebag);

    needsRebag.postMessage({ endpoint, stakerAddress });

    needsRebag.onerror = (err) => {
      console.log(err);
    };

    needsRebag.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info: RebagInfo | undefined = e.data;

      setRebagInfo(info);

      needsRebag.terminate();
    };
  };

  const checkNeedsPutInFrontOf = (endpoint: string, stakerAddress: string) => {
    const needsPutInFrontOf: Worker = new Worker(new URL('../../../util/workers/needsPutInFrontOf.js', import.meta.url));

    workers.push(needsPutInFrontOf);

    needsPutInFrontOf.postMessage({ endpoint, stakerAddress });

    needsPutInFrontOf.onerror = (err) => {
      console.log(err);
    };

    needsPutInFrontOf.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const lighter: string | undefined = e.data;

      lighter && console.log('lighter to runPutInFrontOf:', lighter);

      setPutInFrontOfInfo({ lighter, shouldPutInFront: !!lighter });
      needsPutInFrontOf.terminate();
    };
  };

  const getRedeemable = useCallback((): void => {
    if (!endpoint || !staker.address) {
      return;
    }

    const address = staker.address;
    const getRedeemableWorker: Worker = new Worker(new URL('../../../util/workers/getRedeemable.js', import.meta.url));

    workers.push(getRedeemableWorker);

    getRedeemableWorker.postMessage({ address, endpoint });

    getRedeemableWorker.onerror = (err) => {
      console.log(err);
    };

    getRedeemableWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const stakingAccount: string = e.data;
      const rcvdRedeemable = JSON.parse(stakingAccount)?.redeemable as string;

      if (rcvdRedeemable) {
        setRedeemable(BigInt(rcvdRedeemable));
      } else {
        setRedeemable(0n);
      }

      getRedeemableWorker.terminate();
    };
  }, [staker.address, endpoint]);

  const getNominations = (endpoint: string, stakerAddress: string) => {
    const getNominatorsWorker: Worker = new Worker(new URL('../../../util/workers/getNominations.js', import.meta.url));

    workers.push(getNominatorsWorker);

    getNominatorsWorker.postMessage({ endpoint, stakerAddress });

    getNominatorsWorker.onerror = (err) => {
      console.log(err);
    };

    getNominatorsWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const targets: string[] = e.data;

      setNoNominatedValidators(!targets); // show that nominators are fetched and is empty or not

      setNominatedValidatorsId(targets);
      getNominatorsWorker.terminate();
    };
  };

  useEffect((): void => {
    endpoint && getRedeemable();
  }, [getRedeemable, endpoint]);

  useEffect((): void => {
    // TODO: to get rewrads info from subquery
    staker.address && chainName && getRewards(chainName, staker.address).then((info) => {
      const rewardsFromSubQuery: RewardInfo[] | undefined = info?.map(
        (i: SubQueryRewardInfo): RewardInfo => {
          return {
            amount: new BN(i.reward.amount),
            era: i.reward.era,
            event: i.reward.isReward ? 'Rewarded' : '',
            stash: i.reward.stash,
            timeStamp: Number(i.timestamp),
            validator: i.reward.validator
          };
        });

      console.log('rewardsFromSubQuery:', rewardsFromSubQuery);

      if (rewardsFromSubQuery?.length) {
        return setRewardsInfo(rewardsFromSubQuery);
      }
    });

    // eslint-disable-next-line no-void
    staker.address && chainName && void getRewardsSlashes(chainName, 0, MAX_REWARDS_TO_SHOW, staker.address).then((r) => {
      const list = r?.data.list as SubscanRewardInfo[];
      const rewardsFromSubscan: RewardInfo[] | undefined = list?.map((i: SubscanRewardInfo): RewardInfo => {
        return {
          amount: new BN(i.amount),
          era: i.era,
          event: i.event_id,
          stash: i.stash,
          timeStamp: i.block_timestamp,
          validator: i.validator_stash
        } as RewardInfo;
      });

      console.log('rewardsFromSubscan:', rewardsFromSubscan);

      if (rewardsFromSubscan?.length) {
        return setRewardsInfo(rewardsFromSubscan);
      }
    });
  }, [chainName, staker.address]);

  useEffect(() => {
    // *** get nominated validators list
    endpoint && getNominations(endpoint, staker.address);

    /** to check if rebag and putInFrontOf is needed */
    endpoint && checkNeedsTuneUp(endpoint, staker.address);
  }, [checkNeedsTuneUp, endpoint, staker.address]);

  useEffect(() => {
    if (!api || !decimals) {
      return;
    }

    /** get staking reward from subscan, can use onChain data, TODO */
    // eslint-disable-next-line no-void
    void getStakingReward(chain, staker.address).then((reward) => {
      if (!reward) {
        reward = '0';
      }

      reward = amountToHuman(String(reward), decimals) === '0' ? '0.00' : amountToHuman(reward, decimals);
      setTotalReceivedReward(reward);
    });
  }, [chain, api, staker.address, decimals]);

  useEffect(() => {
    if (!ledger || !api || !decimals) {
      return;
    }

    setCurrentlyStakedInHuman(amountToHuman(String(ledger.active), decimals));

    // set unlocking
    let unlockingValue = 0n;

    ledger?.unlocking?.forEach((u) => {
      unlockingValue += BigInt(String(u.value));
    });

    setUnlockingAmount(redeemable ? unlockingValue - redeemable : unlockingValue);
  }, [ledger, api, redeemable, decimals]);

  useEffect(() => {
    if (!account) {
      console.log(' no account, wait for it...!..');

      return;
    }

    console.log('account in staking stake:', account);

    // *** retrive nominated validators from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nominatedValidatorsInfoFromLocalStrorage: SavedMetaData = account?.nominatedValidators ? JSON.parse(account.nominatedValidators) : null;

    if (nominatedValidatorsInfoFromLocalStrorage && nominatedValidatorsInfoFromLocalStrorage?.chainName === chainName) {
      setNominatedValidatorsInfo(nominatedValidatorsInfoFromLocalStrorage.metaData as DeriveStakingQuery[]);
    }
  }, []);

  useEffect((): void => {
    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker]);

  useEffect(() => {
    if (validatorsInfo && nominatedValidatorsId && chain && account.address) {
      // find all information of nominated validators from all validatorsInfo(current and waiting)
      const nominations = validatorsInfo.current
        .concat(validatorsInfo.waiting)
        .filter((v: DeriveStakingQuery) => nominatedValidatorsId.includes(String(v.accountId)));

      setNominatedValidatorsInfo(nominations);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateMeta(account.address, prepareMetaData(chain, 'nominatedValidators', nominations));
    }
  }, [nominatedValidatorsId, validatorsInfo, chain, account.address]);

  useEffect(() => {
    if (noNominatedValidators) {
      console.log('Clear saved nominatedValidators');

      // eslint-disable-next-line no-void
      void updateMeta(account.address, prepareMetaData(chain, 'nominatedValidators', []));
    }
  }, [account.address, chain, noNominatedValidators]);

  // TODO: selecting validators automatically, may move to confirm page!
  useEffect(() => {
    if (validatorsInfo && stakingConsts) {
      const selectedVAcc = selectBestValidators(validatorsInfo, stakingConsts);

      setSelectedValidatorsAcounts(selectedVAcc);
    }
  }, [stakingConsts, validatorsInfo]);

  useEffect(() => {
    if (!stakingConsts) {
      return;
    }

    const oversubscribeds = nominatedValidators?.filter((v) => v.exposure.others.length > stakingConsts.maxNominatorRewardedPerValidator);

    setOversubscribedsCount(oversubscribeds?.length);
  }, [nominatedValidators, stakingConsts]);

  // TODO: find a better algorithm to select validators automatically
  function selectBestValidators(validatorsInfo: Validators, stakingConsts: StakingConsts): DeriveStakingQuery[] {
    const allValidators = validatorsInfo.current.concat(validatorsInfo.waiting);
    const nonBlockedValidatorsAccountId = allValidators.filter((v) =>
      !v.validatorPrefs.blocked && // filter blocked validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < MAX_ACCEPTED_COMMISSION && // filter high commision validators
      v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator // filter oversubscribed
      // && v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator / 4 // filter validators with very low nominators
    );

    return nonBlockedValidatorsAccountId.slice(0, stakingConsts?.maxNominations);
  }

  const handleSoloStakingModalClose = useCallback(
    (): void => {
      // should terminate workers
      workers.forEach((w) => w.terminate());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setStakingModalOpen(false);
    }, [setStakingModalOpen]);

  const handleConfirmStakingModalOpen = useCallback((): void => {
    setConfirmStakingModalOpen(true);
  }, []);

  const handleSelectValidatorsModalOpen = useCallback((isSetNominees = false): void => {
    setSelectValidatorsModalOpen(true);

    if (!state) {
      isSetNominees ? setState('setNominees') : setState('changeValidators');
    }
  }, [state]);

  const handleNextToUnstake = useCallback((): void => {
    if (!state) {
      setState('unstake');
    }

    handleConfirmStakingModalOpen();
  }, [handleConfirmStakingModalOpen, state]);

  const handleStopNominating = useCallback((): void => {
    handleConfirmStakingModalOpen();

    if (!state) {
      setState('stopNominating');
    }
  }, [handleConfirmStakingModalOpen, state]);

  const handleRebag = useCallback((): void => {
    handleConfirmStakingModalOpen();

    if (!state) {
      setState('tuneUp');
    }
  }, [handleConfirmStakingModalOpen, state]);

  const handleWithdrowUnbound = useCallback(() => {
    if (!redeemable) {
      return;
    }

    if (!state) {
      setState('withdrawUnbound');
    }

    handleConfirmStakingModalOpen();
  }, [handleConfirmStakingModalOpen, redeemable, state]);

  const handleViewChart = useCallback(() => {
    if (!rewardsInfo) {
      return;
    }

    setChartModalOpen(true);
  }, [setChartModalOpen, rewardsInfo]);

  const getAmountToConfirm = useCallback(() => {
    switch (state) {
      case ('unstake'):
        return unstakeAmount;
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        return stakeAmount;
      case ('withdrawUnbound'):
        return redeemable || 0n;
      default:
        return 0n;
    }
  }, [state, unstakeAmount, stakeAmount, redeemable]);

  useEffect(() => {
    const active = nominatedValidators?.find((n) => n.exposure.others.find(({ who }) => who.toString() === staker.address));

    setActiveValidator(active);
  }, [nominatedValidators, staker.address]);

  const NominationsIcon = useMemo((): React.ReactElement<any> => (
    gettingNominatedValidatorsInfoFromChain || !rebagInfo || !putInFrontInfo
      ? <CircularProgress size={12} sx={{ px: '5px' }} thickness={2} />
      : Number(currentlyStakedInHuman) && !nominatedValidators?.length
        ? <Tooltip placement='top' title={t('No validators nominated')}>
          <NotificationsActiveIcon color='error' fontSize='small' sx={{ pr: 1 }} />
        </Tooltip>
        : !activeValidator && nominatedValidators?.length
          ? <Tooltip placement='top' title={t('No active validator in this era')}>
            <ReportOutlinedIcon color='warning' fontSize='small' sx={{ pr: 1 }} />
          </Tooltip>
          : oversubscribedsCount
            ? <Tooltip placement='top' title={t('oversubscribed nominees')}>
              <Badge anchorOrigin={{ horizontal: 'left', vertical: 'top' }} badgeContent={oversubscribedsCount} color='warning'>
                <NotificationImportantOutlinedIcon color='action' fontSize='small' sx={{ pr: 1 }} />
              </Badge>
            </Tooltip>
            : <CheckOutlined fontSize='small' />
  ), [gettingNominatedValidatorsInfoFromChain, rebagInfo, putInFrontInfo, currentlyStakedInHuman, nominatedValidators?.length, t, activeValidator, oversubscribedsCount]);

  return (
    <Popup handleClose={handleSoloStakingModalClose} showModal={showStakingModal}>
      <PlusHeader action={handleSoloStakingModalClose} chain={chain} closeText={'Close'} icon={<CircleOutlinedIcon fontSize='small' />} title={'Solo Staking'} />
      <Grid alignItems='center' container>
        <Grid container item xs={12}>
          <Overview
            api={api}
            availableBalanceInHuman={availableBalanceInHuman}
            currentlyStakedInHuman={currentlyStakedInHuman}
            handleViewChart={handleViewChart}
            handleWithdrowUnbound={handleWithdrowUnbound}
            ledger={ledger}
            redeemable={redeemable}
            rewardsInfo={rewardsInfo}
            totalReceivedReward={totalReceivedReward}
            unlockingAmount={unlockingAmount}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs centered indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue}>
              <Tab icon={<AddCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={<RemoveCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={NominationsIcon} iconPosition='start' label='Nominations' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={stakingConsts === undefined ? <CircularProgress size={12} thickness={2} /> : <InfoOutlinedIcon fontSize='small' />}
                iconPosition='start' label='Info' sx={{ fontSize: 11, px: '15px' }}
              />
            </Tabs>
          </Box>
          <TabPanel index={0} value={tabValue}>
            <Stake
              api={api}
              handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              ledger={ledger}
              nextToStakeButtonBusy={!!stakeAmount && (!ledger || !(validatorsInfoIsUpdated || localStrorageIsUpdate)) && state !== ''}
              nominatedValidators={nominatedValidators}
              setStakeAmount={setStakeAmount}
              setState={setState}
              staker={staker}
              stakingConsts={stakingConsts}
              state={state}
            />
          </TabPanel>
          <TabPanel index={1} value={tabValue}>
            <Unstake
              api={api}
              availableBalance={staker?.balanceInfo?.available ?? 0n}
              currentlyStakedInHuman={currentlyStakedInHuman}
              handleNextToUnstake={handleNextToUnstake}
              ledger={ledger}
              nextToUnStakeButtonBusy={state === 'unstake'}
              setUnstakeAmount={setUnstakeAmount}
              stakingConsts={stakingConsts}
            />
          </TabPanel>
          <TabPanel index={2} padding={1} value={tabValue}>
            <Nominations
              activeValidator={activeValidator}
              api={api}
              chain={chain}
              handleRebag={handleRebag}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              handleStopNominating={handleStopNominating}
              ledger={ledger}
              noNominatedValidators={noNominatedValidators}
              nominatedValidators={nominatedValidators}
              nominatorInfo={nominatorInfo}
              putInFrontInfo={putInFrontInfo}
              rebagInfo={rebagInfo}
              staker={staker}
              stakingConsts={stakingConsts}
              state={state}
              validatorsIdentities={validatorsIdentities}
              validatorsInfo={validatorsInfo}
            />
          </TabPanel>
          <TabPanel index={3} value={tabValue}>
            <InfoTab
              api={api}
              currentEraIndex={currentEraIndex}
              minNominated={nominatorInfo?.minNominated}
              stakingConsts={stakingConsts}
            />
          </TabPanel>
        </Grid>
      </Grid>
      {stakingConsts && validatorsInfo && showSelectValidatorsModal &&
        <SelectValidators
          api={api}
          chain={chain}
          ledger={ledger}
          nominatedValidators={nominatedValidators}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
          setState={setState}
          showSelectValidatorsModal={showSelectValidatorsModal}
          stakeAmount={stakeAmount}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsIdentities={validatorsIdentities}
          validatorsInfo={validatorsInfo}
        />
      }
      {((showConfirmStakingModal && ledger && staker && (selectedValidators || nominatedValidators) && state !== '') || state === 'stopNominating') && api &&
        <ConfirmStaking
          amount={getAmountToConfirm()}
          api={api}
          chain={chain}
          handleSoloStakingModalClose={handleSoloStakingModalClose}
          ledger={ledger}
          nominatedValidators={nominatedValidators}
          putInFrontInfo={putInFrontInfo}
          rebagInfo={rebagInfo}
          selectedValidators={selectedValidators}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setState={setState}
          showConfirmStakingModal={showConfirmStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsIdentities={validatorsIdentities}
        />
      }
      {rewardsInfo && showChartModal && api &&
        <RewardChart
          api={api}
          chain={chain}
          rewardsInfo={rewardsInfo}
          setChartModalOpen={setChartModalOpen}
          showChartModal={showChartModal}
        />
      }
    </Popup>
  );
}
