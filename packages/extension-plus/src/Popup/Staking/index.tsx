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

import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AddCircleOutlineOutlined, CheckOutlined, InfoOutlined, NotificationImportantOutlined as NotificationImportantOutlinedIcon, NotificationsActive as NotificationsActiveIcon, RemoveCircleOutlineOutlined, ReportOutlined as ReportOutlinedIcon } from '@mui/icons-material';
import { Badge, Box, CircularProgress, Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../extension-ui/src/messaging';
import { PlusHeader, Popup } from '../../components';
import Hint from '../../components/Hint';
import getRewardsSlashes from '../../util/api/getRewardsSlashes';
import { getStakingReward } from '../../util/api/staking';
import { MAX_ACCEPTED_COMMISSION } from '../../util/constants';
import { AccountsBalanceType, ChainInfo, PutInFrontInfo, RebagInfo, savedMetaData, StakingConsts, Validators } from '../../util/plusTypes';
import { amountToHuman, balanceToHuman, prepareMetaData } from '../../util/plusUtils';
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
  chainInfo: ChainInfo | undefined;
  ledger: StakingLedger | null;
  redeemable: bigint | null;
  name: string;
  showStakingModal: boolean;
  setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
  staker: AccountsBalanceType;
}

interface RewardInfo {
  era: number;
  reward: bigint;
  timeStamp?: number;
  event?: string;
}

const workers: Worker[] = [];

BigInt.prototype.toJSON = function () { return this.toString() };

export default function EasyStaking({ account, chain, chainInfo, ledger, redeemable, setStakingModalOpen, showStakingModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [stakingConsts, setStakingConsts] = useState<StakingConsts | null>(null);
  const [gettingStakingConstsFromBlockchain, setgettingStakingConstsFromBlockchain] = useState<boolean>(true);
  const [gettingNominatedValidatorsInfoFromChain, setGettingNominatedValidatorsInfoFromChain] = useState<boolean>(true);
  const [totalReceivedReward, setTotalReceivedReward] = useState<string>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showChartModal, setChartModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<bigint>(0n);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [currentlyStakedInHuman, setCurrentlyStakedInHuman] = useState<string | null>(null);
  const [validatorsInfo, setValidatorsInfo] = useState<Validators | null>(null); // validatorsInfo is all validators (current and waiting) information
  const [validatorsIdentities, setValidatorsIdentities] = useState<DeriveAccountInfo[] | null>(null);
  const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
  const [selectedValidators, setSelectedValidatorsAcounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | null>(null);
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean>(false);
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [state, setState] = useState<string>('');
  const [tabValue, setTabValue] = useState(3);
  const [unstakeAmount, setUnstakeAmount] = useState<bigint>(0n);
  const [unlockingAmount, setUnlockingAmount] = useState<bigint>(0n);
  const [oversubscribedsCount, setOversubscribedsCount] = useState<number>(0);
  const [activeValidator, setActiveValidator] = useState<DeriveStakingQuery>();
  const [currentEraIndex, setCurrentEraIndex] = useState<number | undefined>();
  const [currentEraIndexOfStore, setCurrentEraIndexOfStore] = useState<number | undefined>();
  const [rewardSlashes, setRewardSlashes] = useState<RewardInfo[]>([]);
  const [storeIsUpdate, setStroreIsUpdate] = useState<boolean>(false);
  const [nominatorInfo, setNominatorInfo] = useState<{ minNominated: bigint, isInList: boolean } | undefined>();
  const [rebagInfo, setRebagInfo] = useState<RebagInfo | undefined>();
  const [putInFrontInfo, setPutInFrontOfInfo] = useState<PutInFrontInfo | undefined>();

  const chainName = chain?.name.replace(' Relay Chain', '');

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const checkNeedsTuneUp = (chain: Chain, stakerAddress: string) => {
    checkNeedsRebag(chain, stakerAddress);
    checkNeedsPutInFrontOf(chain, stakerAddress);
  };

  const checkNeedsRebag = (chain: Chain, stakerAddress: string) => {
    const needsRebag: Worker = new Worker(new URL('../../util/workers/needsRebag.js', import.meta.url));

    workers.push(needsRebag);

    needsRebag.postMessage({ chain, stakerAddress });

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

  const checkNeedsPutInFrontOf = (chain: Chain, stakerAddress: string) => {
    const needsPutInFrontOf: Worker = new Worker(new URL('../../util/workers/needsPutInFrontOf.js', import.meta.url));

    workers.push(needsPutInFrontOf);

    needsPutInFrontOf.postMessage({ chain, stakerAddress });

    needsPutInFrontOf.onerror = (err) => {
      console.log(err);
    };

    needsPutInFrontOf.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const lighter: string | undefined = e.data;

      console.log('lighter:', lighter);

      setPutInFrontOfInfo({ lighter: lighter, shouldPutInFront: !!lighter });
      needsPutInFrontOf.terminate();
    };
  };

  const getStakingRewardsFromChain = (chain: Chain, stakerAddress: string) => {
    // TODO: does not work on polkadot/kusama but Westend!!
    /**  get some staking rewards ,... */
    const getRewards: Worker = new Worker(new URL('../../util/workers/getRewards.js', import.meta.url));

    workers.push(getRewards);

    getRewards.postMessage({ chain, stakerAddress });

    getRewards.onerror = (err) => {
      console.log(err);
    };

    getRewards.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const rewards: RewardInfo[] = e.data;

      setRewardSlashes((r) => r.concat(rewards));
      console.log('REWARDS:', rewards);

      getRewards.terminate();
    };
  };

  const getNominations = (chain: Chain, stakerAddress: string) => {
    const getNominatorsWorker: Worker = new Worker(new URL('../../util/workers/getNominations.js', import.meta.url));

    workers.push(getNominatorsWorker);

    getNominatorsWorker.postMessage({ chain, stakerAddress });

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

  const getStakingConsts = (chain: Chain) => {
    /** 1- get some staking constant like min Nominator Bond ,... */
    const getStakingConstsWorker: Worker = new Worker(new URL('../../util/workers/getStakingConsts.js', import.meta.url));

    workers.push(getStakingConstsWorker);

    getStakingConstsWorker.postMessage({ chain });

    getStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const sConsts: StakingConsts = e.data;

      if (sConsts) {
        setStakingConsts(sConsts);

        setgettingStakingConstsFromBlockchain(false);

        if (staker?.address) {
          //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          //   const stringifiedStakingConsts = JSON.stringify(consts, (_key, value) => typeof value === 'bigint' ? value.toString() : value);

          // sConsts.existentialDeposit = sConsts.existentialDeposit.toString();
          // eslint-disable-next-line no-void
          void updateMeta(account.address, prepareMetaData(chain, 'stakingConsts', JSON.stringify(sConsts)));
        }
      }

      getStakingConstsWorker.terminate();
    };
  };

  const getNominatorInfo = (chain: Chain, stakerAddress: string) => {
    const getNominatorInfoWorker: Worker = new Worker(new URL('../../util/workers/getNominatorInfo.js', import.meta.url));

    workers.push(getNominatorInfoWorker);

    getNominatorInfoWorker.postMessage({ chain, stakerAddress });

    getNominatorInfoWorker.onerror = (err) => {
      console.log(err);
    };

    getNominatorInfoWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const nominatorInfo = e.data;

      console.log('nominatorInfo:', nominatorInfo);

      setNominatorInfo(nominatorInfo);
      getNominatorInfoWorker.terminate();
    };
  };

  const getValidatorsInfo = (chain: Chain, validatorsInfoFromStore: savedMetaData) => {
    const getValidatorsInfoWorker: Worker = new Worker(new URL('../../util/workers/getValidatorsInfo.js', import.meta.url));

    workers.push(getValidatorsInfoWorker);

    getValidatorsInfoWorker.postMessage({ chain });

    getValidatorsInfoWorker.onerror = (err) => {
      console.log(err);
    };

    getValidatorsInfoWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fetchedValidatorsInfo: Validators | null = e.data;

      setGettingNominatedValidatorsInfoFromChain(false);

      console.log(`validatorsfrom chain (era:${fetchedValidatorsInfo?.currentEraIndex}), current: ${fetchedValidatorsInfo?.current?.length} waiting ${fetchedValidatorsInfo?.waiting?.length} `);

      if (fetchedValidatorsInfo && JSON.stringify(validatorsInfoFromStore?.metaData) !== JSON.stringify(fetchedValidatorsInfo)) {
        setValidatorsInfo(fetchedValidatorsInfo);
        console.log(`save validators to local storage, old was current: ${validatorsInfoFromStore?.metaData?.current?.length} waiting ${validatorsInfoFromStore?.metaData?.waiting?.length} `);

        // eslint-disable-next-line no-void
        void updateMeta(account.address, prepareMetaData(chain, 'validatorsInfo', fetchedValidatorsInfo));
      }

      setValidatorsInfoIsUpdated(true);
      getValidatorsInfoWorker.terminate();
    };
  };

  useEffect((): void => {
    // eslint-disable-next-line no-void
    chainInfo && void chainInfo.api.query.staking.currentEra().then((ce) => {
      setCurrentEraIndex(Number(ce));
    });

    // staker.address && getStakingRewardsFromChain(chain, staker.address);

    // eslint-disable-next-line no-void
    staker.address && void getRewardsSlashes(chainName, 0, 10, staker.address).then((r) => {
      const rewardsFromSubscan = r?.data.list?.map((d): RewardInfo => {
        return {
          reward: d.amount,
          era: d.era,
          timeStamp: d.block_timestamp,
          event: d.event_id
        };
      });

      if (rewardsFromSubscan?.length) {
        setRewardSlashes((getRewardsSlashes) => getRewardsSlashes.concat(rewardsFromSubscan));
      }
      console.log('rewards from subscan:', r);
    });
  }, [chainInfo, chainName, staker.address]);

  useEffect((): void => {
    if (!currentEraIndex || !currentEraIndexOfStore) { return; }

    setStroreIsUpdate(currentEraIndex === currentEraIndexOfStore);
  }, [currentEraIndex, currentEraIndexOfStore]);

  useEffect(() => {
    /** get some staking constant like min Nominator Bond ,... */
    getStakingConsts(chain);

    /**  get nominator staking info to consider rebag ,... */
    getNominatorInfo(chain, staker.address);

    // *** get nominated validators list
    getNominations(chain, staker.address);

    /** to check if rebag and putInFrontOf is needed */
    checkNeedsTuneUp(chain, staker.address);

    /** retrive validatorInfo from local sorage */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validatorsInfoFromStore: savedMetaData = account?.validatorsInfo ? JSON.parse(account.validatorsInfo) : null;

    if (validatorsInfoFromStore && validatorsInfoFromStore?.chainName === chainName) {
      console.log(`validatorsInfo is set from local storage current:${validatorsInfoFromStore.metaData?.current?.length} waiting:${validatorsInfoFromStore.metaData?.waiting?.length}`);
      setValidatorsInfo(validatorsInfoFromStore.metaData as Validators);

      setCurrentEraIndexOfStore(Number(validatorsInfoFromStore.metaData.currentEraIndex));
      console.log(`validatorsInfro in storage is from era: ${validatorsInfoFromStore.metaData.currentEraIndex}
      on chain: ${validatorsInfoFromStore?.chainName}`);
    }

    /** get validators info, including current and waiting */
    getValidatorsInfo(chain, validatorsInfoFromStore);
  }, []);

  useEffect(() => {
    if (!validatorsInfoIsUpdated || !validatorsInfo?.current.length) { return; }

    const validatorsAccountIds = validatorsInfo.current.map((v) => v.accountId).concat(validatorsInfo.waiting.map((v) => v.accountId));
    /** get validators identities */
    const getValidatorsIdWorker: Worker = new Worker(new URL('../../util/workers/getValidatorsId.js', import.meta.url));

    workers.push(getValidatorsIdWorker);

    getValidatorsIdWorker.postMessage({ chain, validatorsAccountIds });

    getValidatorsIdWorker.onerror = (err) => {
      console.log(err);
    };

    getValidatorsIdWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fetchedIdentities: DeriveAccountInfo[] | null = e.data;

      console.log(`got ${fetchedIdentities?.length} validators identities from ${chain?.name} `);

      /** if fetched differs from saved then setIdentities and save to local storage */
      if (fetchedIdentities?.length && JSON.stringify(validatorsIdentities) !== JSON.stringify(fetchedIdentities)) {
        console.log(`setting new identities #old was: ${validatorsIdentities?.length} `);

        setValidatorsIdentities(fetchedIdentities);
        // eslint-disable-next-line no-void
        void updateMeta(account.address, prepareMetaData(chain, 'validatorsIdentities', fetchedIdentities));
      }

      getValidatorsIdWorker.terminate();
    };
  }, [validatorsInfoIsUpdated, validatorsInfo]);

  useEffect(() => {
    if (!chainInfo) return;

    // // eslint-disable-next-line no-void
    // void chainInfo.api.derive.staking.stakerRewards(staker.address).then((t) =>
    //   console.log('stakerRewards', JSON.parse(JSON.stringify(t)))
    // );

    // // eslint-disable-next-line no-void
    // void chainInfo.api.query.balances.totalIssuance().then((t) =>
    //   console.log('totalIssuance', amountToHuman(t?.toString(), chainInfo?.decimals))
    // );

    // // eslint-disable-next-line no-void
    // void chainInfo.api.query.balances.erasTotalStake().then((t) =>
    //   console.log('erasTotalStake', amountToHuman(t?.toString(), chainInfo?.decimals))
    // );

    /** get staking reward from subscan, can use onChain data, TODO */
    // eslint-disable-next-line no-void
    void getStakingReward(chain, staker.address).then((reward) => {
      if (!reward) reward = '0';
      reward = amountToHuman(String(reward), chainInfo?.decimals) === '0' ? '0.00' : amountToHuman(reward, chainInfo?.decimals);
      setTotalReceivedReward(reward);
    });
  }, [chain, chainInfo, staker.address]);

  useEffect(() => {
    if (!ledger || !chainInfo) { return; }

    setCurrentlyStakedInHuman(amountToHuman(String(ledger.active), chainInfo?.decimals));

    // set unlocking
    let unlockingValue = 0n;

    ledger?.unlocking?.forEach((u) => { unlockingValue += BigInt(String(u.value)); });

    setUnlockingAmount(redeemable ? unlockingValue - redeemable : unlockingValue);
  }, [ledger, chainInfo, redeemable]);

  useEffect(() => {
    if (!account) {
      console.log(' no account, wait for it...!..');

      return;
    }

    console.log('account in staking stake:', account);

    // * retrive staking consts from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stakingConstsFromLocalStrorage: savedMetaData = account?.stakingConsts ? JSON.parse(account.stakingConsts) : null;

    if (stakingConstsFromLocalStrorage && stakingConstsFromLocalStrorage?.chainName === chainName) {
      console.log('stakingConsts from local:', JSON.parse(stakingConstsFromLocalStrorage.metaData));
      setStakingConsts(JSON.parse(stakingConstsFromLocalStrorage.metaData) as StakingConsts);
    }

    // *** retrive nominated validators from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nominatedValidatorsInfoFromLocalStrorage: savedMetaData = account?.nominatedValidators ? JSON.parse(account.nominatedValidators) : null;

    if (nominatedValidatorsInfoFromLocalStrorage && nominatedValidatorsInfoFromLocalStrorage?.chainName === chainName) {
      setNominatedValidatorsInfo(nominatedValidatorsInfoFromLocalStrorage.metaData as DeriveStakingQuery[]);
    }

    // **** retrive validators identities from local storage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validarorsIdentitiesFromStore: savedMetaData = account?.validatorsIdentities ? JSON.parse(account.validatorsIdentities) : null;

    if (validarorsIdentitiesFromStore && validarorsIdentitiesFromStore?.chainName === chainName) {
      setValidatorsIdentities(validarorsIdentitiesFromStore.metaData as DeriveAccountInfo[]);
    }
  }, []);

  useEffect((): void => {
    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker]);

  useEffect(() => {
    if (validatorsInfo && nominatedValidatorsId && chain && account.address) {
      // find all information of nominated validators from all validatorsInfo(current and waiting)
      const nominatedValidatorsIds = validatorsInfo.current
        .concat(validatorsInfo.waiting)
        .filter((v: DeriveStakingQuery) => nominatedValidatorsId.includes(String(v.accountId)));

      setNominatedValidatorsInfo(nominatedValidatorsIds);
      // setGettingNominatedValidatorsInfoFromChain(false);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateMeta(account.address, prepareMetaData(chain, 'nominatedValidators', nominatedValidatorsIds));
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
    const oversubscribeds = nominatedValidators?.filter((v) => v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator);

    setOversubscribedsCount(oversubscribeds?.length);
  }, [nominatedValidators, stakingConsts]);

  // TODO: find a better algorithm to select validators automatically
  function selectBestValidators(validatorsInfo: Validators, stakingConsts: StakingConsts): DeriveStakingQuery[] {
    const allValidators = validatorsInfo.current.concat(validatorsInfo.waiting);
    const nonBlockedValidatorsAccountId = allValidators.filter((v) =>
      !v.validatorPrefs.blocked && // filter blocked validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < MAX_ACCEPTED_COMMISSION && // filter high commision validators
      v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator  // filter oversubscribed
      // && v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator / 4 // filter validators with very low nominators
    );

    return nonBlockedValidatorsAccountId.slice(0, stakingConsts?.maxNominations);
  }

  const handleEasyStakingModalClose = useCallback(
    (): void => {
      // should terminate workers
      workers.forEach((w) => w.terminate());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setStakingModalOpen(false);
    },
    [setStakingModalOpen]
  );

  const handleConfirmStakingModaOpen = useCallback((): void => {
    setConfirmStakingModalOpen(true);
  }, []);

  const handleSelectValidatorsModalOpen = useCallback((isSetNominees = false): void => {
    setSelectValidatorsModalOpen(true);

    if (!state && !isSetNominees) setState('changeValidators');
  }, [state]);

  const handleNextToUnstake = useCallback((): void => {
    if (!state) setState('unstake');
    handleConfirmStakingModaOpen();
  }, [handleConfirmStakingModaOpen, state]);

  const handleStopNominating = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('stopNominating');
  }, [handleConfirmStakingModaOpen, state]);

  const handleRebag = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('tuneUp');
  }, [handleConfirmStakingModaOpen, state]);

  const handleWithdrowUnbound = useCallback(() => {
    if (!redeemable) return;
    if (!state) setState('withdrawUnbound');
    handleConfirmStakingModaOpen();
  }, [handleConfirmStakingModaOpen, redeemable, state]);

  const handleViewChart = useCallback(() => {
    if (!rewardSlashes) return;
    setChartModalOpen(true);
  }, [setChartModalOpen, rewardSlashes]);

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
      ? <CircularProgress size={12} sx={{ pr: '5px' }} thickness={2} />
      : Number(currentlyStakedInHuman) && !nominatedValidators?.length
        ? <Hint id='noNominees' place='top' tip={t('No validators nominated')}>
          <NotificationsActiveIcon color='error' fontSize='small' sx={{ pr: 1 }} />
        </Hint>
        : !activeValidator && nominatedValidators?.length
          ? <Hint id='noActive' place='top' tip={t('No active validator in this era')}>
            <ReportOutlinedIcon color='warning' fontSize='small' sx={{ pr: 1 }} />
          </Hint>
          : oversubscribedsCount
            ? <Hint id='overSubscribeds' place='top' tip={t('oversubscribed nominees')}>
              <Badge anchorOrigin={{ horizontal: 'left', vertical: 'top' }} badgeContent={oversubscribedsCount} color='warning'>
                <NotificationImportantOutlinedIcon color='action' fontSize='small' sx={{ pr: 1 }} />
              </Badge>
            </Hint>
            : <CheckOutlined fontSize='small' />
  ), [gettingNominatedValidatorsInfoFromChain, rebagInfo, putInFrontInfo, currentlyStakedInHuman, nominatedValidators?.length, t, activeValidator, oversubscribedsCount]);

  return (
    <Popup handleClose={handleEasyStakingModalClose} showModal={showStakingModal}>

      <PlusHeader action={handleEasyStakingModalClose} chain={chain} closeText={'Close'} icon={<FontAwesomeIcon icon={faCoins} size='sm' />} title={'Easy Staking'} />

      <Grid alignItems='center' container>
        <Grid container item xs={12}>
          <Overview
            availableBalanceInHuman={availableBalanceInHuman}
            chainInfo={chainInfo}
            currentlyStakedInHuman={currentlyStakedInHuman}
            handleViewChart={handleViewChart}
            handleWithdrowUnbound={handleWithdrowUnbound}
            ledger={ledger}
            redeemable={redeemable}
            rewardSlashes={rewardSlashes}
            totalReceivedReward={totalReceivedReward}
            unlockingAmount={unlockingAmount}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs centered indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue}>
              <Tab icon={<AddCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11, p: '0px 15px 0px 15px' }} />
              <Tab icon={<RemoveCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11, p: '0px 15px 0px 15px' }} />
              <Tab icon={NominationsIcon} iconPosition='start' label='Nominations' sx={{ fontSize: 11, p: '0px 15px 0px 15px' }} />
              <Tab
                icon={gettingStakingConstsFromBlockchain ? <CircularProgress size={12} thickness={2} /> : <InfoOutlined fontSize='small' />}
                iconPosition='start' label='Info' sx={{ fontSize: 11, p: '0px 15px 0px 15px' }}
              />
            </Tabs>
          </Box>
          <TabPanel index={0} value={tabValue}>
            <Stake
              chainInfo={chainInfo}
              handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              ledger={ledger}
              nextToStakeButtonBusy={(!ledger || !(validatorsInfoIsUpdated || storeIsUpdate)) && state !== ''}
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
              availableBalance={staker?.balanceInfo?.available ?? 0n}
              chainInfo={chainInfo}
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
              chain={chain}
              chainInfo={chainInfo}
              handleRebag={handleRebag}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              handleStopNominating={handleStopNominating}
              ledger={ledger}
              noNominatedValidators={noNominatedValidators}
              nominatedValidators={nominatedValidators}
              nominatorInfo={nominatorInfo}
              putInFrontInfo={putInFrontInfo}
              rebagInfo={rebagInfo}
              setState={setState}
              staker={staker}
              stakingConsts={stakingConsts}
              state={state}
              validatorsIdentities={validatorsIdentities}
              validatorsInfo={validatorsInfo}
            />
          </TabPanel>
          <TabPanel index={3} value={tabValue}>
            <InfoTab
              chainInfo={chainInfo}
              currentEraIndex={currentEraIndex}
              minNominated={nominatorInfo?.minNominated}
              stakingConsts={stakingConsts}
            />
          </TabPanel>
        </Grid>
      </Grid>

      {stakingConsts && validatorsInfo &&
        <SelectValidators
          chain={chain}
          chainInfo={chainInfo}
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
      {((showConfirmStakingModal && ledger && staker && (selectedValidators || nominatedValidators) && state !== '') || state === 'stopNominating') && chainInfo &&
        <ConfirmStaking
          amount={getAmountToConfirm()}
          chain={chain}
          chainInfo={chainInfo}
          handleEasyStakingModalClose={handleEasyStakingModalClose}
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

      {rewardSlashes && showChartModal &&
        <RewardChart
          chain={chain}
          chainInfo={chainInfo}
          rewardSlashes={rewardSlashes}
          setChartModalOpen={setChartModalOpen}
          showChartModal={showChartModal}
        />
      }
    </Popup>
  );
}
