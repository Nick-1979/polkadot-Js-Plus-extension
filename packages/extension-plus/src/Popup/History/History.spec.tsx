// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';
import 'intersection-observer';

import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { STAKING_ACTIONS } from '../../util/constants';
import { AccountsBalanceType, BalanceType } from '../../util/plusTypes';
import { amountToMachine } from '../../util/plusUtils';
import History from './index';

const Chain = {
  name: 'westend'
};
const decimals = 12;
const availableBalanceInHuman = 0.2; // WND

const balanceInfo: BalanceType = {
  available: amountToMachine(availableBalanceInHuman.toString(), decimals),
  coin: 'WND',
  decimals: decimals,
  total: amountToMachine(availableBalanceInHuman.toString(), decimals)
};
const sender: AccountsBalanceType | null = {
  address: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
  balanceInfo: balanceInfo,
  chain: 'westend',
  name: 'Amir khan'
};

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

describe('Testing History component', () => {
  const HistoryActions = [...STAKING_ACTIONS, 'send', 'receive'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const amPm = ['AM', 'PM'];
  let action: string;
  let amount: string;
  let toFrom: string;
  let date: string;
  let status: string;

  beforeEach(() => {
    render(
      <History
        address={sender}
        chain={Chain}
        showTxHistoryModal={true}
        name={sender.name}
      />
    );
  });

  test('Checking the exist elements', async () => {
    expect(screen.queryAllByText('All')).toHaveLength(1);
    expect(screen.queryAllByText('Transfers')).toHaveLength(1);
    expect(screen.queryAllByText('Staking')).toHaveLength(1);
    expect(screen.queryAllByText('Nothing to show')).toHaveLength(1);
    expect(screen.queryAllByText('Loading ...')).toHaveLength(1);

    await waitForElementToBeRemoved(() => screen.queryByText('Loading ...'), { timeout: 15000 });
    let children = screen.queryByTestId('scrollArea').childNodes;

    if (!(children.length >= 3)) {
      console.log('There is not any history!');

      return;
    }

    action = screen.queryByTestId('scrollArea').children.item(0).children.item(1).children.item(0).children.item(0).textContent;
    amount = screen.queryByTestId('scrollArea').children.item(0).children.item(1).children.item(0).children.item(1).textContent;
    toFrom = screen.queryByTestId('scrollArea').children.item(0).children.item(1).children.item(1).children.item(0).textContent;
    date = screen.queryByTestId('scrollArea').children.item(0).children.item(1).children.item(1).children.item(1).textContent;
    status = screen.queryByTestId('scrollArea').children.item(0).children.item(1).children.item(1).children.item(2).textContent;

    expect(HistoryActions.includes(action)).toBe(true);
    expect(amount.slice(-3)).toEqual(balanceInfo.coin);
    expect(toFrom.includes('To:') || toFrom.includes('From:')).toBe(true);
    expect(weekDays.includes(date.slice(0, 3))).toBe(true);
    expect(amPm.includes(date.slice(-2))).toBe(true);
    expect(status).toEqual('Success' || 'Failed');

    fireEvent.click(screen.queryByTestId('scrollArea').children.item(0).children.item(2).children.item(0));
    expect(screen.queryAllByText('Transaction Detail')).toHaveLength(1);
  });
});
