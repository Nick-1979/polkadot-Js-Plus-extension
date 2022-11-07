// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */
/* eslint-disable react/jsx-first-prop-new-line */

/**
 * @description
 *  this component provides access to all staking stuff,including stake,
 *  unstake, redeem, change validators, staking general info,etc.
 * */

import type { Option, StorageKey } from '@polkadot/types';
import type { AccountId32 } from '@polkadot/types/interfaces';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts, SavedMetaData, StakingConsts, Validators } from '../../../util/plusTypes';

import { AddCircleOutlineOutlined as AddCircleOutlineOutlinedIcon, GroupWorkOutlined as GroupWorkOutlinedIcon, InfoOutlined as InfoOutlinedIcon, NotificationImportantOutlined as NotificationImportantOutlinedIcon, NotificationsActive as NotificationsActiveIcon, PanToolOutlined as PanToolOutlinedIcon, RemoveCircleOutlineOutlined as RemoveCircleOutlineOutlinedIcon, ReportOutlined as ReportOutlinedIcon, WorkspacesOutlined as WorkspacesOutlinedIcon } from '@mui/icons-material';
import { Badge, Box, CircularProgress, Grid, Tab, Tabs, Tooltip } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../extension-ui/src/messaging';
import { PlusHeader, Popup } from '../../../components';
import { useMapEntries } from '../../../hooks';
import { MAX_ACCEPTED_COMMISSION } from '../../../util/constants';
import { prepareMetaData } from '../../../util/plusUtils';
import Nominations from '../Pool/Nominations';
import Unstake from '../pool/Unstake';
import TabPanel from '../Solo/TabPanel';
import ConfirmStaking from './ConfirmStaking';
import InfoTab from './InfoTab';
import Overview from './Overview';
import PoolTab from './PoolTab';
import SelectValidators from './SelectValidators';
import Stake from './Stake';

interface Props {
  account: AccountJson,
  chain: Chain;
  api: ApiPromise | undefined;
  showStakingModal: boolean;
  setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
  staker: AccountsBalanceType;
  stakingConsts: StakingConsts | undefined;
  poolStakingConsts: PoolStakingConsts | undefined;
  endpoint: string | undefined;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  validatorsInfo: Validators | undefined;
  currentEraIndex: number | undefined;
  gettingNominatedValidatorsInfoFromChain: boolean;
  validatorsInfoIsUpdated: boolean;
}

const workers: Worker[] = [];

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const OPT_ENTRIES = {
  transform: (entries: [StorageKey<[AccountId32]>, Option<PalletNominationPoolsPoolMember>][]): MembersMapEntry[] =>
    entries.reduce((all: MembersMapEntry[], [{ args: [accountId] }, optMember]) => {
      if (optMember.isSome) {
        const member = optMember.unwrap();
        const poolId = member.poolId.toString();

        if (!all[poolId]) {
          all[poolId] = [];
        }

        all[poolId].push({
          accountId: accountId.toString(),
          member
        });
      }

      return all;
    }, {})
};

export default function Index({ account, api, chain, currentEraIndex, endpoint, gettingNominatedValidatorsInfoFromChain, poolStakingConsts, setStakingModalOpen, showStakingModal, staker, stakingConsts, validatorsIdentities, validatorsInfo, validatorsInfoIsUpdated }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const poolsMembers: MembersMapEntry[] | undefined = useMapEntries(api?.query?.nominationPools?.poolMembers, OPT_ENTRIES);

  const [poolsInfo, setPoolsInfo] = useState<PoolInfo[] | undefined | null>(undefined);
  const [myPool, setMyPool] = useState<MyPoolInfo | undefined | null>(undefined);
  const [newPool, setNewPool] = useState<MyPoolInfo | undefined>(); // new or edited Pool
  const [nextPoolId, setNextPoolId] = useState<BN | undefined>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<BN>(BN_ZERO);
  const [currentlyStaked, setCurrentlyStaked] = useState<BN | undefined | null>();
  const [selectedValidators, setSelectedValidatorsAccounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | undefined>();
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean | undefined>();// if TRUE, shows that nominators are fetched but is empty
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [state, setState] = useState<string>('');
  const [tabValue, setTabValue] = useState(4);
  const [oversubscribedCount, setOversubscribedCount] = useState<number | undefined>();
  const [activeValidators, setActiveValidators] = useState<DeriveStakingQuery[]>();

  const chainName = chain?.name.replace(' Relay Chain', '');

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  /** get all information regarding the created/joined pool */
  const getPoolInfo = (endpoint: string, stakerAddress: string, id: number | undefined = undefined) => {
    const getPoolWorker: Worker = new Worker(new URL('../../../util/workers/getPool.js', import.meta.url));

    workers.push(getPoolWorker);

    getPoolWorker.postMessage({ endpoint, id, stakerAddress });

    getPoolWorker.onerror = (err) => {
      console.log(err);
    };

    getPoolWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info: string = e.data;

      if (!info) {
        setNoNominatedValidators(true);
        setMyPool(null);

        return;
      }

      const parsedInfo = JSON.parse(info) as MyPoolInfo;

      setNoNominatedValidators(!parsedInfo?.stashIdAccount?.nominators?.length);

      console.log('*** My pool info returned from worker is:', parsedInfo);

      setMyPool(parsedInfo);
      !id && setNominatedValidatorsId(parsedInfo?.stashIdAccount?.nominators);
      getPoolWorker.terminate();
    };
  };

  const getPools = (endpoint: string) => {
    const getPoolsWorker: Worker = new Worker(new URL('../../../util/workers/getPools.js', import.meta.url));

    workers.push(getPoolsWorker);

    getPoolsWorker.postMessage({ endpoint });

    getPoolsWorker.onerror = (err) => {
      console.log(err);
    };

    getPoolsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const poolsInfo: string = e.data;

      if (!poolsInfo) {
        return setPoolsInfo(null);// noo pools found, probably never happens
      }

      const parsedPoolsInfo = JSON.parse(poolsInfo) as { info: PoolInfo[], nextPoolId: string };
      const info = parsedPoolsInfo.info;

      setNextPoolId(new BN(parsedPoolsInfo.nextPoolId));

      info?.forEach((p: PoolInfo) => {
        if (p?.bondedPool?.points) {
          p.bondedPool.points = new BN(String(p.bondedPool.points));
        }

        // p.poolId = new BN(p.poolId);
      });

      setPoolsInfo(info);

      getPoolsWorker.terminate();
    };
  };

  useEffect(() => {
    endpoint && getPoolInfo(endpoint, staker.address);

    endpoint && getPools(endpoint);
  }, [endpoint, staker.address]);

  useEffect(() => {
    if (myPool === undefined) {
      return;
    }

    if (myPool === null) {
      return setCurrentlyStaked(null);
    }

    if (myPool?.bondedPool?.points && Number(myPool?.bondedPool?.points) === 0) {
      return setCurrentlyStaked(BN_ZERO);
    }

    const staked = myPool?.member?.points && myPool?.stashIdAccount && myPool?.bondedPool
      ? new BN(myPool.member.points).mul(new BN(String(myPool.stashIdAccount.stakingLedger.active))).div(new BN(myPool.bondedPool.points))
      : BN_ZERO;

    setCurrentlyStaked(staked);
  }, [myPool]);

  useEffect(() => {
    if (!account || !chainName) {
      console.log(' no account, wait for it...!..');

      return;
    }

    // *** retrieve nominated validators from local storage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nominatedValidatorsInfoFromLocalStorage: SavedMetaData = account?.poolNominatedValidators ? JSON.parse(account.poolNominatedValidators) : null;

    if (nominatedValidatorsInfoFromLocalStorage && nominatedValidatorsInfoFromLocalStorage?.chainName === chainName) {
      setNominatedValidatorsInfo(nominatedValidatorsInfoFromLocalStorage.metaData as DeriveStakingQuery[]);
    }
  }, [account, chainName]);

  useEffect(() => {
    if (validatorsInfo && nominatedValidatorsId && chain && account.address) {
      // find all information of nominated validators from all validatorsInfo(current and waiting)
      const nominations = validatorsInfo.current
        .concat(validatorsInfo.waiting)
        .filter((v: DeriveStakingQuery) => nominatedValidatorsId.includes(String(v.accountId)));

      setNominatedValidatorsInfo(nominations);

      // eslint-disable-next-line no-void
      void updateMeta(account.address, prepareMetaData(chain, 'poolNominatedValidators', nominations));
    }
  }, [nominatedValidatorsId, validatorsInfo, chain, account.address]);

  useEffect(() => {
    if (noNominatedValidators) {
      console.log('Clear saved poolNominatedValidators');

      // eslint-disable-next-line no-void
      void updateMeta(account.address, prepareMetaData(chain, 'poolNominatedValidators', []));
    }
  }, [account.address, chain, noNominatedValidators]);

  // TODO: selecting validators automatically, may move to confirm page!
  useEffect(() => {
    if (validatorsInfo && stakingConsts) {
      const selectedVAcc = selectBestValidators(validatorsInfo, stakingConsts);

      setSelectedValidatorsAccounts(selectedVAcc);
    }
  }, [stakingConsts, validatorsInfo]);

  useEffect(() => {
    const oversubscribed = nominatedValidators?.filter((v) => stakingConsts?.maxNominatorRewardedPerValidator && v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator);

    setOversubscribedCount(oversubscribed?.length);
  }, [nominatedValidators, stakingConsts]);

  function selectBestValidators(validatorsInfo: Validators, stakingConsts: StakingConsts): DeriveStakingQuery[] {
    const allValidators = validatorsInfo.current.concat(validatorsInfo.waiting);
    const nonBlockedValidatorsAccountId = allValidators.filter((v) =>
      !v.validatorPrefs.blocked && // filter blocked validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < MAX_ACCEPTED_COMMISSION && // filter high commission validators
      v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator // filter oversubscribed
      // && v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator / 4 // filter validators with very low nominators
    );

    return nonBlockedValidatorsAccountId.slice(0, stakingConsts?.maxNominations);
  }

  const handlePoolStakingModalClose = useCallback(
    (): void => {
      // should terminate workers
      workers.forEach((w) => w.terminate());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setStakingModalOpen(false);
    },
    [setStakingModalOpen]
  );

  const handleConfirmStakingModalOpen = useCallback((state?: string, amount?: BN): void => {
    if (amount?.gtn(0) && state) {
      setState(state);
      setAmount(amount);
    }

    setConfirmStakingModalOpen(true);
  }, []);

  const handleSelectValidatorsModalOpen = useCallback((isSetNominees = false): void => {
    setSelectValidatorsModalOpen(true);

    isSetNominees ? setState('setNominees') : setState('changeValidators');
  }, []);

  const handleStopNominating = useCallback((): void => {
    handleConfirmStakingModalOpen();

    if (!state) {
      setState('stopNominating');
    }
  }, [handleConfirmStakingModalOpen, state]);

  const getAmountToConfirm = useCallback(() => {
    switch (state) {
      case ('unstake'):
      case ('joinPool'):
      case ('createPool'):
      case ('bondExtra'):
      case ('bondExtraRewards'):
      case ('withdrawClaimable'):
      case ('withdrawUnbound'):
        return amount;
      default:
        return BN_ZERO;
    }
  }, [state, amount]);

  useEffect(() => {
    if (!myPool?.accounts?.stashId) {
      return;
    }

    const actives = nominatedValidators?.filter((n) => n.exposure.others.find(({ who }) => who.toString() === myPool.accounts.stashId));

    setActiveValidators(actives);
  }, [myPool?.accounts, nominatedValidators]);

  const PoolsIcon = useMemo((): React.ReactElement<any> => (
    poolsInfo === undefined ? <CircularProgress size={12} thickness={2} /> : <WorkspacesOutlinedIcon fontSize='small' />
  ), [poolsInfo]);

  const NominationsIcon = useMemo((): React.ReactElement<any> => (
    gettingNominatedValidatorsInfoFromChain
      ? <CircularProgress size={12} sx={{ px: '5px' }} thickness={2} />
      : currentlyStaked && !nominatedValidators?.length
        ? <Tooltip placement='top' title={t('No validators nominated')}>
          <NotificationsActiveIcon color='error' fontSize='small' sx={{ pr: 1 }} />
        </Tooltip>
        : !activeValidators && nominatedValidators?.length
          ? <Tooltip placement='top' title={t('No active validator in this era')}>
            <ReportOutlinedIcon color='warning' fontSize='small' sx={{ pr: 1 }} />
          </Tooltip>
          : oversubscribedCount
            ? <Tooltip placement='top' title={t('oversubscribed nominees')}>
              <Badge anchorOrigin={{ horizontal: 'left', vertical: 'top' }} badgeContent={oversubscribedCount} color='warning'>
                <NotificationImportantOutlinedIcon color='action' fontSize='small' sx={{ pr: 1 }} />
              </Badge>
            </Tooltip>
            : <PanToolOutlinedIcon sx={{ fontSize: '17px' }} />
  ), [gettingNominatedValidatorsInfoFromChain, currentlyStaked, nominatedValidators?.length, t, activeValidators, oversubscribedCount]);

  return (
    <Popup handleClose={handlePoolStakingModalClose} showModal={showStakingModal}>
      <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<GroupWorkOutlinedIcon fontSize='small' />} title={'Pool Staking'} />
      <Grid alignItems='center' container>
        <Grid container item xs={12}>
          <Overview
            api={api}
            availableBalance={staker?.balanceInfo?.available ? new BN(String(staker.balanceInfo.available)) : BN_ZERO}
            currentEraIndex={currentEraIndex}
            handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
            myPool={myPool}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs centered indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue}>
              <Tab icon={<AddCircleOutlineOutlinedIcon fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={<RemoveCircleOutlineOutlinedIcon fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={PoolsIcon} iconPosition='start' label='Pool' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={NominationsIcon} iconPosition='start' label='Nominations' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={!poolsInfo ? <CircularProgress size={12} thickness={2} /> : <InfoOutlinedIcon fontSize='small' />}
                iconPosition='start' label='Info' sx={{ fontSize: 11, px: '15px' }}
              />
            </Tabs>
          </Box>
          <TabPanel index={0} value={tabValue}>
            <Stake
              api={api}
              chain={chain}
              currentlyStaked={currentlyStaked}
              handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
              myPool={myPool}
              nextPoolId={nextPoolId}
              poolStakingConsts={poolStakingConsts}
              poolsInfo={poolsInfo}
              poolsMembers={poolsMembers}
              setNewPool={setNewPool}
              setStakeAmount={setAmount}
              setState={setState}
              staker={staker}
              state={state}
            />
          </TabPanel>
          <TabPanel index={1} value={tabValue}>
            <Unstake
              api={api}
              currentlyStaked={currentlyStaked}
              handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
              pool={myPool}
              poolStakingConsts={poolStakingConsts}
              staker={staker}
            />
          </TabPanel>
          <TabPanel index={2} padding={1} value={tabValue}>
            <PoolTab
              api={api}
              chain={chain}
              handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
              newPool={newPool}
              pool={myPool}
              poolsMembers={poolsMembers}
              setNewPool={setNewPool}
              setState={setState}
              staker={staker}
            />
          </TabPanel>
          <TabPanel index={3} padding={1} value={tabValue}>
            <Nominations
              activeValidators={activeValidators}
              api={api}
              chain={chain}
              endpoint={endpoint}
              getPoolInfo={getPoolInfo}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              handleStopNominating={handleStopNominating}
              myPool={myPool}
              noNominatedValidators={noNominatedValidators}
              nominatedValidators={nominatedValidators}
              poolStakingConsts={poolStakingConsts}
              setNoNominatedValidators={setNoNominatedValidators}
              staker={staker}
              stakingConsts={stakingConsts}
              state={state}
              validatorsIdentities={validatorsIdentities}
              validatorsInfo={validatorsInfo}
            />
          </TabPanel>
          <TabPanel index={4} value={tabValue}>
            <InfoTab
              api={api}
              currentlyExistingPoolsCount={poolsInfo?.length}
              info={poolStakingConsts}
            />
          </TabPanel>
        </Grid>
      </Grid>
      {stakingConsts && validatorsInfo && showSelectValidatorsModal && myPool &&
        <SelectValidators
          api={api}
          chain={chain}
          nominatedValidators={nominatedValidators}
          pool={myPool}
          poolsMembers={poolsMembers}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
          setState={setState}
          showSelectValidatorsModal={showSelectValidatorsModal}
          stakeAmount={amount}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsIdentities={validatorsIdentities}
          validatorsInfo={validatorsInfo}
        />
      }
      {((showConfirmStakingModal && staker && state !== '') || state === 'stopNominating') && api && (myPool || newPool) &&
        <ConfirmStaking
          amount={getAmountToConfirm()}
          api={api}
          basePool={myPool !== null ? myPool : undefined}
          chain={chain} // be used for comparision when edit a pool
          handlePoolStakingModalClose={handlePoolStakingModalClose}
          nextPoolId={nextPoolId}
          nominatedValidators={nominatedValidators}
          pool={['createPool', 'joinPool', 'editPool'].includes(state) ? newPool : myPool}
          poolsMembers={poolsMembers}
          selectedValidators={selectedValidators}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setNewPool={setNewPool}
          setState={setState}
          showConfirmStakingModal={showConfirmStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsIdentities={validatorsIdentities}
        />
      }
    </Popup>
  );
}
