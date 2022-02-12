// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { DirectionsRunOutlined as DirectionsRunOutlinedIcon, MoreHoriz as MoreHorizIcon, ReportProblemOutlined as ReportProblemOutlinedIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import React from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import Hint from '../../components/Hint';
import { AccountsBalanceType, StakingConsts, ValidatorsName } from '../../util/plusTypes';
import { toShortAddress } from '../../util/plusUtils';

interface Data {
  name: string;
  // eslint-disable-next-line camelcase
  commission: number;
  // eslint-disable-next-line camelcase
  nominator: number;
  // eslint-disable-next-line camelcase
  total: string;
  // eslint-disable-next-line camelcase
  // reward_point: number;
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

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    disablePadding: false,
    id: 'name',
    label: 'Address/Name',
    numeric: false
  },
  {
    disablePadding: false,
    id: 'commission',
    label: 'Commission',
    numeric: true
  },
  {
    disablePadding: false,
    id: 'nominator',
    label: '#Nominator',
    numeric: true
  },
  {
    disablePadding: false,
    id: 'moreInfo',
    label: 'More',
    numeric: false,
  }
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
  // onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onRequestSort, order, orderBy } = props;

  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <StyledTableCell
            align={headCell.numeric ? 'right' : 'left'}
            key={headCell.id}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {/* <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            > */}
            {headCell.label}
            {/* </TableSortLabel> */}
          </StyledTableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.common.white
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 12
  }
}));

interface TableRowProps {
  activeValidator?: DeriveStakingQuery;
  validators: DeriveStakingQuery[];
  decimals: number;
  stakingConsts: StakingConsts;
  staker?: AccountsBalanceType;
  validatorsName: ValidatorsName[] | null;
  setInfo: React.Dispatch<React.SetStateAction<DeriveStakingQuery>>;
  setShowValidatorInfoModal: React.Dispatch<React.SetStateAction<boolean>>;

}

export default function VTable({ activeValidator, setInfo, setShowValidatorInfoModal, staker, stakingConsts, validators, validatorsName }: TableRowProps) {
  const { t } = useTranslation();
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Data>('name');
  const [selected, setSelected] = React.useState<readonly string[]>([]);


  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
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

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  function getAccountIdOrName(id: string) {
    if (validatorsName) {
      const validator = validatorsName.find((v) => v.address === id);

      if (validator) {
        return validator.name;
      }
    }

    return toShortAddress(id);
  }

  const handleMoreInfo = (info: DeriveStakingQuery) => {
    console.log('setting info and modal to true');
    setShowValidatorInfoModal(true);
    setInfo(info);
  };

  return (
    <TableContainer sx={{ borderRadius: '5px', maxHeight: 180 }}>
      <Table size='small' stickyHeader sx={{ width: '100%' }}>
        <EnhancedTableHead numSelected={selected.length} onRequestSort={handleRequestSort} order={order} orderBy={orderBy} rowCount={validators.length} />
        <TableBody>
          {validators.slice()
            //.sort(getComparator(order, orderBy))
            .map((v, index) => {
              const isItemSelected = isSelected(v.accountId.toString());
              const labelId = `table-checkbox-${index}`;

              return (
                <TableRow aria-checked={isItemSelected} hover key={index} onClick={(event) => handleClick(event, v.accountId.toString())} selected={isItemSelected} tabIndex={-1}>
                  <StyledTableCell component='th' id={labelId} padding='normal' scope='row'>
                    {getAccountIdOrName(String(v.accountId))}
                  </StyledTableCell>

                  <StyledTableCell align='right'>{Number(v.validatorPrefs.commission) / (10 ** 7)}%</StyledTableCell>

                  <StyledTableCell align='right'>
                    <Grid container alignItems='center'>
                      <Grid item xs={6} sx={{ textAlign: 'center' }}>
                        {v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator &&
                          <Hint id='oversubscribed' place='left' tip={('Oversubscribed')}>
                            <ReportProblemOutlinedIcon sx={{ fontSize: '14px' }} color='warning' />
                          </Hint>
                        }

                        {v.accountId === activeValidator?.accountId &&
                          <Hint id='active' place='left' tip={t('Active')}>
                            <DirectionsRunOutlinedIcon sx={{ fontSize: '14px' }} color='info' />
                          </Hint>
                        }
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        {v.exposure.others.length ? v.exposure.others.length : 'waiting'}
                      </Grid>
                    </Grid>
                  </StyledTableCell>

                  <StyledTableCell align='center'>
                    <MoreHorizIcon sx={{ fontSize: '12px', cursor: 'pointer' }} onClick={() => handleMoreInfo(v)} />
                  </StyledTableCell>

                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
