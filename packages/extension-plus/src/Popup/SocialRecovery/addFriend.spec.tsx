// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveAccountInfo } from '@polkadot/api-derive/types';

import { nameAddress } from '../../util/plusTypes';
import { chain, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import AddFriend from './AddFriend';

jest.setTimeout(90000);
ReactDOM.createPortal = jest.fn((modal) => modal);
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
let friends: DeriveAccountInfo[] = [];
const showAddFriendModal = () => true;
const setShowAddFriendModal = jest.fn();
const setFriends = jest.fn();

describe('Testing addFriend component', () => {
  test('Checking the existance of elements', () => {
    const { getByRole, queryByText } = render(
      <AddFriend
        account={accountWithId[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        chain={chain('westend')}
        friends={friends} // []
        setFriends={setFriends}
        setShowAddFriendModal={setShowAddFriendModal}
        showAddFriendModal={showAddFriendModal()}
      />
    );

    expect(queryByText('Add Friend')).toBeTruthy();
    expect(queryByText('Add a friend account Id (or search by identity):')).toBeTruthy();
    expect(getByRole('combobox', { hidden: true, name: 'New friend' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Add' })).toBeTruthy();
  });

  test('Add a friend has not already added, with and without identity', () => {
    const withId = accountWithName[2];
    const withoutId = accountWithName[8];
    const accs = [withId, withoutId];

    friends = [];

    for (const account of accs) {
      const { getByRole, queryByText } = render(
        <AddFriend
          account={accountWithId[0]}
          accountsInfo={accountWithId}
          addresesOnThisChain={addresesOnThisChain}
          chain={chain('westend')}
          friends={friends} // []
          setFriends={setFriends}
          setShowAddFriendModal={setShowAddFriendModal}
          showAddFriendModal={showAddFriendModal()}
        />
      );

      fireEvent.change(getByRole('combobox', { hidden: true, name: 'New friend' }), { target: { value: account.address } });
      fireEvent.click(getByRole('button', { hidden: true, name: 'Add' }));
      account.address === withId.address && expect(queryByText(account.name)).toBeTruthy();
      account.address === withoutId.address && expect(queryByText('No indetity found')).toBeTruthy();
      expect(setFriends).toHaveBeenCalled();
      expect(setShowAddFriendModal).toHaveBeenCalledWith(false);
      cleanup();
    }
  });

  test('Adding same account address as a friend', () => {
    setFriends.mockReset();
    setShowAddFriendModal.mockReset();
    const { getByRole } = render(
      <AddFriend
        account={accountWithId[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        chain={chain('westend')}
        friends={friends}
        setFriends={setFriends}
        setShowAddFriendModal={setShowAddFriendModal}
        showAddFriendModal={showAddFriendModal()}
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'New friend' }), { target: { value: accountWithName[0].address } });
    fireEvent.click(getByRole('button', { hidden: true, name: 'Add' }));
    expect(setFriends).not.toHaveBeenCalled();
    expect(setShowAddFriendModal).not.toHaveBeenCalled();
  });

  test('Adding already added account address as a friend', () => {
    setFriends.mockReset();
    setShowAddFriendModal.mockReset();
    friends = [];

    if (!friends.length) {
      friends.push(accountWithId[2] as unknown as DeriveAccountInfo);
      friends.push(accountWithId[8] as unknown as DeriveAccountInfo);
    }

    const { getByRole } = render(
      <AddFriend
        account={accountWithId[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        chain={chain('westend')}
        friends={friends} // []
        setFriends={setFriends}
        setShowAddFriendModal={setShowAddFriendModal}
        showAddFriendModal={showAddFriendModal()}
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'New friend' }), { target: { value: accountWithName[2].address } });
    fireEvent.click(getByRole('button', { hidden: true, name: 'Add' }));
    expect(setFriends).not.toHaveBeenCalled();
    expect(setShowAddFriendModal).not.toHaveBeenCalled();
  });

  test('Adding account address by identity', () => {
    setFriends.mockReset();
    setShowAddFriendModal.mockReset();
    friends = [];
    const { getByRole, queryByText } = render(
      <AddFriend
        account={accountWithId[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        chain={chain('westend')}
        friends={friends} // []
        setFriends={setFriends}
        setShowAddFriendModal={setShowAddFriendModal}
        showAddFriendModal={showAddFriendModal()}
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'New friend' }), { target: { value: accountWithName[3].name } });
    expect(queryByText(accountWithName[3].address)).toBeTruthy();
    fireEvent.click(getByRole('button', { hidden: true, name: 'Add' }));
    expect(setFriends).toHaveBeenCalled();
    expect(setShowAddFriendModal).toHaveBeenCalledWith(false);
  });

  test('Adding account address by wrong address', () => {
    setFriends.mockReset();
    setShowAddFriendModal.mockReset();
    friends = [];
    const { getByRole } = render(
      <AddFriend
        account={accountWithId[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        chain={chain('westend')}
        friends={friends} // []
        setFriends={setFriends}
        setShowAddFriendModal={setShowAddFriendModal}
        showAddFriendModal={showAddFriendModal()}
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'New friend' }), { target: { value: '5113213165416498s4d4sa6d4as6d4as84da4s' } });
    fireEvent.click(getByRole('button', { hidden: true, name: 'Add' }));
    expect(setFriends).not.toHaveBeenCalled();
    expect(setShowAddFriendModal).not.toHaveBeenCalled();
  });
});
