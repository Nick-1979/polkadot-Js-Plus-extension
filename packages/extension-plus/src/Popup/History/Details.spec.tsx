// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { render, screen } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { SHORT_ADDRESS_CHARACTERS } from '../../util/constants';
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

function makeShortAddr (address: string) {
  return `${address.slice(0, SHORT_ADDRESS_CHARACTERS)}...${address.slice(-1 * SHORT_ADDRESS_CHARACTERS)}`;
}

describe('Testing Details component', () => {
  render(
    <Details
      chain={chain}
      coin={coin}
      decimals={decimals}
      showDetailModal={true}
      transaction={transaction}
    />);

  test('Checking the exist elements', async () => {
    expect(screen.queryAllByText('Transaction Detail')).toHaveLength(1);

    const detailAction = screen.queryByTestId('details').children.item(0).children.item(0).children.item(0).children.item(0).textContent;
    const detailStatus = screen.queryByTestId('details').children.item(0).children.item(0).children.item(0).children.item(1).textContent;
    const detailDate = screen.queryByTestId('details').children.item(0).children.item(0).children.item(0).children.item(3).textContent;
    const detailAmount = screen.queryByTestId('details').children.item(2).children.item(0).children.item(0).children.item(1).textContent;
    const detailFrom = screen.queryByTestId('details').children.item(2).children.item(0).children.item(0).children.item(3).children.item(0).textContent;
    const detailTo = screen.queryByTestId('details').children.item(2).children.item(0).children.item(0).children.item(5).children.item(0).textContent;

    expect(detailAction).toEqual(transaction.action.toUpperCase());
    expect(detailStatus).toEqual((transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)));
    expect(detailDate).toEqual(`${new Date(transaction.date).toDateString()} ${new Date(transaction.date).toLocaleTimeString()}`);
    expect(detailAmount).toEqual(`${transaction.amount}  ${coin}`);
    expect(detailFrom).toEqual(makeShortAddr(transaction.from));
    expect(detailTo).toEqual(makeShortAddr(transaction.to));
    expect(screen.queryAllByText('Subscan')).toHaveLength(1);
  });
});
