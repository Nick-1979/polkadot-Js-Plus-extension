// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens a page, where you can add a recovery friend
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AddCircleRounded as AddCircleRoundedIcon, NavigateBefore as NavigateBeforeIcon, NavigateNext as NavigateNextIcon, NoAccounts as NoAccountsIcon } from '@mui/icons-material';
import { Autocomplete, Grid, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';
import { Button } from '@polkadot/extension-ui/components';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../components';
import { nameAddress } from '../../util/plusTypes';
import isValidAddress from '../../util/validateAddress';

interface Props extends ThemeProps {
  account: DeriveAccountInfo;
  accountsInfo: DeriveAccountInfo[] | undefined;
  addresesOnThisChain: nameAddress[] | undefined;
  chain: Chain | null;
  className?: string;
  friends: DeriveAccountInfo[];
  showAddFriendModal: boolean;
  setShowAddFriendModal: React.Dispatch<React.SetStateAction<boolean>>;
  setFriends: React.Dispatch<React.SetStateAction<DeriveAccountInfo[]>>;
}

function AddFriend({ account, accountsInfo, addresesOnThisChain, chain, friends, setFriends, setShowAddFriendModal, showAddFriendModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [filteredAccountsInfo, setFilteredAccountsInfo] = useState<DeriveAccountInfo[] | undefined | null>();
  const [text, setText] = useState<string | undefined>();

  const handleAddress = useCallback((value: string | null) => {
    if (!value) {
      setText(undefined);
      setAccountInfo(undefined);

      return;
    }

    const indexOfDots = value?.indexOf(':');
    let mayBeAddress: string | undefined = value?.slice(indexOfDots + 1)?.trim();

    mayBeAddress = mayBeAddress && isValidAddress(mayBeAddress) ? mayBeAddress : undefined;

    if (mayBeAddress) {
      setText(mayBeAddress);
      setAccountInfo(undefined);
    }
  }, []);

  const handleAutoComplateChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    handleAddress(value);
  }, [handleAddress]);

  // const handleChange = useCallback((_event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const value = _event.target.value;

  //   setText(value);
  //   setAccountInfo(undefined);
  // }, []);

  const handleInputChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: string) => {
    setText(value);
    setAccountInfo(undefined);
  }, []);

  const handleSearchFriend = useCallback(() => {
    if (!accountsInfo?.length) { return; }

    if (!text) {
      return setFilteredAccountsInfo(undefined);
    }

    let filtered;

    if (text) {
      filtered = accountsInfo.filter((id) => JSON.stringify(id).toLowerCase().includes(text.toLocaleLowerCase()));

      if (filtered?.length) {
        setFilteredAccountsInfo(filtered);

        return setAccountInfo(filtered[0]);
      }

      setAccountInfo(null);
    }

    setFilteredAccountsInfo(null);
  }, [accountsInfo, text]);

  useEffect(() => {
    handleSearchFriend();
  }, [handleSearchFriend, text]);

  const handleAddFriend = useCallback(() => {
    const mayBeAddress = isValidAddress(text) ? text : undefined;

    const isEnteredMeAsMySelfFriend = String(account.accountId) === mayBeAddress;

    if ((!mayBeAddress && !accountInfo?.accountId) || isEnteredMeAsMySelfFriend) { return; }

    const mayBeNewFriend = mayBeAddress || accountInfo?.accountId?.toString();

    if (!friends.find((i) => i.accountId === mayBeNewFriend)) { // if the account is not already added
      const temp = [...friends];

      accountInfo ? temp.push(accountInfo) : temp.push({ accountId: mayBeNewFriend, identity: undefined });

      console.log('setting friends to ', [...temp]);
      setFriends([...temp]);
      setShowAddFriendModal(false);
    }
  }, [account, accountInfo, friends, setFriends, setShowAddFriendModal, text]);

  const handleCloseModal = useCallback((): void => {
    setShowAddFriendModal(false);
  }, [setShowAddFriendModal]);

  const navigateBefore = useCallback((info: DeriveAccountInfo) => {
    if (!filteredAccountsInfo?.length) { return; }

    const index = filteredAccountsInfo?.findIndex((f) => f.accountId === info.accountId);

    if (index === 0) {
      setAccountInfo(filteredAccountsInfo[filteredAccountsInfo.length - 1]);
    } else {
      setAccountInfo(filteredAccountsInfo[index - 1]);
    }
  }, [filteredAccountsInfo]);

  const navigateNext = useCallback((info: DeriveAccountInfo) => {
    if (!filteredAccountsInfo?.length) { return; }

    const index = filteredAccountsInfo?.findIndex((f) => f.accountId === info.accountId);

    if (index === filteredAccountsInfo.length - 1) {
      setAccountInfo(filteredAccountsInfo[0]);
    } else {
      setAccountInfo(filteredAccountsInfo[index + 1]);
    }
  }, [filteredAccountsInfo]);

  const AccountTextBox = () => (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item xs={1}>
        {isValidAddress(text)
          ? <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={text}
          />
          : <NoAccountsIcon sx={{ color: grey[400], fontSize: 43 }} />
        }
      </Grid>
      <Grid item xs={11}>
        <Autocomplete
          ListboxProps={{ sx: { fontSize: 12 } }}
          autoFocus
          // defaultValue={text}
          freeSolo
          inputValue={text}
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
              label={t('New friend')}
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

  const ShowAccountInfo = ({ info }: { info: DeriveAccountInfo }) => (
    <Grid alignItems='center' container item xs={12}>
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
    <Popup handleClose={handleCloseModal} showModal={showAddFriendModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<AddCircleRoundedIcon fontSize='small' />} title={'Add Friend'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item sx={{ height: '110px' }} xs={12}>
          <Typography sx={{ color: 'text.primary', p: '15px' }} variant='body1'>
            {t('Add a friend account Id (or search by identity)')}:
          </Typography>
          <AccountTextBox />
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '280px', pt: '40px' }} xs={12}>
          {accountInfo
            ? <ShowAccountInfo info={accountInfo} />
            : accountInfo === null
              ? <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                {t('No indetity found')}
              </Grid>
              : !accountsInfo?.length && accountInfo === undefined &&
              <Progress title={t('Loading identities ...')} />
          }
        </Grid>
        <Grid item sx={{ pt: 7 }} xs={12}>
          <Button
            data-button-action=''
            onClick={handleAddFriend}
          >
            {t('Add')}
          </Button>
        </Grid>

      </Grid>
    </Popup>
  );
}

export default styled(AddFriend)`
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
