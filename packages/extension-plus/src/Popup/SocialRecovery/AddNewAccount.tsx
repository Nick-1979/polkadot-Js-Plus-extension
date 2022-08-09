// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens a textbox to enter an accountId or search the account by an identity and
 * returns the accountInfo of the entered accountId/identity
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { NavigateBefore as NavigateBeforeIcon, NavigateNext as NavigateNextIcon, NoAccounts as NoAccountsIcon } from '@mui/icons-material';
import { Autocomplete, Button as MuiButton, Grid, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import { nameAddress } from '../../util/plusTypes';
import isValidAddress from '../../util/validateAddress';

interface Props extends ThemeProps {
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  addresesOnThisChain: nameAddress[];
  className?: string;
  chain: Chain | null;
  helperText?: string;
  helperColor?: string;
  label: string;
  setAccount: React.Dispatch<React.SetStateAction<DeriveAccountInfo | undefined>>;
}

function AddNewAccount({ account, accountsInfo, addresesOnThisChain, chain, helperColor, helperText, label, setAccount }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [info, setInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [text, setText] = useState<string | undefined>();
  const [filteredAccountsInfo, setFilteredAccountsInfo] = useState<DeriveAccountInfo[] | undefined | null>();

  // const handleChange = useCallback((_event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const value = _event.target.value;

  //   setText(value);
  //   setAccount(undefined);
  //   setInfo(undefined);
  // }, [setAccount]);

  const handleInputChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: string) => {
    setText(value);
    setAccount(undefined);
    setInfo(undefined);
  }, [setAccount]);

  const handleConfirmLostAccount = useCallback(() => {
    const mayBeAccount = info ?? (text && isValidAddress(text) ? { accountId: text, identity: undefined } as unknown as DeriveAccountInfo : undefined);

    mayBeAccount && setAccount(mayBeAccount);
  }, [info, setAccount, text]);

  const handleSearchIdentity = useCallback(() => {
    if (!accountsInfo?.length) {
      return;
    }

    if (!text) {
      return setFilteredAccountsInfo(undefined);
    }

    if (text) {
      const filtered = accountsInfo.filter((id) => JSON.stringify(id).toLowerCase().includes(text.toLocaleLowerCase()));

      if (filtered?.length) {
        setFilteredAccountsInfo(filtered);
        setInfo(filtered[0]);

        return;
      }

      setInfo(null);
    }

    setFilteredAccountsInfo(null);
  }, [accountsInfo, text]);

  useEffect(() => {
    if (account && !account?.identity) {
      const accountLocalInfo = addresesOnThisChain?.find((i) => i.address === String(account.accountId));

      setAccount((account) => {
        account.nickname = accountLocalInfo?.name;

        return account;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.accountId, addresesOnThisChain, setAccount]);

  useEffect(() => {
    handleSearchIdentity();
  }, [handleSearchIdentity, text]);

  const navigateBefore = useCallback((info: DeriveAccountInfo) => {
    if (!filteredAccountsInfo?.length) { return; }

    const index = filteredAccountsInfo.findIndex((f) => f.accountId === info.accountId);

    if (index === 0) {
      setInfo(filteredAccountsInfo[filteredAccountsInfo.length - 1]);
    } else {
      setInfo(filteredAccountsInfo[index - 1]);
    }
  }, [filteredAccountsInfo]);

  const navigateNext = useCallback((info: DeriveAccountInfo) => {
    if (!filteredAccountsInfo?.length) { return; }

    const index = filteredAccountsInfo?.findIndex((f) => f.accountId === info.accountId);

    if (index === filteredAccountsInfo.length - 1) {
      setInfo(filteredAccountsInfo[0]);
    } else {
      setInfo(filteredAccountsInfo[index + 1]);
    }
  }, [filteredAccountsInfo]);

  const handleAddress = useCallback((value: string | null) => {
    setInfo(undefined);
    setAccount(undefined);

    if (!value) {
      setText(undefined);

      return;
    }

    const indexOfDots = value?.indexOf(':');
    let mayBeAddress: string | undefined = value?.slice(indexOfDots + 1)?.trim();

    mayBeAddress = mayBeAddress && isValidAddress(mayBeAddress) ? mayBeAddress : undefined;

    if (mayBeAddress) {
      setText(mayBeAddress);
    }
  }, [setAccount]);

  const handleAutoComplateChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    handleAddress(value);
  }, [handleAddress]);

  const AccountTextBox = ({ info, text }: { info: DeriveAccountInfo | undefined, text: string | undefined }) => (
    <Grid alignItems='flex-start' container item xs={12}>
      <Grid item xs={1}>
        {(info || isValidAddress(text))
          ? <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={info?.accountId ?? text}
          />
          : <NoAccountsIcon sx={{ color: grey[400], fontSize: 43 }} />
        }
      </Grid>
      <Grid item xs>
        <Autocomplete
          ListboxProps={{ sx: { fontSize: 12 } }}
          autoFocus
          inputValue={info?.accountId || text}
          // disabled={!accountsInfo?.length}
          freeSolo
          onChange={handleAutoComplateChange}
          onInputChange={handleInputChange}
          options={addresesOnThisChain?.map((option) => `${option?.name} :    ${option.address}`)}
          // eslint-disable-next-line react/jsx-no-bind
          renderInput={(params) =>
            <TextField
              {...params}
              InputLabelProps={{ shrink: true, style: { fontSize: 17 } }}
              autoFocus
              error={!text}
              helperText={info &&
                <Grid item sx={{ color: { helperColor } }}>
                  {helperText}
                </Grid>
              }
              label={label}
              // onChange={handleChange}
              placeholder={'account Id / name / twitter / element Id / email / web site'}
            />
          }
          sx={{ '& .MuiAutocomplete-input, & .MuiInputLabel-root': { fontSize: 13 } }}
        />
      </Grid>
    </Grid>
  );

  const ShowItem = ({ title, value }: { title: string, value: string | undefined }) => (
    <Grid container item spacing={1} xs={12}>
      <Grid item sx={{ fontWeight: 'bold' }}>
        {title}:
      </Grid>
      <Grid item>
        {value}
      </Grid>
    </Grid>
  );

  const ShowAccountInfo = ({ info, text }: { info: DeriveAccountInfo, text: string | undefined }) => (
    <Grid alignItems='center' container item justifyContent='center' xs={12}>
      <Grid item xs={1}>
        {filteredAccountsInfo && filteredAccountsInfo.length > 1 &&
          <NavigateBeforeIcon onClick={() => navigateBefore(info)} sx={{ cursor: 'pointer', fontSize: 26 }} />
        }
      </Grid>
      <Grid item xs>
        <ShowItem title={t<string>('Display')} value={info.identity.display} />
        <ShowItem title={t<string>('Legal')} value={info.identity.legal} />
        <ShowItem title={t<string>('Email')} value={info.identity.email} />
        <ShowItem title={t<string>('Element')} value={info.identity.riot} />
        <ShowItem title={t<string>('Twitter')} value={info.identity.twitter} />
        <ShowItem title={t<string>('Web')} value={info.identity.web} />
        {!isValidAddress(text) && <ShowItem title={t<string>('Account Id')} value={String(info.accountId)} />}
      </Grid>
      {filteredAccountsInfo && filteredAccountsInfo.length > 1 &&
        <Grid item xs={0.5}>
          <NavigateNextIcon fontSize='large' onClick={() => navigateNext(info)} sx={{ cursor: 'pointer', fontSize: 26 }} />
        </Grid>
      }
    </Grid>
  );

  return (
    <Grid container>
      <AccountTextBox info={account} text={text} />
      {!account &&
        <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '180px', pt: '5px' }} xs={12}>
          {info
            ? <ShowAccountInfo info={info} text={text} />
            : info === null
              ? <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                {t<string>('No indetity found for this account!')}
              </Grid>
              : !accountsInfo?.length && info === undefined &&
              <Progress title={t<string>('Loading identities ...')} />
          }
          {(info || isValidAddress(text)) &&
            <Grid container item justifyContent='center' pt='10px' xs={12}>
              <MuiButton
                color='primary'
                onClick={handleConfirmLostAccount}
                sx={{ textTransform: 'none' }}
                variant='contained'
              >
                {t<string>('Confirm the account address')}
              </MuiButton>
            </Grid>
          }
        </Grid>
      }
    </Grid>
  );
}

export default styled(AddNewAccount)`
          height: calc(100vh - 2px);
          overflow: auto;
          scrollbar - width: none;
  
          &:: -webkit - scrollbar {
            display: none;
          width:0,
         }
          .empty-list {
            text - align: center;
    }`;
