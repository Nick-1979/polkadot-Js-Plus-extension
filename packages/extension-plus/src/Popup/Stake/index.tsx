// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { AddCircleOutlineOutlined, Brightness7Outlined as Brightness7OutlinedIcon, CheckOutlined, InfoOutlined, Redeem as RedeemIcon, RemoveCircleOutlineOutlined } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, FormLabel, Grid, IconButton, InputAdornment, Paper, Radio, RadioGroup, Skeleton, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { formatBalance } from '@polkadot/util';

import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../extension-ui/src/messaging';
import { PlusHeader, Popup, Progress } from '../../components';
import { DEFAULT_COIN, MAX_ACCEPTED_COMMISSION, MIN_EXTRA_BOND } from '../../util/constants';
import getNetworkInfo from '../../util/getNetwork';
import { AccountsBalanceType, AllValidatorsFromSubscan, savedMetaData, StakingConsts, Validators, ValidatorsName } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint, prepareMetaData } from '../../util/plusUtils';
import { getAllValidatorsFromSubscan, getStakingReward } from '../../util/staking';
import ConfirmStaking from './ConfirmStaking';
import SelectValidators from './SelectValidators';
import ValidatorsList from './ValidatorsList';

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
  const [coin, setCoin] = useState('');
  const [ED, setED] = useState(0);
  const [decimals, setDecimals] = useState(1);
  const [minNominatorBondInHuman, setMinNominatorBondInHuman] = useState<string>('');
  const [minNominatorBond, setMinNominatorBond] = useState<bigint>(0n);
  const [minStakeable, setMinStakeable] = useState<string>('');
  const [stakingConsts, setStakingConsts] = useState<StakingConsts | null>(null);
  const [gettingStakingConstsFromBlockchain, setgettingStakingConstsFromBlockchain] = useState<boolean>(true);
  const [gettingNominatedValidatorsInfoFromBlockchain, setGettingNominatedValidatorsInfoFromBlockchain] = useState<boolean>(true);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);
  const [nextToUnStakeButtonDisabled, setNextToUnStakeButtonDisabled] = useState(true);
  const [maxStake, setMaxStake] = useState<string>('0');
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
  const [validatorsInfo, setValidatorsInfo] = useState<Validators | null>(null);  // validatorsInfo is all validators (current and waiting) information  
  const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
  const [validatorsInfoFromSubscan, setValidatorsInfoFromSubscan] = useState<AllValidatorsFromSubscan | null>(null);
  const [selectedValidators, setSelectedValidatorsAcounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | null>(null);
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean>(false);
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [validatorSelectionType, setValidatorSelectionType] = useState<string>('Auto');
  const [state, setState] = useState<string>(''); // {'', 'stakeAuto', 'stakeManual', 'changeValidators','confirming', 'failed,'success'}
  const [tabValue, setTabValue] = React.useState(3);
  const [unstakeAmountInHuman, setUnstakeAmountInHuman] = React.useState<string | null>(null);
  const [unstakeAmount, setUnstakeAmount] = React.useState<bigint>(0n);
  const [unlockingAmount, setUnlockingAmount] = React.useState<bigint>(0n);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setAlert('');
  };

  useEffect(() => {
    if (!chain) {
      console.log(' no fetch/subscribe for no chain');

      return;
    }

    const { ED, coin, decimals, minNominatorBond } = getNetworkInfo(chain);

    setDecimals(decimals);
    setCoin(coin || DEFAULT_COIN);
    setED(ED || 0);

    setZeroBalanceAlert(Number(staker.balanceInfo?.available) <= 0);

    let formattedMinNominatorBond = formatBalance(minNominatorBond, { forceUnit: '-', withSi: false }, decimals);
    const [prefix, postfix] = formattedMinNominatorBond.split('.');

    if (Number(postfix) === 0) {
      formattedMinNominatorBond = prefix;
    }

    setMinNominatorBondInHuman(formattedMinNominatorBond);

    setMinNominatorBond(BigInt(minNominatorBond));

    setMinStakeable(formattedMinNominatorBond);

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

    // *** get staking reward
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getStakingReward(chain, staker.address).then((reward) => {
      if (!reward) reward = '0';
      reward = amountToHuman(String(reward), decimals) === '0' ? '0.00' : amountToHuman(reward, decimals);
      setTotalReceivedReward(reward);
    });

    // getBonded(chain, account.address)
  }, []);

  useEffect(() => {
    if (ledger && decimals) {
      setCurrentlyStakedInHuman(amountToHuman(String(ledger.active), decimals));

      // set unlocking
      let unlockingValue = 0n;

      if (ledger.unlocking) {
        ledger.unlocking.forEach((u) => { unlockingValue += BigInt(String(u.value)); });
      }

      let value = unlockingValue;

      if (redeemable) { value = unlockingValue - redeemable }

      setUnlockingAmount(value);
    }
  }, [ledger, decimals]);

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
      // eslint-disable-next-line padding-line-between-statements
      if (Number(ledger.active) > 0) {
        setMinStakeable(String(MIN_EXTRA_BOND));
      }

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

      if (stakingAccount) { setRedeemable(BigInt(JSON.parse(stakingAccount).redeemable)); }
      else { setRedeemable(0n); }

      getRedeemableWorker.terminate(); // stay awake, will be terminated at the end
    };
  };


  useEffect(() => {
    if (!chain) {
      console.log(' no fetch/subscribe for no chain');

      return;
    }

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

      if (!targets) setNoNominatedValidators(true);
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
      console.log('new unlockAmount', unlockingAmount - redeemable)

      setUnlockingAmount(unlockingAmount - redeemable);
    }
  }, [redeemable]);

  useEffect(() => {
    if (validatorsInfo && nominatedValidatorsId && chain && account.address) {
      // find all information of nominated validators from all validatorsInfo(current and waiting)
      const nvi = validatorsInfo.current
        .concat(validatorsInfo.waiting)
        .filter((v: DeriveStakingQuery) => nominatedValidatorsId.includes(String(v.accountId)));

      setNominatedValidatorsInfo(nvi);
      setGettingNominatedValidatorsInfoFromBlockchain(false);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateMeta(account.address, prepareMetaData(chain, 'nominatedValidators', nvi));
    }
  }, [nominatedValidatorsId, validatorsInfo, chain, account.address]);

  useEffect(() => {
    setMaxStake(fixFloatingPoint(Number(availableBalance) - 2 * ED));
  }, [ED, availableBalance]);

  useEffect(() => {
    if (!Number(availableBalance)) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    // if (Number(availableBalance) === Number(stakeAmountInHuman) + Number(amountToHuman(lastFee || defaultFee, decimals))) {
    //   setNoFeeAlert(true);
    // } else {
    //   setNoFeeAlert(false);
    // }

    setNextButtonCaption(t('Next'));
    setNextToStakeButtonDisabled(false);

    if (Number(availableBalance) <= Number(stakeAmountInHuman) || !Number(stakeAmountInHuman)) {
      setNextToStakeButtonDisabled(true);

      if (Number(availableBalance) <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman)) {
        setNextButtonCaption(t('Insufficient Balance'));
      }
    }

    if (Number(stakeAmountInHuman) && Number(stakeAmountInHuman) < Number(minStakeable)) {
      setNextToStakeButtonDisabled(true);
    }
  }, [stakeAmountInHuman, availableBalance, t, minStakeable]);

  // TODO: selecting validators automatically, move to confirm page
  useEffect(() => {
    if (validatorsInfo && stakingConsts) {
      const selectedVAcc = selectBestValidators(validatorsInfo, stakingConsts);

      setSelectedValidatorsAcounts(selectedVAcc);
      // console.log('selectedValidatorsAcountId', selectedVAccId);
    }
  }, [stakingConsts, validatorsInfo]);

  // TODO: find an algorithm to select validators automatically
  function selectBestValidators(validatorsInfo: Validators, stakingConsts: StakingConsts): DeriveStakingQuery[] {

    const allValidators = validatorsInfo.current.concat(validatorsInfo.waiting);
    const nonBlockedValidatorsAccountId = allValidators.filter((v) =>
      !v.validatorPrefs.blocked && // filter blocked validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < MAX_ACCEPTED_COMMISSION && // filter high commision validators
      v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator // filter oversubscribed
    )
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

  const handleStakeAmountInput = useCallback((value: string): void => {
    setAlert('');

    if (Number(value) && Number(value) < Number(minStakeable)) {
      setAlert(t(`Staking amount is too low, it must be at least ${minStakeable} ${coin}`));
    }

    if (Number(maxStake) && Number(value) > Number(maxStake) && Number(value) < Number(availableBalance)) {
      setAlert(t('Your account will be reaped!'));
    }

    setStakeAmountInHuman(fixFloatingPoint(value));
    setStakeAmount(amountToMachine(value, decimals));
  }, [availableBalance, coin, decimals, maxStake, minStakeable, t]);

  const handleStakeAmountOnChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(value);

  }, [handleStakeAmountInput]);

  function handleMinStakeClicked() {
    handleStakeAmountInput(minStakeable);
  }

  function handleMaxStakeClicked() {
    handleStakeAmountInput(maxStake);
  }

  const handleUnstakeAmountChangedConditions = (value: string): void => {
    setAlert('');
    setUnstakeAmountInHuman(fixFloatingPoint(value));

    if (!Number(value)) { return; }

    const currentlyStaked = BigInt(ledger ? ledger.active.toString() : '0');

    console.log(`Number(currentlyStakedInHuman) ${Number(currentlyStakedInHuman)}  Number(value) ${Number(value)}`);

    if (Number(value) > Number(currentlyStakedInHuman)) {
      setAlert(t('It is more than already staked!'));

      return;
    }

    const remainStaked = currentlyStaked - amountToMachine(value, decimals);

    // to remove dust from just comparision
    const remainStakedInHuman = Number(amountToHuman(remainStaked.toString(), decimals));
    const minNominatorBondInHuman = Number(amountToHuman(minNominatorBond.toString(), decimals));

    console.log(`remainStaked ${remainStaked}  currentlyStaked ${currentlyStaked} amountToMachine(value, decimals) ${amountToMachine(value, decimals)}`);

    if (remainStakedInHuman > 0 && remainStakedInHuman < minNominatorBondInHuman) {
      setAlert(`Remained stake amount: ${amountToHuman(remainStaked.toString(), decimals)} should not be less than ${minNominatorBondInHuman} ${coin}`);

      return;
    }

    if (currentlyStakedInHuman && currentlyStakedInHuman === value) {
      // to include even dust
      setUnstakeAmount(BigInt(ledger ? ledger.active.toString() : '0'));
    } else {
      setUnstakeAmount(Number(value) ? amountToMachine(value, decimals) : 0n);
    }

    setNextToUnStakeButtonDisabled(false);
  }

  const handleUnstakeAmountOnChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setNextToUnStakeButtonDisabled(true);
    let value = event.target.value;

    if (Number(value) < 0) { value = String(-Number(value)); }

    handleUnstakeAmountChangedConditions(value);
  };

  const handleMaxUnstakeClicked = useCallback(() => {
    if (currentlyStakedInHuman) { handleUnstakeAmountChangedConditions(currentlyStakedInHuman); }
  }, [currentlyStakedInHuman]);

  function handleConfirmStakingModaOpen(): void {
    setConfirmStakingModalOpen(true);
    console.log('handleConfirmStakingModaOpen, state:', state);
  }

  const handleSelectValidatorsModaOpen = useCallback((): void => {
    setSelectValidatorsModalOpen(true);

    if (!state) setState('changeValidators');
  }, [state]);

  const handleNextToStake = (): void => {
    if (Number(stakeAmountInHuman) >= Number(minStakeable)) {
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
          console.log('unknown validatorSelectionType ');
      }
    }
  };

  const handleNextToUnstake = (): void => {
    console.log(`state is ${state} going to change to unstake`);
    if (!state) setState('unstake');
    handleConfirmStakingModaOpen();
  };

  function TabPanel(props: TabPanelProps) {
    const { children, index, value, ...other } = props;

    return (
      <div
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
      </div>
    );
  }

  const handleWithdrowUnbound = () => {
    if (!state) setState('withdrawUnbound');
    handleConfirmStakingModaOpen();
  }

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
    };
  }, [state, unstakeAmount, stakeAmount, redeemable, decimals]);

  return (
    <Popup showModal={showStakingModal} handleClose={handleEasyStakingModalClose}>
      <PlusHeader action={handleEasyStakingModalClose} chain={chain} closeText={'Close'} icon={<Brightness7OutlinedIcon fontSize='small' />} title={'Easy Staking'} />

      <Grid alignItems='center' container>
        <Grid alignItems='center' container item justifyContent='center' xs={12}>
          <Paper elevation={4} sx={{ borderRadius: '10px', margin: '25px 30px 10px', p: 3 }}>
            <Grid container item >
              <Grid item container sx={{ padding: '10px 0px 20px' }} justifyContent='space-between'>
                <Grid item >
                  <b> {t('Available')}: </b> <Box component='span' sx={{ fontWeight: 600 }}> {availableBalance}</Box>
                </Grid>
                <Grid item >
                  <b> {t('Staked')}: </b> {!ledger
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}>
                      {currentlyStakedInHuman || '0.00'}
                    </Box>
                  }
                </Grid>
              </Grid>
              <Grid item container justifyContent='space-between'>
                <Grid item >
                  <b> {t('Reward')}: </b>{!totalReceivedReward
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}> {totalReceivedReward}</Box>
                  }
                </Grid>
                <Grid item >
                  <b>{t('Redeemable')} : </b>{redeemable === null
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}>
                      {redeemable ? amountToHuman(String(redeemable), decimals) : '0.00'}   {' '}
                    </Box>
                  }
                  <Tooltip title='Withdraw unbounded' arrow placement='top'>
                    <IconButton onClick={handleWithdrowUnbound} size='small' edge='start' disabled={!redeemable}>
                      <RedeemIcon color={redeemable ? 'warning' : 'disabled'} fontSize='inherit' />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item >
                  <b> {t('Unstaking')}:</b> {!ledger
                    ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                    : <Box component='span' sx={{ fontWeight: 600 }}>
                      {unlockingAmount ? amountToHuman(String(unlockingAmount), decimals) : '0.00'}
                    </Box>
                  }
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs textColor='secondary' indicatorColor='secondary' centered value={tabValue} onChange={handleTabChange}>
              <Tab icon={<AddCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11 }} />
              <Tab icon={<RemoveCircleOutlineOutlined fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11 }} />
              <Tab icon={gettingNominatedValidatorsInfoFromBlockchain && !noNominatedValidators
                ? <CircularProgress thickness={2} size={12} />
                : <CheckOutlined fontSize='small' />}
                iconPosition='start' label='Nominated Validators' sx={{ fontSize: 11 }}
              />
              <Tab
                icon={gettingStakingConstsFromBlockchain ? <CircularProgress thickness={2} size={12} /> : <InfoOutlined fontSize='small' />}
                iconPosition='start' label='Info' sx={{ fontSize: 11 }}
              />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <Grid container>
              <Grid item sx={{ padding: '10px 30px 0px' }} xs={12}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
                  autoFocus
                  color='warning'
                  error={zeroBalanceAlert}
                  fullWidth
                  helperText={zeroBalanceAlert ? t('Available balance is zero.') : ''}
                  inputProps={{ step: '.01' }}
                  label={t('Amount')}
                  name='stakeAmount'
                  // onBlur={(event) => handleStakeAmountOnBlur(event.target.value)}
                  onChange={handleStakeAmountOnChange}
                  placeholder='0.0'
                  // size='small'
                  type='number'
                  value={stakeAmountInHuman}
                  variant='outlined'
                />
              </Grid>
              {!zeroBalanceAlert &&
                <Grid container item justifyContent='space-between' sx={{ padding: '0px 30px 10px' }} xs={12}>
                  <Grid item sx={{ fontSize: 12 }}>
                    {minStakeable &&
                      <>
                        {t('Min')}  :
                        <Button onClick={handleMinStakeClicked} variant='text'>
                          {`${minStakeable} ${coin}`}
                        </Button>
                      </>
                    }
                  </Grid>
                  <Grid item sx={{ fontSize: 12 }}>
                    {maxStake &&
                      <>
                        {t('Max')}:
                        <Button onClick={handleMaxStakeClicked} variant='text'>
                          {`${maxStake} ${coin}`}
                        </Button>
                      </>
                    }
                  </Grid>
                </Grid>
              }
              <Grid item container sx={{ fontSize: 13, fontWeight: '600', textAlign: 'center', padding: '5px 30px 5px' }} xs={12}>
                {alert
                  ? <Grid item xs={12}>
                    <Alert severity='error' sx={{ fontSize: 12 }} >
                      {alert}
                    </Alert>
                  </Grid>
                  : <Grid item sx={{ paddingTop: '45px' }} xs={12}></Grid>
                }
              </Grid>
              <Grid item xs={12} justifyContent='center' sx={{ textAlign: 'center' }}>
                <FormControl fullWidth>
                  <Grid alignItems='center' container justifyContent='center'>
                    <Grid item sx={{ fontSize: 12 }} xs={3}>
                      <FormLabel sx={{ fontSize: 12, fontWeight: '500', color: 'black' }}>{t('Validator selection')}:</FormLabel>
                    </Grid>
                    <Grid item xs={9} sx={{ textAlign: 'right' }}>
                      <RadioGroup
                        defaultValue='Auto'
                        onChange={handleValidatorSelectionType}
                        row
                        value={validatorSelectionType}
                      >
                        <FormControlLabel
                          control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
                          label={<Box fontSize={12}>Auto <Box
                            component='span'
                            sx={{ color: 'gray' }}
                          > (best return)</Box></Box>}
                          value='Auto'
                        />
                        <FormControlLabel
                          control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
                          label={<Box fontSize={12}>Manual</Box>}
                          sx={{ fontSize: 12 }}
                          value='Manual'
                        />
                        {nominatedValidators &&
                          <FormControlLabel
                            control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
                            label={<Box fontSize={12}>Keep nominated</Box>}
                            sx={{ fontSize: 12 }}
                            value='KeepNominated'
                          />
                        }
                      </RadioGroup>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
              <Grid item sx={{ padding: '20px 10px 0px' }} xs={12}>
                <Grid item xs={12}>
                  <NextStepButton
                    data-button-action='next to stake'
                    isBusy={!ledger && !validatorsInfoIsUpdated && ['KeepNominated', 'Auto'].includes(validatorSelectionType) && state !== ''}
                    isDisabled={nextToStakeButtonDisabled}
                    onClick={handleNextToStake}
                  >
                    {nextButtonCaption}
                  </NextStepButton>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Grid container title='Unstake'>
              <Grid item sx={{ padding: '10px 30px 0px' }} xs={12}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
                  autoFocus
                  color='info'
                  error={!currentlyStakedInHuman || Number(unstakeAmountInHuman) > Number(currentlyStakedInHuman)}
                  fullWidth
                  helperText={currentlyStakedInHuman === null
                    ? t('Fetching data from blockchain ...')
                    : (Number(currentlyStakedInHuman) === 0 && t('Nothing to unstake'))
                  }
                  inputProps={{ step: '.01' }}
                  label={t('Amount')}
                  name='unstakeAmount'
                  onChange={handleUnstakeAmountOnChange}
                  placeholder='0.0'
                  type='number'
                  value={unstakeAmountInHuman}
                  variant='outlined'
                />
              </Grid>
              {ledger?.total
                ? <Grid container item justifyContent='flex-end' sx={{ padding: '0px 30px 10px' }} xs={12}>
                  <Grid item sx={{ fontSize: 12 }}>
                    {Number(ledger?.active)
                      ? <>
                        {t('Max')}:
                        <Button
                          onClick={handleMaxUnstakeClicked}
                          variant='text'
                        >
                          {`${String(currentlyStakedInHuman)} ${coin}`}
                        </Button>
                      </>
                      : ''}
                  </Grid>
                </Grid>
                : ''}
              <Grid item container sx={{ fontSize: 13, fontWeight: '600', padding: '5px 30px 5px', textAlign: 'center' }} xs={12}>
                {alert
                  ? <Grid item xs={12}>
                    <Alert severity='error' sx={{ fontSize: 12 }} >
                      {alert}
                    </Alert>
                  </Grid>
                  : <Grid item sx={{ paddingTop: '45px' }} xs={12}></Grid>
                }
              </Grid>
              <Grid xs={12} item sx={{ padding: '50px 10px 0px' }} >
                <NextStepButton
                  data-button-action='next to unstake'
                  isBusy={state === 'unstake'}
                  isDisabled={nextToUnStakeButtonDisabled}
                  // !Number(currentlyStakedInHuman) || !unstakeAmountInHuman || Number(unstakeAmountInHuman) > Number(currentlyStakedInHuman)}
                  onClick={handleNextToUnstake}
                >
                  {t('Next')}
                </NextStepButton>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {nominatedValidators && stakingConsts
              ? <Grid container>
                <Grid item xs={12} sx={{ paddingBottom: '20px' }}>
                  <ValidatorsList
                    chain={chain}
                    stakingConsts={stakingConsts}
                    validatorsInfo={nominatedValidators}
                    validatorsName={validatorsName} />
                </Grid>
                <Grid item sx={{ padding: '20px 10px 0px' }} xs={12}>
                  <NextStepButton
                    data-button-action='Change Nominated Validators'
                    isBusy={validatorsInfo && state === 'changeValidators'}
                    // isDisabled={nextToStakeButtonDisabled}
                    onClick={handleSelectValidatorsModaOpen}
                  >
                    {t('Change nominated validators')}
                  </NextStepButton>
                </Grid>
              </Grid>
              : !noNominatedValidators
                ? <Progress title={'Loading nominators ...'} />
                : <Grid xs={12} sx={{ fontSize: 13, marginTop: '60px', textAlign: 'center' }}>
                  {t('You do not nominated any validators yet.')}
                </Grid>
            }
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <Grid container sx={{ paddingTop: '20px', textAlign: 'center' }}>
              <Grid xs={12} sx={{ fontSize: 15 }}>
                {t('Welcome to Staking')}
              </Grid>
              <Grid xs={12} sx={{ fontSize: 12, paddingBottom: '40px' }}>
                {t('Information you need to know about')}
              </Grid>
              {stakingConsts
                ? <>
                  <Grid xs={12} sx={{ fontSize: 11, paddingBottom: '5px' }}>
                    {t('Maximum validators you can select: ')}<Box component='span' sx={{ fontWeight: 'bold' }}>  {stakingConsts?.maxNominations}</Box>
                  </Grid>
                  <Grid xs={12} sx={{ fontSize: 11, paddingBottom: '5px' }}>
                    {t('Minimum')} {coin}s {t('to be a staker: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {minNominatorBondInHuman}</Box> {coin}s
                  </Grid>
                  <Grid xs={12} sx={{ fontSize: 11, paddingBottom: '5px' }}>
                    {t('Maximum stakers of a validator, who receives rewards: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {stakingConsts?.maxNominatorRewardedPerValidator}</Box>
                  </Grid>
                  <Grid xs={12} sx={{ fontSize: 11, paddingBottom: '5px' }}>
                    {t('Days it takes to receive your funds back after unstaking:  ')}<Box component='span' sx={{ fontWeight: 'bold' }}>  {stakingConsts?.bondingDuration}</Box>  {t('days')}
                  </Grid>
                  <Grid xs={12} sx={{ fontSize: 11, paddingBottom: '5px' }}>
                    {t('Minimum')} {coin}s {t('that must remain in you account: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {amountToHuman(String(stakingConsts?.existentialDeposit), decimals)}</Box> {coin}s {t('plus some fees')}
                  </Grid>
                </>
                : <Progress title={'Loading information ...'} />
              }
            </Grid>
          </TabPanel>
        </Grid>
      </Grid>

      {stakingConsts && validatorsInfo &&
        <SelectValidators
          chain={chain}
          coin={coin}
          decimals={decimals}
          ledger={ledger}
          handleEasyStakingModalClose={handleEasyStakingModalClose}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
          setState={setState}
          showSelectValidatorsModal={showSelectValidatorsModal}
          stakeAmount={stakeAmount}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsInfo={validatorsInfo}
          // validatorsInfoFromSubscan={validatorsInfoFromSubscan}
          validatorsName={validatorsName}
          nominatedValidators={selectedValidators}
        />
      }
      {ledger && staker && (selectedValidators || nominatedValidators) && state !== '' &&
        <ConfirmStaking
          amount={getAmountToConfirm()}
          chain={chain}
          decimals={decimals}
          // handleEasyStakingModalClose={handleEasyStakingModalClose}
          // lastFee={lastFee}
          coin={coin}
          ledger={ledger}
          nominatedValidators={nominatedValidators}
          selectedValidators={selectedValidators}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setState={setState}
          showConfirmStakingModal={showConfirmStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsInfo={validatorsInfo}
          validatorsName={validatorsName}
          validatorsToList={selectedValidators}
        />
      }
    </Popup>
  );
}
