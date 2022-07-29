// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { Matcher, render, screen } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { amountToHuman } from '../../util/plusUtils';
import { makeShortAddr } from '../../util/test/testHelper';
import Details from './Details';

const chain = {
  name: 'westend'
};
const coin = 'WND';
const decimals = 12;

const transaction = {
  action: 'send',
  amount: '12.345',
  block: 9576234,
  date: 1644647202000,
  fee: '15600000000',
  from: '5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX',
  hash: '0x25fd365403110faa14b430f2d1ea8f517223a46a17b6d6baf396358b823704c9',
  status: 'success',
  to: '5CGQdAk5AAqsc88WXV7MfezVBFSzQ2KZ5Rc4sfHEyGVbNJRB'
};

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

describe('Testing Details component', () => {
  render(
    <Details
      chain={chain}
      coin={coin}
      decimals={decimals}
      showDetailModal={true}
      transaction={transaction}
    />
  );

  test('Checking the existence of elements', () => {
    expect(screen.queryByText('Transaction Detail')).toBeTruthy();
    expect(screen.queryByText(transaction.action.toUpperCase())).toBeTruthy();
    expect(screen.queryByText((transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)))).toBeTruthy();
    expect(screen.queryByText(`${new Date(transaction.date).toDateString()} ${new Date(transaction.date).toLocaleTimeString()}`)).toBeTruthy();
    expect(screen.queryByText('Amount')).toBeTruthy();
    expect(screen.queryByText(`${transaction.amount} ${coin}`)).toBeTruthy();
    expect(screen.queryByText('From')).toBeTruthy();
    expect(screen.queryByText(makeShortAddr(transaction.from) as Matcher)).toBeTruthy();
    expect(screen.queryByText('To')).toBeTruthy();
    expect(screen.queryByText(makeShortAddr(transaction.to) as Matcher)).toBeTruthy();
    expect(screen.queryByText('Fees')).toBeTruthy();
    expect(screen.queryByText(`${amountToHuman(transaction.fee, decimals, 6)} ${coin}`)).toBeTruthy();
    expect(screen.queryByText('Block')).toBeTruthy();
    expect(screen.queryByText(`# ${transaction.block}`)).toBeTruthy();
    expect(screen.queryByText('Hash')).toBeTruthy();
    expect(screen.queryByText(makeShortAddr(transaction.hash) as Matcher)).toBeTruthy();
  });
});
