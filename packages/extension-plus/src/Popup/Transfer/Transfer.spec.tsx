// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import '@polkadot/extension-mocks/chrome';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { AccountsBalanceType, BalanceType } from '../../util/plusTypes';
import { balanceToHuman, amountToMachine } from '../../util/plusUtils';
import TransferFund from './index';
import getFee from '../../util/api/getFee';
let fee = 0.0161;

const props = {
  address: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
  chain: {
    name: 'westend'
  },
  formattedAddress: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
  givenType: 'ethereum',
  name: 'amir khan'
};

const decimals = 12;
const availableBalanceInHuman = 10; //WND

const balanceInfo: BalanceType = {
  available: amountToMachine(availableBalanceInHuman.toString(), decimals),
  coin: 'WND',
  decimals: decimals,
  total: amountToMachine(availableBalanceInHuman.toString(), decimals)
};
const sender: AccountsBalanceType | null = {
  address: props.address,
  balanceInfo: balanceInfo,
  chain: 'westend',
  name: 'Amir khan'
};
const recepientAddress = '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA';

const makeShortAddress = (address: string) => {
  return address.slice(0, 4) + '...' + address.slice(-4);
};

describe('Testing TransferFund component', () => {
  const invalidAddress = 'bela bela bela';
  const availableBalance = balanceToHuman(sender, 'available');

  ReactDOM.createPortal = jest.fn((modal) => modal);
  let rendered;
  beforeEach(() => {
    jest.mock('../../util/api/getFee', () => () => '0.015');

    rendered = render(
      <TransferFund
        chain={props.chain}
        sender={sender}
        givenType={props.givenType}
        transferModalOpen={true}
      />
    );
  });

  test('Checking existing elements', () => {
    expect(rendered.container.querySelector('#senderAddress')).not.toBeNull();
    expect(screen.queryAllByText(`${sender.name} (${sender.address})`)).toHaveLength(1);
    expect(screen.queryAllByLabelText('Recipient')).toHaveLength(1);
  });

  test('Checking component functionality with invalid address', () => {
    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: invalidAddress } });
    expect(screen.queryAllByText('Recipient address is invalid')).toHaveLength(1);
  });

  test('Checking component functionality with valid address but invalid amount', () => {
    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: recepientAddress } });
    expect(screen.queryAllByText('Recipient address is invalid')).toHaveLength(0);
    expect(rendered.container.querySelector('#transferBody')).not.toBeNull();
    expect(screen.queryAllByText('Asset:')).toHaveLength(1);
    expect(rendered.container.querySelector('#availableBalance')).not.toBeNull();
    expect(screen.queryAllByText(`Available Balance: ${availableBalance}`)).toHaveLength(1);
    expect(screen.queryAllByText('Amount:')).toHaveLength(1);
    expect(screen.queryAllByLabelText('Transfer Amount')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Transfer Amount'), { target: { value: Number(availableBalance) + 1 } });
    expect(screen.queryByTestId('nextButton').children.item(0).textContent).toEqual('Insufficient Balance');
    expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(true);
  });

  test('Checking component functionality with valid address and valid amount', async () => {

    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: recepientAddress } });
    fireEvent.change(screen.queryByLabelText('Transfer Amount'), { target: { value: Number(availableBalance) - 1 } });
    expect(screen.queryByTestId('nextButton').children.item(0).textContent).toEqual('Next');
    expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(false);

    expect(screen.queryByTestId('allButton').children.item(0).textContent).toEqual('All');
    expect(screen.queryByTestId('safeMaxButton').children.item(0).textContent).toEqual('Safe max');

    fireEvent.click(screen.queryByTestId('nextButton').children.item(0));

    expect(screen.queryAllByText('transfer of')).toHaveLength(1);
    expect(screen.queryAllByText(sender.name)).toHaveLength(1);
    expect(screen.queryAllByText(makeShortAddress(recepientAddress))).toHaveLength(1);

    const transferAmount = Number(availableBalance) - 1;
    expect(screen.queryByTestId('infoInMiddle').children.item(0).children.item(1).textContent).toEqual(`${transferAmount}${balanceInfo.coin}`);
    console.log(`${Number(availableBalance) - 1}${balanceInfo.coin}`)
    expect(screen.queryByTestId('infoInMiddle').children.item(1).children.item(1).textContent).toEqual(fee + 'estimated');
    expect(screen.queryByTestId('infoInMiddle').children.item(3).children.item(0).textContent).toEqual('Total');
    expect(screen.queryByTestId('infoInMiddle').children.item(3).children.item(2).textContent).toEqual(transferAmount + fee + 'WND');

    expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Password'), { target: { value: '123456' } });

    expect(screen.queryAllByText('Confirm')).toHaveLength(1);
    fireEvent.click(screen.queryByText('Confirm'));
    expect(screen.queryAllByText('Password is not correct')).toHaveLength(1);
  });
});

