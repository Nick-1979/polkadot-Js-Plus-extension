// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { Delete as DeleteIcon, FilterList as FilterListIcon, MoreHoriz as MoreHorizIcon, RecommendOutlined as RecommendOutlinedIcon, ReportProblemOutlined } from '@mui/icons-material';
import { Box, Checkbox, Container, FormControlLabel, Grid, IconButton, TextField } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useState } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup } from '../../components';
import { DEFAULT_VALIDATOR_COMMISION_FILTER } from '../../util/constants';
import { AccountsBalanceType, StakingConsts, Validators, ValidatorsName } from '../../util/plusTypes';
import { toShortAddress } from '../../util/plusUtils';
import ConfirmStaking from './ConfirmStaking';
import ValidatorInfo from './ValidatorInfo';

interface Props {
  chain?: Chain | null;
  decimals: number;
  // handleEasyStakingModalClose: () => void;
  staker: AccountsBalanceType;
  showSelectValidatorsModal: boolean;
  nominatedValidators: DeriveStakingQuery[];
  setSelectValidatorsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts;
  stakeAmount: bigint;
  validatorsInfo: Validators;
  validatorsName: ValidatorsName[] | null;
  setState: React.Dispatch<React.SetStateAction<string>>;
  state: string;
  coin: string;
  ledger: StakingLedger | null;
}

interface Data {
  name: string;
  commission: number;
  nominator: number;
  total: string;
}

interface TableRowProps {
  chain: Chain;
  coin: string;
  validators: DeriveStakingQuery[];
  decimals: number;
  nominatedValidators: DeriveStakingQuery[];
  stakingConsts: StakingConsts;
  validatorsName: ValidatorsName[] | null;
  searchedValidators: DeriveStakingQuery[];
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  selected: DeriveStakingQuery[];
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  searching: boolean;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
  sortable:boolean;
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  stakingConsts: StakingConsts;
  validators: DeriveStakingQuery[];
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  validatorsName: ValidatorsName[] | null;
}

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function makeFirstLetterOfStringUpperCase(str: string): string {
  const arr = str.split(' ');

  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1).toLowerCase();
  }

  return arr.join(' ');
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
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const headCells: HeadCell[] = [
  {
    disablePadding: false,
    id: 'name',
    label: 'Address/Name',
    numeric: false,
    sortable: true
  },
  {
    disablePadding: true,
    id: 'commission',
    label: 'Commission',
    numeric: true,
    sortable: true
  },
  {
    disablePadding: true,
    id: 'nominator',
    label: 'Nominator',
    numeric: true,
    sortable: true
  },
  {
    disablePadding: false,
    id: 'moreInfo',
    label: 'More',
    numeric: false,
    sortable: false 
  }
];

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onRequestSort, order, orderBy } = props;

  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <StyledTableCell padding='checkbox'></StyledTableCell>
        {headCells.map((headCell) => (
          <StyledTableCell
            align={headCell.numeric ? 'right' : 'left'}
            key={headCell.id}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            size='small'
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={headCell.sortable && createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </StyledTableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const { numSelected, setSearchedValidators, setSearching, setSelected, stakingConsts, validators, validatorsName } = props;
  // const { t } = useTranslation();

  const handleValidatorSearch = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const keyWord = event.target.value;

    setSearching(!!keyWord);

    const founds = validators.filter((item) => String(item.accountId).toLowerCase().includes(keyWord.toLowerCase()));
    const foundsOnName = validatorsName?.filter((item) => item.name.toLowerCase().includes(keyWord.toLowerCase()));

    foundsOnName?.forEach((item) => {
      const f = validators.find((v) => String(v.accountId) === item.address);

      if (f) founds.push(f);
    });

    setSearchedValidators(founds);
  };

  return (
    <Toolbar
      sx={{
        borderRadius: '5px',
        pl: { sm: 2 },
        pr: { sm: 1, xs: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity)
        })
      }}
    >
      {numSelected > 0
        ? (
          <Typography
            color='inherit'
            component='div'
            sx={{ fontSize: 15, fontWeight: 'bold', flex: '1 1 100%' }}
          >
            {numSelected}/{stakingConsts?.maxNominations} selected
          </Typography>
        )
        : (
          <Typography
            component='div'
            id='tableTitle'
            sx={{ fontSize: 15, fontWeight: 'bold', flex: '1 1 100%' }}
          >
            Select Validators
          </Typography>
        )
      }
      <TextField
        autoComplete='off'
        // InputProps={{ endAdornment: (<InputAdornment position='end'>{coin}</InputAdornment>) }}
        color='warning'
        fullWidth
        // helperText={zeroBalanceAlert ? t('Available balance is zero.') : ''}
        // label={t('Search')}
        name='search'
        onChange={handleValidatorSearch}
        placeholder='Filter with Address/Name'
        type='text'
        variant='outlined'
        size='small'
        sx={{ fontSize: 12 }}
      />
      {numSelected > 0
        ? (
          <Tooltip title='Delete'>
            <IconButton onClick={() => setSelected([])}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )
        : (
          <Tooltip title='Filter list'>
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )
      }
    </Toolbar>
  );
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.common.white,
    height: '10px'
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
    height: '1px',
    padding: '0px 5px'
  }
}));

function EnhancedTable({ chain, coin, decimals, nominatedValidators, searchedValidators, searching, selected, setSearchedValidators, setSearching, setSelected, stakingConsts, validators, validatorsName }: TableRowProps) {
  const rows = searching ? searchedValidators : validators;

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Data>('name');
  const [emptyRows, setEmptyRows] = useState<number>(0);
  const [showValidatorInfoModal, setShowValidatorInfoModal] = useState<boolean>(false);
  const [info, setInfo] = useState<DeriveStakingQuery>();

  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event: React.MouseEvent<unknown>, validator: DeriveStakingQuery) => {
    const selectedIndex = selected.indexOf(validator);

    if (selected.length >= stakingConsts.maxNominations && selectedIndex === -1) {
      console.log('Max validators you can select reached!');

      return;
    }

    let newSelected: DeriveStakingQuery[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, validator);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (v: DeriveStakingQuery) => selected.indexOf(v) !== -1;

  function getAccountIdOrName(val: DeriveStakingQuery) {
    const validator = validatorsName?.find((v) => v.address === String(val.accountId));

    if (validator) {
      return makeFirstLetterOfStringUpperCase(validator.name);
    }

    return toShortAddress(val.accountId);
  }

  useEffect(() => {
    setEmptyRows(8 - rows.length);
  }, [rows]);

  const isInNominatedValidators = (r: DeriveStakingQuery) => nominatedValidators.find((n) => n.accountId === r.accountId);

  const handleMoreInfo = (info: DeriveStakingQuery) => {
    setShowValidatorInfoModal(true);
    setInfo(info);
  };

  return (
    <Container sx={{ overflowY: 'hidden', padding: '5px 10px', width: '100%' }}>
      <EnhancedTableToolbar
        numSelected={selected.length}
        setSearchedValidators={setSearchedValidators}
        setSearching={setSearching}
        setSelected={setSelected}
        stakingConsts={stakingConsts}
        validators={rows}
        validatorsName={validatorsName} />
      <TableContainer sx={{ borderRadius: '5px', maxHeight: 350, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <Table stickyHeader>
          <EnhancedTableHead
            numSelected={selected.length}
            onRequestSort={handleRequestSort}
            // onSelectAllClick={handleSelectAllClick}
            order={order}
            orderBy={orderBy}
            rowCount={rows.length} />
          <TableBody>
            {
              rows.slice().sort(getComparator(order, orderBy))
                .map((row, index) => {
                  const isItemSelected = isSelected(row);
                  const labelId = `table-checkbox-${index}`;
                  const rowBackground = isInNominatedValidators(row) ? 'lightsteelblue' : '';

                  return (
                    <TableRow
                      aria-checked={isItemSelected}
                      hover
                      key={index}
                      // onClick={(event) => handleClick(event, row)}
                      role='checkbox'
                      selected={isItemSelected}
                      style={{ backgroundColor: rowBackground, height: 30 }}
                      tabIndex={-1}
                    >
                      <StyledTableCell padding='checkbox'>
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleClick(event, row)}
                          color='primary'
                          inputProps={{ 'aria-labelledby': labelId }}
                          size='small'
                        />
                      </StyledTableCell>

                      <StyledTableCell component='th' id={labelId} padding='none' scope='row'>
                        <Grid container>
                          <Grid item xs={12}>
                            {getAccountIdOrName(row)}
                          </Grid>
                          <Grid item sx={{ fontSize: 10 }} xs={12}>
                            {row.exposure.total ? `Total staked: ${String(row.exposure.total)}` : ''}
                          </Grid>
                        </Grid>
                      </StyledTableCell>

                      <StyledTableCell align='right'>
                        {Number(row.validatorPrefs.commission) / (10 ** 7)}%
                      </StyledTableCell>

                      <StyledTableCell align='right'>
                        <Grid container alignItems='center'>
                          <Grid item xs={6} sx={{ textAlign: 'center' }}>
                            {row.exposure.others.length
                              ? row.exposure.others.length > stakingConsts.maxNominatorRewardedPerValidator
                                ? <Tooltip title='Oversubscribed'>
                                  <ReportProblemOutlined sx={{ fontSize: '12px' }} color='warning' />
                                </Tooltip>
                                : ''
                              : ''}
                          </Grid>
                          <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            {row.exposure.others.length ? row.exposure.others.length : 'waiting'}
                          </Grid>
                        </Grid>
                      </StyledTableCell>

                      <StyledTableCell align='center'>
                        <IconButton
                          aria-label='more info'
                          component='span'
                          onClick={() => handleMoreInfo(row)}
                        >
                          <MoreHorizIcon />
                        </IconButton>
                      </StyledTableCell>

                    </TableRow>
                  );
                })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 53 * emptyRows// (dense ? 33 : 53) * emptyRows,
                }}
              >
                <StyledTableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showValidatorInfoModal && info &&
        <ValidatorInfo
          chain={chain}
          coin={coin}
          decimals={decimals}
          info={info}
          setShowValidatorInfoModal={setShowValidatorInfoModal}
          showValidatorInfoModal={showValidatorInfoModal}
          validatorsName={validatorsName}
        />
      }
    </Container>
  );
}

export default function SelectValidators({ chain, coin, decimals, ledger, nominatedValidators, setSelectValidatorsModalOpen, setState, showSelectValidatorsModal, stakeAmount, staker, stakingConsts, state, validatorsInfo, validatorsName }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [validators, setValidators] = useState<DeriveStakingQuery[]>([]);
  const [searchedValidators, setSearchedValidators] = useState<DeriveStakingQuery[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [filterHighCommissionsState, setFilterHighCommissions] = useState(true);
  const [filterOverSubscribedsState, setFilterOverSubscribeds] = useState(true);
  const [filterNoNamesState, setFilterNoNames] = useState(false);
  const [selected, setSelected] = useState<DeriveStakingQuery[]>([]);
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setValidators(validatorsInfo?.current.concat(validatorsInfo?.waiting));
  }, [validatorsInfo]);

  useEffect(() => {
    if (!nominatedValidators) return;
    setSelected([...nominatedValidators]);// mark all nominated validators as selected at first
  }, [nominatedValidators]);

  useEffect(() => {
    let filteredValidators = validatorsInfo.current.concat(validatorsInfo.waiting);

    // at first filtered blocked validatorsInfo
    filteredValidators = filteredValidators?.filter((v) => !v.validatorPrefs.blocked);

    if (filterOverSubscribedsState) {
      filteredValidators = filteredValidators?.filter((v) => v.exposure.others.length < stakingConsts.maxNominatorRewardedPerValidator);
    }

    if (filterHighCommissionsState) {
      filteredValidators = filteredValidators?.filter((v) => Number(v.validatorPrefs.commission) / (10 ** 7) <= DEFAULT_VALIDATOR_COMMISION_FILTER);
    }

    if (filterNoNamesState && validatorsName) {
      filteredValidators = filteredValidators?.filter((v) => validatorsName.find((vn) => vn.address === String(v.accountId)));
    }

    // remove filtered validators from the selected list
    const selectedTemp = [...selected];

    selectedTemp.forEach((s, index) => {
      if (!filteredValidators.find((f) => f === s)) {
        selectedTemp.splice(index, 1);
      }
    });

    setSelected(selectedTemp);

    setValidators(filteredValidators);
  }, [filterHighCommissionsState, filterNoNamesState, filterOverSubscribedsState, stakingConsts, validatorsInfo, validatorsName]);

  const filterHighCommisions = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterHighCommissions(event.target.checked);
  }, []);

  const filterNoNames = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterNoNames(event.target.checked);
  }, []);

  const filterOverSubscribeds = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterOverSubscribeds(event.target.checked);
  }, []);

  const handleCancel = useCallback((): void => {
    setSelectValidatorsModalOpen(false);
    setFilterOverSubscribeds(true);
    setFilterHighCommissions(true);
    setFilterNoNames(false);
    setState('');
  }, [setSelectValidatorsModalOpen, setState]);

  function handleSelectValidators() {
    if (selected.length >= 1) { setConfirmStakingModalOpen(true); }
  }

  return (
    <Popup showModal={showSelectValidatorsModal} handleClose={handleCancel}>
      <PlusHeader action={handleCancel} chain={chain} closeText={'Cancel'} icon={<RecommendOutlinedIcon fontSize='small' />} title={'Select Validators'} />

      <Grid alignItems='center' container>
        <Grid item xs={12} sx={{ textAlign: 'left' }}>
          {validatorsInfo &&
            <EnhancedTable
              chain={chain}
              coin={coin}
              decimals={decimals}
              nominatedValidators={nominatedValidators}
              searchedValidators={searchedValidators}
              searching={searching}
              selected={selected}
              setSearchedValidators={setSearchedValidators}
              setSearching={setSearching}
              setSelected={setSelected}
              stakingConsts={stakingConsts}
              validators={validators}
              validatorsName={validatorsName}
            />
          }
        </Grid>
        <Grid item container justifyContent='center' sx={{ padding: '10px 10px' }} xs={12}>
          <Grid item sx={{ fontSize: 13, textAlign: 'right' }} xs={4}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                onChange={filterNoNames}
                size='small'
              />
              }
              label={<Box fontSize={12} sx={{ color: 'green' }}>{t('only have a name')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'center' }} xs={4}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterHighCommisions}
                size='small'
              />
              }
              label={<Box fontSize={12} sx={{ color: 'red' }}>{t('no ')}{DEFAULT_VALIDATOR_COMMISION_FILTER}+ {t(' commissions')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'left' }} xs={4}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterOverSubscribeds}
                size='small'
              />
              }
              label={<Box fontSize={12} sx={{ color: 'red' }}>{t('no oversubscribeds')}</Box>}
            />
          </Grid>
          <Grid item xs={12} sx={{ padding: '10px 20px' }}>
            <NextStepButton
              data-button-action='select validators manually'
              isDisabled={!selected.length}
              onClick={handleSelectValidators}
            >
              {t('Next')}
            </NextStepButton>
          </Grid>
        </Grid>
      </Grid>

      {selected.length >= 1
        ? <ConfirmStaking
          amount={state === 'changeValidators' ? 0n : stakeAmount}
          chain={chain}
          coin={coin}
          decimals={decimals}
          ledger={ledger}
          nominatedValidators={null}
          selectedValidators={selected}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
          setState={setState}
          showConfirmStakingModal={showConfirmStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsInfo={validatorsInfo}
          validatorsName={validatorsName}
          validatorsToList={selected}
        />
        : t('At least one validator should be selected.')}
    </Popup>
  );
}
