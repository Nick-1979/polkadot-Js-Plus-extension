// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import getNetworkMap from '@polkadot/extension-ui/util/getNetworkMap';

import { AccountsStore } from '@polkadot/extension-base/stores'; // added for plus
import keyring from '@polkadot/ui-keyring'; // added for plus
import { cryptoWaitReady } from '@polkadot/util-crypto'; // added for plus

import { AccountContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { PHeader } from '../../partials';
import AccountsTree from './AccountsTree';
import AddAccount from './AddAccount';
import { Box, Container, Divider, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import { Search as SearchIcon  } from '@mui/icons-material';

interface Props extends ThemeProps {
  className?: string;
}

export default function Accounts({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [filteredAccount, setFilteredAccount] = useState<AccountWithChildren[]>([]);
  const { hierarchy } = useContext(AccountContext);
  const networkMap = useMemo(() => getNetworkMap(), []);

  // added for plus
  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setFilteredAccount(
      filter
        ? hierarchy.filter((account) =>
          account.name?.toLowerCase().includes(filter) ||
          (account.genesisHash && networkMap.get(account.genesisHash)?.toLowerCase().includes(filter))
        )
        : hierarchy
    );
  }, [filter, hierarchy, networkMap]);

  const _onFilter = useCallback((filter: string) => {
    setFilter(filter.toLowerCase());
  }, []);

  return (
    <>
      {(hierarchy.length === 0)
        ? <AddAccount />
        : (
          <>
            <Grid xs={12} textAlign='center' padding='0px'>
              <PHeader
                onFilter={_onFilter}
                // showAdd
                // showSearch
                showSettings
                text={t<string>('Polkagate')}
              />
            </Grid>
            <Grid xs={12} textAlign='center'>
              <Typography color='primary' sx={{ colorfontWeight: 500, fontSize: '24px', lineHeight: '36px', letterSpacing: '-0.015em' }}> {t('Your Accounts')}</Typography>
            </Grid>
            <Grid item xs={12} p='15px 32px 14px'>
              <TextField
                InputProps={{ startAdornment: (<InputAdornment position='start'><SearchIcon sx={{fontSize: '15px'}}/></InputAdornment>) }}
                autoComplete='off'
                color='warning'
                fullWidth
                name='search'
                // onChange={handleAccountSearch}
                placeholder={t('Search you account')}
                size='small'
                sx={{ fontSize: 11 }}
                type='text'
                variant='outlined'
              />
            </Grid>
            <Container disableGutters sx={{px: '30px'}} >
              <Divider sx={{bgcolor: 'secondary.main', height: '2px' }}/>
              {filteredAccount.map((json, index): React.ReactNode => (
                <AccountsTree
                  {...json}
                  key={`${index}:${json.address}`}
                />
              ))}
            </Container>
          </>
        )
      }
    </>
  );
}

// export default styled(Accounts)(({ theme }: ThemeProps) => `
//   height: calc(100vh - 2px);
//   overflow-y: scroll;
//   // margin-top: -25px;
//   // padding-top: 25px;
//   scrollbar-width: none;
  
//   .title {
//     font-family: ${theme.fontFamily};
//     color: ${theme.textColor};
//     font-style: normal;
//     font-weight: 500;
//     font-size: 24px;
//     line-height: 36px;
//     text-align: center;
//     letter-spacing: -0.015em;
//   }
  
//   &::-webkit-scrollbar {
//     display: none;
//   }
// `);
