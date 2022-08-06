// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { fireEvent, Matcher, render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { nameAddress } from '../../util/plusTypes';
import { chain, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import AddNewAccount from './AddNewAccount';

jest.setTimeout(90000);
ReactDOM.createPortal = jest.fn((modal) => modal);
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
const setAccount = jest.fn();

describe('Testing AddNewAccount component', () => {
  test('Checking if everything is working properly', () => {
    const { getByRole, queryByText } = render(
      <AddNewAccount
        account={undefined}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        chain={chain('westend')}
        label={'Amir Ef'}
        setAccount={setAccount}
      />
    );

    expect(getByRole('combobox', { hidden: true, name: 'Amir Ef' })).toBeTruthy();
    fireEvent.change(getByRole('combobox', { hidden: true, name: 'Amir Ef' }), { target: { value: accountWithName[2].address } });
    expect(queryByText(accountWithName[2].name as Matcher));
    expect(getByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    expect(setAccount).toHaveBeenCalled();
  });
});
