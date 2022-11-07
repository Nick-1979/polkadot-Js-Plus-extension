// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  in this component manual selection of validators is provided, with some filtering features to facilitate selection process
 **/
import type { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { Chain } from '../../../../../extension-chains/src/types';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, StakingConsts, Validators } from '../../../util/plusTypes';

import { ArrowDropDown as ArrowDropDownIcon, ArrowDropUp as ArrowDropUpIcon, DeleteSweepRounded as DeleteSweepRoundedIcon, RecommendOutlined as RecommendOutlinedIcon, Search as SearchIcon } from '@mui/icons-material';
import { Box, Checkbox, Container, FormControlLabel, Grid, InputAdornment, Paper, TextField } from '@mui/material';
import { grey, pink } from '@mui/material/colors';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Hint, PlusHeader, Popup } from '../../../components';
import { DEFAULT_VALIDATOR_COMMISION_FILTER } from '../../../util/constants';
import ShowValidator from '../common/ShowValidator';
import ValidatorInfo from '../common/ValidatorInfo';
import ConfirmStaking from './ConfirmStaking';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  staker: AccountsBalanceType;
  showSelectValidatorsModal: boolean;
  nominatedValidators: DeriveStakingQuery[] | null;
  setSelectValidatorsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts;
  stakeAmount: BN;
  validatorsInfo: Validators;
  setState: React.Dispatch<React.SetStateAction<string>>;
  state: string;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  pool: MyPoolInfo;
  poolsMembers: MembersMapEntry[] | undefined;
}

interface Data {
  name: string;
  commission: number;
  nominator: number;
  total: string;
}

interface TableRowProps {
  api: ApiPromise | undefined;
  chain: Chain;
  ledger?: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  staker: AccountsBalanceType;
  stakingConsts: StakingConsts;
  searchedValidators: DeriveStakingQuery[];
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  selected: DeriveStakingQuery[];
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  searching: boolean;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  validators: DeriveStakingQuery[];
  validatorsIdentities: DeriveAccountInfo[] | null;
}

interface ToolbarProps {
  numSelected: number;
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  stakingConsts: StakingConsts;
  validators: DeriveStakingQuery[] | null;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  validatorsIdentities: DeriveAccountInfo[];
}

function descendingComparator<T>(a: DeriveStakingQuery, b: DeriveStakingQuery, orderBy: keyof T) {
  let A, B;

  switch (orderBy) {
    case ('commission'):
      A = a.validatorPrefs.commission;
      B = b.validatorPrefs.commission;
      break;
    case ('nominator'):
      A = a.exposure.others.length;
      B = b.exposure.others.length;
      break;
    default:
      A = a.accountId;
      B = b.accountId;
  }

  if (B < A) {
    return -1;
  }

  if (B > A) {
    return 1;
  }

  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<T>(order: Order, orderBy: keyof T): (a: DeriveStakingQuery, b: DeriveStakingQuery) => number {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

const TableToolbar = (props: ToolbarProps) => {
  const { numSelected, setSearchedValidators, setSearching, setSelected, stakingConsts, validators, validatorsIdentities } = props;
  const { t } = useTranslation();

  const handleValidatorSearch = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const keyWord = event.target.value;

    setSearching(!!keyWord);

    const haveSearchKeywordInAccountId = validators?.filter((item) => String(item.accountId).toLowerCase().includes(keyWord.toLowerCase())) ?? [];
    const haveSearchKeywordInName = validatorsIdentities?.filter((item) => `${item.identity.display}${item.identity.displayParent}`.toLowerCase().includes(keyWord.toLowerCase()));

    haveSearchKeywordInName?.forEach((item) => {
      const f = validators?.find((v) => v.accountId === item.accountId);

      if (f) haveSearchKeywordInAccountId.push(f);
    });

    setSearchedValidators(haveSearchKeywordInAccountId);
  }, [setSearchedValidators, setSearching, validators, validatorsIdentities]);

  return (
    <Grid alignItems='center' container justifyContent='space-between' sx={{ borderRadius: '5px', p: '0px 10px 10px' }}>
      <Grid container item xs={6}>
        <Grid item>
          <Typography color='inherit' component='div' sx={{ fontSize: 13, fontWeight: 'bold' }}>
            {numSelected} / {stakingConsts?.maxNominations}    {t('Selected')}
          </Typography>
        </Grid>
        <Grid item sx={{ pl: 1 }}>
          {!!numSelected &&
            <Hint id='delete' place='right' tip={t('Remove selected')}>
              <DeleteSweepRoundedIcon onClick={() => setSelected([])} sx={{ color: pink[500], cursor: 'pointer', fontSize: 18 }} />
            </Hint>
          }
        </Grid>
      </Grid>
      <Grid item xs={6}>
        <TextField
          InputProps={{ endAdornment: (<InputAdornment position='end'><SearchIcon /></InputAdornment>) }}
          autoComplete='off'
          color='warning'
          fullWidth
          name='search'
          onChange={handleValidatorSearch}
          size='small'
          sx={{ fontSize: 11 }}
          type='text'
          variant='outlined'
        />
      </Grid>
    </Grid>
  );
};

function SelectionTable({ api, chain, ledger, nominatedValidators, searchedValidators, searching, selected, setSearchedValidators, setSearching, setSelected, staker, stakingConsts, validators, validatorsIdentities }: TableRowProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Data>('name');
  const [showValidatorInfoModal, setShowValidatorInfoModal] = useState<boolean>(false);
  const [info, setInfo] = useState<DeriveStakingQuery>();
  const isSelected = useCallback((v: DeriveStakingQuery) => selected.indexOf(v) !== -1, [selected]);
  const isInNominatedValidators = useCallback((v: DeriveStakingQuery) => !!(nominatedValidators?.find((n) => n.accountId === v.accountId)), [nominatedValidators]);
  const [combined, setCombined] = useState<DeriveStakingQuery[]>();

  const v = searching ? searchedValidators : validators;
  const notSelected = useMemo(() => v?.length ? v.filter((i) => !selected.filter((s) => s.accountId === i.accountId).length) : [], [selected, v]);

  useEffect(() => {
    selected.sort(getComparator(order, orderBy));
    notSelected.sort(getComparator(order, orderBy));
    setCombined(selected.concat(notSelected));
  }, [selected, notSelected, order, orderBy]);

  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSwitched = useCallback((event: React.ChangeEvent<HTMLInputElement>, validator: DeriveStakingQuery) => {
    if (selected.length >= stakingConsts.maxNominations && event.target.checked) {
      console.log('Max validators are selected !');

      return;
    }

    const newSelected: DeriveStakingQuery[] = [...selected];

    if (event.target.checked) {
      newSelected.push(validator);
    } else {
      const selectedIndex = selected.indexOf(validator);

      newSelected.splice(selectedIndex, 1);
    }

    setSelected([...newSelected]);
  }, [selected, setSelected, stakingConsts.maxNominations]);

  const handleMoreInfo = useCallback((info: DeriveStakingQuery) => {
    setShowValidatorInfoModal(true);
    setInfo(info);
  }, []);

  const TableHeader = () => (
    <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 15px 5px' }}>
      <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
        <Grid item xs={1}>
          {t('More')}
        </Grid>
        <Grid item sx={{ fontSize: 12 }} xs={5}>
          {t('Identity')}
        </Grid>
        <Grid alignItems='center' container item onClick={(e) => handleRequestSort(e, 'commission')} sx={{ textAlign: 'right', cursor: 'pointer' }} xs={2}>
          <Grid item xs={6}>
            {order === 'asc' && orderBy === 'commission' ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
          </Grid>
          <Grid item xs={6}>
            {t('Commision')}
          </Grid>
        </Grid>
        <Grid alignItems='center' container item onClick={(e) => handleRequestSort(e, 'nominator')} sx={{ cursor: 'pointer', textAlign: 'right' }} xs={2}>
          <Grid item xs={6}>
            {order === 'asc' && orderBy === 'nominator' ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
          </Grid>
          <Grid item sx={{ textAlign: 'center' }} xs={6}>
            {t('Nominators')}
          </Grid>
        </Grid>
        <Grid item sx={{ pl: '50px' }} xs={2}>
          {t('Select')}
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container sx={{ padding: '5px 10px', width: '100%' }}>
      <TableToolbar numSelected={selected.length} setSearchedValidators={setSearchedValidators} setSearching={setSearching} setSelected={setSelected} stakingConsts={stakingConsts} validators={notSelected} validatorsIdentities={validatorsIdentities} />
      <TableHeader />
      <Container disableGutters sx={{ height: 325 }}>
        {!!combined?.length && api &&
          <List
            height={325}
            itemCount={combined.length}
            itemSize={46}
            width={'100%'}
          >
            {({ index, key, style }) => (
              <div>
                <div key={key} style={style}>
                  <ShowValidator
                    api={api}
                    chain={chain}
                    handleMoreInfo={handleMoreInfo}
                    handleSwitched={handleSwitched}
                    isInNominatedValidators={isInNominatedValidators}
                    isSelected={isSelected}
                    showSwitch={true}
                    stakingConsts={stakingConsts}
                    t={t}
                    validator={combined[index]}
                    validatorsIdentities={validatorsIdentities}
                  />
                </div>
              </div>
            )
            }
          </List>
        }
      </Container>
      {showValidatorInfoModal && info && api &&
        <ValidatorInfo
          api={api}
          chain={chain}
          info={info}
          ledger={ledger}
          setShowValidatorInfoModal={setShowValidatorInfoModal}
          showValidatorInfoModal={showValidatorInfoModal}
          staker={staker}
          validatorsIdentities={validatorsIdentities}
        />
      }
    </Container>
  );
}

export default function SelectValidators({ api, chain, nominatedValidators, pool, poolsMembers, setSelectValidatorsModalOpen, setState, showSelectValidatorsModal, stakeAmount, staker, stakingConsts, state, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [validators, setValidators] = useState<DeriveStakingQuery[]>([]);
  const [searchedValidators, setSearchedValidators] = useState<DeriveStakingQuery[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [filterHighCommissionsState, setFilterHighCommissions] = useState(true);
  const [filterOverSubscribedsState, setFilterOverSubscribeds] = useState(true);
  const [filterNoNamesState, setFilterNoNames] = useState(true);
  const [filterWaitingsState, setFilterWaitings] = useState(true);
  const [selected, setSelected] = useState<DeriveStakingQuery[]>([]);
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setValidators(validatorsInfo?.current.concat(validatorsInfo?.waiting));
  }, [validatorsInfo]);

  useEffect(() => {
    let filteredValidators = validatorsInfo.current.concat(validatorsInfo.waiting);

    // at first filtered blocked validatorsInfo
    filteredValidators = filteredValidators?.filter((v) => !v.validatorPrefs.blocked);

    filteredValidators = filterWaitingsState ? filteredValidators?.filter((v) => v.exposure.others.length !== 0) : filteredValidators;
    filteredValidators = filterOverSubscribedsState ? filteredValidators?.filter((v) => v.exposure.others.length < stakingConsts.maxNominatorRewardedPerValidator) : filteredValidators;
    filteredValidators = filterHighCommissionsState ? filteredValidators?.filter((v) => Number(v.validatorPrefs.commission) / (10 ** 7) <= DEFAULT_VALIDATOR_COMMISION_FILTER) : filteredValidators;

    if (filterNoNamesState && validatorsIdentities) {
      filteredValidators = filteredValidators?.filter((v) =>
        validatorsIdentities.find((i) => i.accountId === v.accountId && (i.identity.display || i.identity.displayParent)));
    }

    // remove filtered validators from the selected list
    const selectedTemp = [...selected];

    selected.forEach((s, index) => {
      if (!filteredValidators.find((f) => f.accountId === s.accountId)) {
        selectedTemp.splice(index, 1);
      }
    });
    setSelected([...selectedTemp]);

    setValidators(filteredValidators);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterHighCommissionsState, filterNoNamesState, filterOverSubscribedsState, filterWaitingsState, stakingConsts, validatorsInfo, validatorsIdentities]);

  const filterHighCommisions = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterHighCommissions(event.target.checked);
  }, []);

  const filterWaitings = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterWaitings(event.target.checked);
  }, []);

  const filterNoNames = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterNoNames(event.target.checked);
  }, []);

  const filterOverSubscribeds = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterOverSubscribeds(event.target.checked);
  }, []);

  const handleCancel = useCallback((): void => {
    /** reset all states */
    setSelectValidatorsModalOpen(false);
    setFilterOverSubscribeds(true);
    setFilterHighCommissions(true);
    setFilterWaitings(true);
    setFilterNoNames(true);
    setState('');
    setSearching(false);
    setSearchedValidators([]);
  }, [setSelectValidatorsModalOpen, setState]);

  const handleSelectValidators = useCallback(() => {
    if (selected.length >= 1) { setConfirmStakingModalOpen(true); }
  }, [selected.length]);

  return (
    <Popup handleClose={handleCancel} showModal={showSelectValidatorsModal}>
      <PlusHeader action={handleCancel} chain={chain} closeText={'Cancel'} icon={<RecommendOutlinedIcon fontSize='small' />} title={'Select Validators'} />
      <Grid alignItems='center' container>
        <Grid item sx={{ textAlign: 'left' }} xs={12}>
          {validatorsInfo &&
            <SelectionTable
              api={api}
              chain={chain}
              ledger={pool?.ledger}
              nominatedValidators={nominatedValidators}
              searchedValidators={searchedValidators}
              searching={searching}
              selected={selected}
              setSearchedValidators={setSearchedValidators}
              setSearching={setSearching}
              setSelected={setSelected}
              staker={staker}
              stakingConsts={stakingConsts}
              validators={validators}
              validatorsIdentities={validatorsIdentities}
            />
          }
        </Grid>
        <Grid container id='filteringItems' item justifyContent='space-between' sx={{ p: '5px 28px' }} xs={12}>
          <Grid item sx={{ fontSize: 13, textAlign: 'right' }}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterNoNames}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'green' }}>{t('only have an ID')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'center' }}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterHighCommisions}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'red' }}>{t('no ')}{DEFAULT_VALIDATOR_COMMISION_FILTER}+ {t(' comm.')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'left' }}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterOverSubscribeds}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'red', whiteSpace: 'nowrap' }}>{t('no oversubscribed')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'left' }}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterWaitings}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'red' }}>{t('no waiting')}</Box>}
            />
          </Grid>
        </Grid>
        <Grid item sx={{ p: '7px 28px' }} xs={12}>
          <NextStepButton
            data-button-action='select validators manually'
            isDisabled={!selected.length}
            onClick={handleSelectValidators}
          >
            {!selected.length ? t('Select validators') : t('Next')}
          </NextStepButton>
        </Grid>
      </Grid>
      {!!selected.length && showConfirmStakingModal && api && pool &&
        <ConfirmStaking
          amount={['changeValidators', 'setNominees'].includes(state) ? BN_ZERO : stakeAmount}
          api={api}
          chain={chain}
          nominatedValidators={nominatedValidators}
          pool={pool}
          poolsMembers={poolsMembers}
          selectedValidators={selected}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
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
