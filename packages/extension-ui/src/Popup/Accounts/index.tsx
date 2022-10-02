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
// import AddAccount from './AddAccount';
import AddAccount from '../../../../extension-polkagate/src/popup/welcome/AddAccount';
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

  const _onFilter = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    const filter = event.target.value;

    setFilter(filter.toLowerCase());
  }, []);

  return (
    <>
      {(hierarchy.length === 0)
        ? <AddAccount />
        : (
          <>
            <Grid padding='0px' textAlign='center' xs={12}>
              <PHeader
                onFilter={_onFilter}
                // showAdd
                // showSearch
                showSettings
                text={t<string>('Polkagate')}
              />
            </Grid>
            <Grid textAlign='center' xs={12}>
              <Typography color='primary' sx={{ colorfontWeight: 500, fontSize: '24px', lineHeight: '36px', letterSpacing: '-0.015em' }}>
                {t('Your Accounts')}
              </Typography>
            </Grid>
            <Grid item p='15px 32px 14px' xs={12}>
              <TextField
                InputProps={{ startAdornment: (<InputAdornment position='start'><SearchIcon sx={{fontSize: '15px'}}/></InputAdornment>) }}
                autoComplete='off'
                color='warning'
                fullWidth
                name='search'
                onChange={_onFilter}
                placeholder={t('Search you account')}
                size='small'
                sx={{ fontSize: 11 }}
                type='text'
                variant='outlined'
              />
            </Grid>
            <Divider sx={{bgcolor: 'secondary.main', height: '2px', width: '297px', margin: 'auto' }}/>
            <Container disableGutters 
              sx={{px: '30px', height: '410px', overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none',
                  // display: 'none'
                }, 
                // '&::-webkit-scrollbar-track': {
                //   boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
                //   webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
                // },
                // '&::-webkit-scrollbar-thumb': {
                //   backgroundColor: 'rgba(0,0,0,.1)',
                //   outline: '1px solid slategrey'    }
              }} >
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
