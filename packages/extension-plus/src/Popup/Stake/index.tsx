/* eslint-disable react/jsx-max-props-per-line */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { AddCircleOutlineOutlined, Brightness7Outlined as Brightness7OutlinedIcon, CheckOutlined, InfoOutlined, NotificationsActive as NotificationsActiveIcon, Redeem as RedeemIcon, RemoveCircleOutlineOutlined, ReportOutlined as ReportOutlinedIcon, ReportProblemOutlined } from '@mui/icons-material';
import { Box, CircularProgress, Grid, IconButton, Paper, Skeleton, Tab, Tabs, Typography } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../extension-ui/src/messaging';
import { PlusHeader, Popup } from '../../components';
import Hint from '../../components/Hint';
import { getAllValidatorsFromSubscan, getStakingReward } from '../../util/api/staking';
import { MAX_ACCEPTED_COMMISSION, MIN_EXTRA_BOND } from '../../util/constants';
import getChainInfo from '../../util/getChainInfo';
import { AccountsBalanceType, AllValidatorsFromSubscan, ChainInfo, savedMetaData, StakingConsts, Validators, ValidatorsName } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint, prepareMetaData } from '../../util/plusUtils';
import ConfirmStaking from './ConfirmStaking';
import Info from './Info';
import Nominations from './Nominations';
import SelectValidators from './SelectValidators';
import Stake from './Stake';
import Unstake from './Unstake';

interface Props {
  account: AccountJson,
  chain?: Chain | null;
  name: string;
  showStakingModal: boolean;
  setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
  staker: AccountsBalanceType;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const workers: Worker[] = [];

export default function EasyStaking({ account, chain, setStakingModalOpen, showStakingModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [chainInfo, setChainInfo] = useState<ChainInfo>();
  const [stakingConsts, setStakingConsts] = useState<StakingConsts | null>(null);
  const [gettingStakingConstsFromBlockchain, setgettingStakingConstsFromBlockchain] = useState<boolean>(true);
  const [gettingNominatedValidatorsInfoFromBlockchain, setGettingNominatedValidatorsInfoFromBlockchain] = useState<boolean>(true);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);
  const [nextToUnStakeButtonDisabled, setNextToUnStakeButtonDisabled] = useState(true);
  const [minStakeable, setMinStakeable] = useState<number>(0);
  const [maxStake, setMaxStake] = useState<number>(0);
  const [totalReceivedReward, setTotalReceivedReward] = useState<string>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<bigint>(0n);
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>();
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const [alert, setAlert] = useState<string>('');
  const [ledger, setLedger] = useState<StakingLedger | null>(null);
  const [redeemable, setRedeemable] = useState<bigint | null>(null);
  const [currentlyStakedInHuman, setCurrentlyStakedInHuman] = useState<string | null>(null);
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [validatorsName, setValidatorsName] = useState<ValidatorsName[]>([]);
  const [validatorsInfo, setValidatorsInfo] = useState<Validators | null>(null); // validatorsInfo is all validators (current and waiting) information
  const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
  const [validatorsInfoFromSubscan, setValidatorsInfoFromSubscan] = useState<AllValidatorsFromSubscan | null>(null);
  const [selectedValidators, setSelectedValidatorsAcounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | null>(null);
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean>(false);
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [validatorSelectionType, setValidatorSelectionType] = useState<string>('Auto');
  const [state, setState] = useState<string>(''); // {'', 'stakeAuto', 'stakeManual', 'changeValidators','confirming', 'failed,'success'}
  const [tabValue, setTabValue] = useState(3);
  const [unstakeAmountInHuman, setUnstakeAmountInHuman] = useState<string | null>(null);
  const [unstakeAmount, setUnstakeAmount] = useState<bigint>(0n);
  const [unlockingAmount, setUnlockingAmount] = useState<bigint>(0n);
  const [hasOversubscribed, setHasOversubscribed] = useState<boolean>(false);
  const [activeValidator, setActiveValidator] = React.useState<DeriveStakingQuery>();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setAlert('');
  };

  useEffect(() => {
    if (!chain) { return; }

    // eslint-disable-next-line no-void
    void getChainInfo(chain).then((info) => setChainInfo(info));

    setZeroBalanceAlert(Number(staker.balanceInfo?.available) <= 0);

    // * get some staking constant like min Nominator Bond ,...
    const getStakingConstsWorker: Worker = new Worker(new URL('../../util/workers/getStakingConsts.js', import.meta.url));

    workers.push(getStakingConstsWorker);

    getStakingConstsWorker.postMessage({ chain });

    getStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const consts: StakingConsts = e.data;

      if (consts) {
        setStakingConsts(consts);

        setgettingStakingConstsFromBlockchain(false);

        if (staker.address) {
          // updateStakingConsts(account.address, JSON.stringify(consts));
          // eslint-disable-next-line no-void
          void updateMeta(account.address, prepareMetaData(chain, 'stakingConsts', consts));
        }
      }

      getStakingConstsWorker.terminate();
    };

    // ** get validators info, including current and waiting
    const getValidatorsInfoWorker: Worker = new Worker(new URL('../../util/workers/getValidatorsInfo.js', import.meta.url));

    workers.push(getValidatorsInfoWorker);

    getValidatorsInfoWorker.postMessage({ chain });

    getValidatorsInfoWorker.onerror = (err) => {
      console.log(err);
    };

    getValidatorsInfoWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const vInfo: Validators = e.data;

      console.log(`got validators from blockchain storage, current: ${vInfo.current.length} waiting ${vInfo.waiting.length} `);
      console.log(vInfo.current[0]);
      console.log(vInfo.waiting[0]);

      setValidatorsInfo(vInfo);
      setValidatorsInfoIsUpdated(true);

      if (vInfo) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        updateMeta(account.address, prepareMetaData(chain, 'validatorsInfo', vInfo));
      }

      getValidatorsInfoWorker.terminate();
    };

    // getBonded(chain, account.address)
  }, []);

  useEffect(() => {
    if (!chainInfo || !chain || !staker.address) return;
    
    // *** get staking reward
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getStakingReward(chain, staker.address).then((reward) => {
      if (!reward) reward = '0';
      reward = amountToHuman(String(reward), chainInfo?.decimals) === '0' ? '0.00' : amountToHuman(reward, chainInfo?.decimals);
      setTotalReceivedReward(reward);
    });
  }, [chain, chainInfo, staker.address]);

  useEffect(() => {
    if (ledger && chainInfo?.decimals) {
      setCurrentlyStakedInHuman(amountToHuman(String(ledger.active), chainInfo?.decimals));

      // set unlocking
      let unlockingValue = 0n;

      if (ledger.unlocking) {
        ledger.unlocking.forEach((u) => { unlockingValue += BigInt(String(u.value)); });
      }

      let value = unlockingValue;

      if (redeemable) { value = unlockingValue - redeemable; }

      setUnlockingAmount(value);
    }
  }, [ledger, chainInfo]);

  const callGetLedgerWorker = (): void => {
    const getLedgerWorker: Worker = new Worker(new URL('../../util/workers/getLedger.js', import.meta.url));

    workers.push(getLedgerWorker);
    const address = staker.address;

    getLedgerWorker.postMessage({ address, chain });

    getLedgerWorker.onerror = (err) => {
      console.log(err);
    };

    getLedgerWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const ledger: StakingLedger = e.data;

      console.log('Ledger:', ledger);
      setLedger(ledger);
      getLedgerWorker.terminate(); // stay awake, will be terminated at the end
    };
  };

  const callRedeemable = (): void => {
    const getRedeemableWorker: Worker = new Worker(new URL('../../util/workers/getRedeemable.js', import.meta.url));

    // workers.push(getRedeemableWorker);
    const address = staker.address;

    getRedeemableWorker.postMessage({ address, chain });

    getRedeemableWorker.onerror = (err) => {
      console.log(err);
    };

    getRedeemableWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const stakingAccount: string = e.data;

      console.log(' got redeemable as:', JSON.parse(stakingAccount));

      if (stakingAccount) { setRedeemable(BigInt(JSON.parse(stakingAccount).redeemable)); } else { setRedeemable(0n); }

      getRedeemableWorker.terminate(); // stay awake, will be terminated at the end
    };
  };

  useEffect(() => {
    if (!chain) { return; }

    // * get ledger info, including users currently staked, locked, etc
    callGetLedgerWorker();

    // ** get redeemable amount
    callRedeemable();

    // *** get nominated validators list
    const getNominatorsWorker: Worker = new Worker(new URL('../../util/workers/getNominators.js', import.meta.url));

    workers.push(getNominatorsWorker);

    const stakerAddress = staker.address;

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
  }, [chain, staker]);

  useEffect((): void => {
    if (!chain || !account) {
      console.log(' no account or chain, wait for it...!..');

      return;
    }

    const chainName = chain.name.replace(' Relay Chain', '');

    console.log('account:', account);

    // * retrive saved staking consts from acount meta data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const savedStakingConstsFromLocalStrorage: savedMetaData = account.stakingConsts ? JSON.parse(account.stakingConsts) : null;

    if (savedStakingConstsFromLocalStrorage) {
      if (savedStakingConstsFromLocalStrorage.chainName === chainName) { setStakingConsts(savedStakingConstsFromLocalStrorage.metaData); }
    }

    // ** retrive saved validatorInfo from acount's meta data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validatorsInfoFromLocalStorage: savedMetaData = account.validatorsInfo ? JSON.parse(account.validatorsInfo) : null;

    if (validatorsInfoFromLocalStorage) {
      if (validatorsInfoFromLocalStorage.chainName === chainName) { setValidatorsInfo(validatorsInfoFromLocalStorage.metaData); }
    }

    // *** retrive validators name from acounts' meta data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nominatedValidatorsInfoFromLocalStrorage: savedMetaData = account.nominatedValidators ? JSON.parse(account.nominatedValidators) : null;

    if (nominatedValidatorsInfoFromLocalStrorage) {
      if (nominatedValidatorsInfoFromLocalStrorage.chainName === chainName) { setNominatedValidatorsInfo(nominatedValidatorsInfoFromLocalStrorage.metaData); }
    }

    // **** get all validators info from subscan,
    // it is faster than getting from blockchain but is rate limited
    // also retrive new names of validators from that and update locals
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getAllValidatorsFromSubscan(chain).then((allValidatorsInfoFromSubscan) => {
      console.log('allValidatorsInfoFromSubscan from subscan', allValidatorsInfoFromSubscan);

      if (!allValidatorsInfoFromSubscan) {
        console.log('allValidatorsInfoFromSubscan is empty');

        return;
      }

      if (allValidatorsInfoFromSubscan.current && allValidatorsInfoFromSubscan.waiting) {
        setValidatorsInfoFromSubscan({
          current: allValidatorsInfoFromSubscan.current,
          waiting: allValidatorsInfoFromSubscan.waiting
        });
      }

      const allValidatorsInfoToghether = (allValidatorsInfoFromSubscan.current || []).concat(allValidatorsInfoFromSubscan.waiting || []);

      if (allValidatorsInfoToghether.length === 0) {
        console.log('allValidatorsInfoToghether is empty');

        return;
      }

      const validatorsNameFromSbuScan = allValidatorsInfoToghether
        .filter((v) => v.stash_account_display.identity || v.controller_account_display?.identity)
        .map((v) => ({
          address: v.stash_account_display.address,
          name: v.stash_account_display.display || v.controller_account_display?.display || ''
        }));

      if (validatorsNameFromSbuScan.length === 0) {
        console.log(' no new validator names');

        return;
      }

      // save validators name into local account storage
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const vNFromStorage: { chainName: string, metaData: ValidatorsName[] } | null =
        account.validatorsName ? JSON.parse(account.validatorsName) : null;

      const chainName = chain.name.replace(' Relay Chain', '');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const validatorsNamesFromStorage: ValidatorsName[] | null = vNFromStorage && vNFromStorage?.chainName === chainName
        ? vNFromStorage.metaData
        : null;

      const validatorsNameFromSbuScanTemp = validatorsNameFromSbuScan;

      validatorsNamesFromStorage?.forEach((vfs: ValidatorsName) => {
        const index = validatorsNameFromSbuScan.find((v) => v.address === vfs.address);

        if (!index) {
          validatorsNameFromSbuScanTemp.push(vfs);
        }
      });

      setValidatorsName(validatorsNameFromSbuScanTemp);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateMeta(account.address, prepareMetaData(chain, 'validatorsName', validatorsNameFromSbuScanTemp));
      console.log('validatorsNameFromSbuScan and local storage:', validatorsNameFromSbuScanTemp);
    });
  }, [account, chain, staker.address]);

  useEffect((): void => {
    setAvailableBalance(balanceToHuman(staker, 'available'));
  }, [staker]);

  useEffect((): void => {
    if (redeemable) {
      console.log('new unlockAmount', unlockingAmount - redeemable);

      setUnlockingAmount(unlockingAmount - redeemable);
    }
  }, [redeemable]);

  useEffect(() => {
    if (validatorsInfo && nominatedValidatorsId && chain && account.address) {
      // find all information of nominated validators from all validatorsInfo(current and waiting)
      const nominatedValidatorsIds = validatorsInfo.current
        .concat(validatorsInfo.waiting)
        .filter((v: DeriveStakingQuery) => nominatedValidatorsId.includes(String(v.accountId)));

      setNominatedValidatorsInfo(nominatedValidatorsIds);
      setGettingNominatedValidatorsInfoFromBlockchain(false);

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

  useEffect(() => {
    if (!stakingConsts) return;

    let max = Number(fixFloatingPoint(Number(availableBalance) - 2 * stakingConsts?.existentialDeposit));
    let min = stakingConsts?.minNominatorBond;

    if (Number(ledger?.active)) {
      min = MIN_EXTRA_BOND;
    }

    if (min > max) {
      min = max = 0;
    }

    setMaxStake(max);
    setMinStakeable(min);
  }, [availableBalance, ledger, stakingConsts]);

  useEffect(() => {
    if (!Number(availableBalance)) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    setNextButtonCaption(t('Next'));
    setNextToStakeButtonDisabled(false);

    if (Number(availableBalance) <= Number(stakeAmountInHuman) || !Number(stakeAmountInHuman)) {
      setNextToStakeButtonDisabled(true);

      if (Number(availableBalance) <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman)) {
        setNextButtonCaption(t('Insufficient Balance'));
      }
    }

    if (Number(stakeAmountInHuman) && Number(stakeAmountInHuman) < minStakeable) {
      setNextToStakeButtonDisabled(true);
    }
  }, [stakeAmountInHuman, availableBalance, t, minStakeable]);

  // TODO: selecting validators automatically, may move to confirm page!
  useEffect(() => {
    if (validatorsInfo && stakingConsts) {
      const selectedVAcc = selectBestValidators(validatorsInfo, stakingConsts);

      setSelectedValidatorsAcounts(selectedVAcc);
      console.log('selectedValidatorsAcouns', selectedVAcc);
    }
  }, [stakingConsts, validatorsInfo]);

  useEffect(() => {
    const oversubscribed = nominatedValidators?.find((v) => v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator);

    setHasOversubscribed(!!oversubscribed);
  }, [nominatedValidators, stakingConsts]);

  // TODO: find a better algorithm to select validators automatically
  function selectBestValidators(validatorsInfo: Validators, stakingConsts: StakingConsts): DeriveStakingQuery[] {
    const allValidators = validatorsInfo.current.concat(validatorsInfo.waiting);
    const nonBlockedValidatorsAccountId = allValidators.filter((v) =>
      !v.validatorPrefs.blocked && // filter blocked validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < MAX_ACCEPTED_COMMISSION && // filter high commision validators
      v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator // filter oversubscribed
    );
    // .map((v) => v.accountId.toString());// TODO: sort it too

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

  const handleValidatorSelectionType = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setValidatorSelectionType(event.target.value);
    setConfirmStakingModalOpen(false);
  }, [setValidatorSelectionType]);

  const handleStakeAmountInput = useCallback((value: number): void => {
    setAlert('');

    if (value && value < minStakeable) {
      setAlert(t(`Staking amount is too low, it must be at least ${minStakeable} ${chainInfo?.coin}`));
    }

    if (value > maxStake && value < Number(availableBalance)) {
      setAlert(t('Your account will be reaped!'));
    }

    setStakeAmountInHuman(fixFloatingPoint(String(value)));
    setStakeAmount(amountToMachine(String(value), chainInfo?.decimals));
  }, [availableBalance, chainInfo, maxStake, minStakeable, t]);

  const handleStakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(Number(value));
  }, [handleStakeAmountInput]);

  function handleMinStakeClicked() {
    handleStakeAmountInput(minStakeable);
  }

  function handleMaxStakeClicked() {
    handleStakeAmountInput(maxStake);
  }

  const handleUnstakeAmountChanged = (value: string): void => {
    setAlert('');
    value = fixFloatingPoint(value);
    setUnstakeAmountInHuman(value);

    if (!Number(value)) { return; }

    const currentlyStaked = BigInt(ledger ? ledger.active.toString() : '0');

    console.log(`fixFloatingPoint(value) ${fixFloatingPoint(value)}  `);

    if (Number(value) > Number(currentlyStakedInHuman)) {
      setAlert(t('It is more than already staked!'));

      return;
    }

    const remainStaked = currentlyStaked - amountToMachine(value, chainInfo?.decimals);

    // to remove dust from just comparision
    const remainStakedInHuman = Number(amountToHuman(remainStaked.toString(), chainInfo?.decimals));

    console.log(`remainStaked ${remainStaked}  currentlyStaked ${currentlyStaked} amountToMachine(value, chainInfo?.decimals) ${amountToMachine(value, chainInfo?.decimals)}`);

    if (remainStakedInHuman > 0 && remainStakedInHuman < stakingConsts?.minNominatorBond) {
      setAlert(`Remained stake amount: ${amountToHuman(remainStaked.toString(), chainInfo?.decimals)} should not be less than ${stakingConsts?.minNominatorBond} ${chainInfo?.coin}`);

      return;
    }

    if (currentlyStakedInHuman && currentlyStakedInHuman === value) {
      // to include even dust
      setUnstakeAmount(BigInt(ledger ? ledger.active.toString() : '0'));
    } else {
      setUnstakeAmount(Number(value) ? amountToMachine(value, chainInfo?.decimals) : 0n);
    }

    setNextToUnStakeButtonDisabled(false);
  };

  const handleUnstakeAmount = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setNextToUnStakeButtonDisabled(true);
    let value = event.target.value;

    if (Number(value) < 0) { value = String(-Number(value)); }

    handleUnstakeAmountChanged(value);
  };

  const handleMaxUnstakeClicked = useCallback(() => {
    if (currentlyStakedInHuman) { handleUnstakeAmountChanged(currentlyStakedInHuman); }
  }, [currentlyStakedInHuman]);

  function handleConfirmStakingModaOpen(): void {
    setConfirmStakingModalOpen(true);
    console.log('handleConfirmStakingModaOpen, state:', state);
  }

  const handleNextToStake = (): void => {
    if (Number(stakeAmountInHuman) >= minStakeable) {
      switch (validatorSelectionType) {
        case ('Auto'):
          handleConfirmStakingModaOpen();
          if (!state) setState('stakeAuto');
          break;
        case ('Manual'):
          handleSelectValidatorsModaOpen();
          if (!state) setState('stakeManual');
          break;
        case ('KeepNominated'):
          handleConfirmStakingModaOpen();
          if (!state) setState('stakeKeepNominated');
          break;
        default:
          console.log('unknown validatorSelectionType !!');
      }
    }
  };

  const handleNextToUnstake = (): void => {
    console.log(`state is ${state} going to change to unstake`);
    if (!state) setState('unstake');
    handleConfirmStakingModaOpen();
  };

  const handleSelectValidatorsModaOpen = useCallback((): void => {
    setSelectValidatorsModalOpen(true);

    if (!state) setState('changeValidators');
  }, [state]);

  const handleStopNominating = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('stopNominating');
  }, [state]);

  function TabPanel(props: TabPanelProps) {
    const { children, index, value, ...other } = props;

    return <div
      aria-labelledby={`tab-${index}`}
      hidden={value !== index}
      id={`tabpanel-${index}`}
      role='tabpanel'
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>;
  }

  const handleWithdrowUnbound = () => {
    if (!state) setState('withdrawUnbound');
    handleConfirmStakingModaOpen();
  };

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
  }, [state, unstakeAmount, stakeAmount, redeemable, chainInfo]);

  useEffect(() => {
    const active = nominatedValidators?.find((n) => n.exposure.others.find(({ who }) => who.toString() === staker.address));

    setActiveValidator(active);
  }, [nominatedValidators, staker.address]);

  return (
    <Popup handleClose={handleEasyStakingModalClose} showModal={showStakingModal}>
      <PlusHeader action={handleEasyStakingModalClose} chain={chain} closeText={'Close'} icon={<Brightness7OutlinedIcon fontSize='small' />} title={'Easy Staking'} />

      <Grid alignItems='center' container>
        <Grid alignItems='center' container item justifyContent='center' xs={12}>
          <Paper elevation={4} sx={{ borderRadius: '10px', margin: '25px 30px 10px', p: 3 }}>
            <Grid container item>
              <Grid container item justifyContent='space-between' sx={{ padding: '10px 0px 20px' }}>
                <Grid item>
                  <b> {t('Available')}: </b> <Box component='span' sx={{ fontWeight: 600 }}> {availableBalance}</Box>
                </Grid>
                <Grid item>
                  <b> {t('Staked')}: </b> {!ledger
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}>
                      {currentlyStakedInHuman || '0.00'}
                    </Box>
                  }
                </Grid>
              </Grid>
              <Grid container item justifyContent='space-between'>
                <Grid item>
                  <b> {t('Reward')}: </b>{!totalReceivedReward
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}> {totalReceivedReward}</Box>
                  }
                </Grid>
                <Grid item>
                  <b>{t('Redeemable')} : </b>{redeemable === null
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}>
                      {redeemable ? amountToHuman(String(redeemable), chainInfo?.decimals) : '0.00'}   {' '}
                    </Box>
                  }
                  <Hint id='redeem' place='top' tip={t('Withdraw unbounded')}>
                    <IconButton disabled={!redeemable} edge='start' onClick={handleWithdrowUnbound} size='small'>
                      <RedeemIcon color={redeemable ? 'warning' : 'disabled'} fontSize='inherit' />
                    </IconButton>
                  </Hint>
                </Grid>
                <Grid item>
                  <b> {t('Unstaking')}:</b> {!ledger
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}>
                      {unlockingAmount ? amountToHuman(String(unlockingAmount), chainInfo?.decimals) : '0.00'}
                    </Box>
                  }
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs centered indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue}>
              <Tab icon={<AddCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11 }} />
              <Tab icon={<RemoveCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11 }} />
              <Tab
                icon={gettingNominatedValidatorsInfoFromBlockchain && !noNominatedValidators
                  ? <CircularProgress size={12} thickness={2} />
                  : hasOversubscribed
                    ? <ReportProblemOutlined color='warning' fontSize='small' sx={{ pr: 1 }} />
                    : Number(currentlyStakedInHuman) && !nominatedValidators?.length
                      ? <Hint id='noNominees' place='top' tip={t('No validators nominated')}>
                        <NotificationsActiveIcon color='error' fontSize='small' sx={{ pr: 1 }} />
                      </Hint>
                      : !activeValidator && nominatedValidators?.length
                        ? <Hint id='noActive' place='top' tip={t('No active validator in this era')}>
                          <ReportOutlinedIcon color='warning' fontSize='small' sx={{ pr: 1 }} />
                        </Hint>
                        : <CheckOutlined fontSize='small' />
                }

                iconPosition='start' label='Nominations' sx={{ fontSize: 11 }}
              />
              <Tab
                icon={gettingStakingConstsFromBlockchain ? <CircularProgress size={12} thickness={2} /> : <InfoOutlined fontSize='small' />}
                iconPosition='start' label='Info' sx={{ fontSize: 11 }}
              />
            </Tabs>
          </Box>
          <TabPanel index={0} value={tabValue}>
            <Stake
              alert={alert}
              coin={chainInfo?.coin}
              handleMaxStakeClicked={handleMaxStakeClicked}
              handleMinStakeClicked={handleMinStakeClicked}
              handleNextToStake={handleNextToStake}
              handleStakeAmount={handleStakeAmount}
              handleValidatorSelectionType={handleValidatorSelectionType}
              maxStake={maxStake}
              minStakeable={minStakeable}
              nextButtonCaption={nextButtonCaption}
              nextToStakeButtonBusy={!ledger && !validatorsInfoIsUpdated && ['KeepNominated', 'Auto'].includes(validatorSelectionType) && state !== ''}
              nextToStakeButtonDisabled={nextToStakeButtonDisabled}
              nominatedValidators={nominatedValidators}
              stakeAmountInHuman={stakeAmountInHuman}
              validatorSelectionType={validatorSelectionType}
              zeroBalanceAlert={zeroBalanceAlert}
            />
          </TabPanel>
          <TabPanel index={1} value={tabValue}>
            <Unstake
              alert={alert}
              coin={chainInfo?.coin}
              currentlyStakedInHuman={currentlyStakedInHuman}
              handleMaxUnstakeClicked={handleMaxUnstakeClicked}
              handleNextToUnstake={handleNextToUnstake}
              handleUnstakeAmount={handleUnstakeAmount}
              ledger={ledger}
              nextToUnStakeButtonBusy={state === 'unstake'}
              nextToUnStakeButtonDisabled={nextToUnStakeButtonDisabled}
              unstakeAmountInHuman={unstakeAmountInHuman}
            />
          </TabPanel>
          <TabPanel index={2} value={tabValue}>
            <Nominations
              activeValidator={activeValidator}
              chain={chain}
              currentlyStakedInHuman={currentlyStakedInHuman}
              handleSelectValidatorsModaOpen={handleSelectValidatorsModaOpen}
              handleStopNominating={handleStopNominating}
              noNominatedValidators={noNominatedValidators}
              nominatedValidators={nominatedValidators}
              staker={staker}
              stakingConsts={stakingConsts}
              state={state}
              validatorsInfo={validatorsInfo}
              validatorsName={validatorsName}
            />
          </TabPanel>
          <TabPanel index={3} value={tabValue}>
            <Info
              coin={chainInfo?.coin}
              decimals={chainInfo?.decimals}
              stakingConsts={stakingConsts}
            />
          </TabPanel>
        </Grid>
      </Grid>

      {stakingConsts && validatorsInfo &&
        <SelectValidators
          chain={chain}
          coin={chainInfo?.coin}
          decimals={chainInfo?.decimals}
          // handleEasyStakingModalClose={handleEasyStakingModalClose}
          ledger={ledger}
          nominatedValidators={selectedValidators}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
          setState={setState}
          showSelectValidatorsModal={showSelectValidatorsModal}
          stakeAmount={stakeAmount}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          // validatorsInfoFromSubscan={validatorsInfoFromSubscan}
          validatorsInfo={validatorsInfo}
          validatorsName={validatorsName}
        />
      }
      {((ledger && staker && (selectedValidators || nominatedValidators) && state !== '') || state === 'stopNominating') &&
        <ConfirmStaking
          amount={getAmountToConfirm()}
          chain={chain}
          coin={chainInfo?.coin}
          handleEasyStakingModalClose={handleEasyStakingModalClose}
          // lastFee={lastFee}
          decimals={chainInfo?.decimals}
          ledger={ledger}
          nominatedValidators={nominatedValidators}
          selectedValidators={selectedValidators}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setState={setState}
          showConfirmStakingModal={showConfirmStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          // validatorsInfo={validatorsInfo}
          validatorsName={validatorsName}
          validatorsToList={selectedValidators}
        />
      }
    </Popup>
  );
}
