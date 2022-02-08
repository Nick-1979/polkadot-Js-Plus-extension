// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* The following address needs to have some westy to pass the last test */
/* 5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX */
/* may need to uncomment a line at the last describe too */

import '@polkadot/extension-mocks/chrome';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import Extension from '../../../../extension-base/src/background/handlers/Extension';
import State, { AuthUrls } from '../../../../extension-base/src/background/handlers/State';
import { AccountsStore } from '../../../../extension-base/src/stores';
import { AccountsBalanceType, BalanceType } from '../../util/plusTypes';
import { amountToMachine, balanceToHuman } from '../../util/plusUtils';
import TransferFund from './index';

jest.setTimeout(50000);

ReactDOM.createPortal = jest.fn((modal) => modal);

const props = {
  address: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
  chain: {
    name: 'westend'
  },
  formattedAddress: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
  givenType: 'ethereum',
  name: 'Amir khan'
};

const decimals = 12;
const availableBalanceInHuman = 0.15; // WND

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

describe('Testing TransferFund component while mocked', () => {
  const invalidAddress = 'bela bela bela';
  const availableBalance = balanceToHuman(sender, 'available');

  let rendered;
  const transferAmount = 0.1;
  const invalidAmount = 1000;
  const fee = 0.0161;

  beforeEach(() => {
    rendered = render(
      <TransferFund
        chain={props.chain}
        givenType={props.givenType}
        sender={sender}
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

    fireEvent.change(screen.queryByLabelText('Transfer Amount'), { target: { value: invalidAmount } });
    expect(screen.queryByTestId('nextButton').children.item(0).textContent).toEqual('Insufficient Balance');
    expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(true);
  });

  test('Checking component functionality with valid address and valid amount', () => {
    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: recepientAddress } });
    fireEvent.change(screen.queryByLabelText('Transfer Amount'), { target: { value: transferAmount } });
    expect(screen.queryByTestId('nextButton').children.item(0).textContent).toEqual('Next');
    expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(false);

    expect(screen.queryByTestId('allButton').children.item(0).textContent).toEqual('All');
    expect(screen.queryByTestId('safeMaxButton').children.item(0).textContent).toEqual('Safe max');

    fireEvent.click(screen.queryByTestId('nextButton').children.item(0));

    expect(screen.queryAllByText('transfer of')).toHaveLength(1);
    expect(screen.queryAllByText(sender.name)).toHaveLength(1);
    expect(screen.queryAllByText(makeShortAddress(recepientAddress))).toHaveLength(1);

    expect(screen.queryByTestId('infoInMiddle').children.item(0).children.item(1).textContent).toEqual(`${transferAmount}${balanceInfo.coin}`);
    expect(screen.queryByTestId('infoInMiddle').children.item(1).children.item(1).textContent).toEqual(fee + 'estimated');
    expect(screen.queryByTestId('infoInMiddle').children.item(3).children.item(0).textContent).toEqual('Total');
    expect(screen.queryByTestId('infoInMiddle').children.item(3).children.item(2).textContent).toEqual(parseFloat(String(transferAmount + fee)).toFixed(4) + 'WND');

    expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Password'), { target: { value: '123456' } });

    expect(screen.queryAllByText('Confirm')).toHaveLength(1);
    fireEvent.click(screen.queryByText('Confirm'));
    expect(screen.queryAllByText('Password is not correct')).toHaveLength(1);
    // correct password will be checked while accounts are real
  });
});

describe('Testing transferFund with real account (Note: account must have some fund to transfer)', () => {
  let extension: Extension;
  let state: State;
  let realSender: AccountsBalanceType | null;
  let secondAddress;
  const firstSuri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
  const secondSuri = 'inspire erosion chalk grant decade photo ribbon custom quality sure exhaust detail';
  const password = 'passw0rd';
  const type = 'sr25519';
  const westendGenesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';

  async function createExtension(): Promise<Extension> {
    await cryptoWaitReady();

    keyring.loadAll({ store: new AccountsStore() });
    const authUrls: AuthUrls = {};

    authUrls['localhost:3000'] = {
      count: 0,
      id: '11',
      isAllowed: true,
      origin: 'example.com',
      url: 'http://localhost:3000'
    };
    localStorage.setItem('authUrls', JSON.stringify(authUrls));
    state = new State();

    return new Extension(state);
  }

  const createAccount = async (suri: string): Promise<string> => {
    await extension.handle('id', 'pri(accounts.create.suri)', {
      genesisHash: westendGenesisHash,
      name: 'Amir khan',
      password: password,
      suri: suri,
      type: type
    }, {} as chrome.runtime.Port);

    const { address } = await extension.handle('id', 'pri(seed.validate)', { suri: suri, type: type }, {} as chrome.runtime.Port);

    return address;
  };

  beforeAll(async () => {
   //[firstSuri, secondSuri] = [secondSuri, firstSuri]; //uncommenct this when test fails due to insufficient balance
    extension = await createExtension();
    const firstAddress = await createAccount(firstSuri);

    secondAddress = await createAccount(secondSuri);

    realSender = {
      address: firstAddress,
      balanceInfo: balanceInfo,
      chain: 'westend',
      name: 'Amir khan'
    };
  });

  beforeEach(() => {
    render(
      <TransferFund
        chain={props.chain}
        givenType={props.givenType}
        sender={realSender}
        transferModalOpen={true}
      />
    );
  });

  test('transfering balance using All button', async () => {
    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: secondAddress } });
    expect(screen.queryByTestId('allButton').children.item(0).textContent).toEqual('All');
    fireEvent.click(screen.queryByTestId('allButton').children.item(0).children.item(0));
    await waitFor(() => expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(false), { timeout: 10000 });// wait enough to receive fee from blockchain

    fireEvent.click(screen.queryByTestId('nextButton').children.item(0));

    expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Password'), { target: { value: password } });

    expect(screen.queryAllByTestId('confirmButton')).toHaveLength(1);
    expect(screen.queryByTestId('confirmButton').textContent).toEqual('Confirm');
    fireEvent.click(screen.queryByText('Confirm'));

    expect(screen.queryAllByText('Password is not correct')).toHaveLength(0);
    await waitFor(() => expect(screen.queryByTestId('confirmButton').textContent).toEqual('Done'), { timeout: 30000 }); // wait enough to recive the transaction confirm from blockchain
  });

  test('transfering balance using Safe max button', async () => {
    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: secondAddress } });

    expect(screen.queryByTestId('safeMaxButton').children.item(0).textContent).toEqual('Safe max');
    fireEvent.click(screen.queryByTestId('safeMaxButton').children.item(0).children.item(0));
    await waitFor(() => expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(false), { timeout: 10000 });

    fireEvent.click(screen.queryByTestId('nextButton').children.item(0));

    expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Password'), { target: { value: password } });

    expect(screen.queryAllByTestId('confirmButton')).toHaveLength(1);
    expect(screen.queryByTestId('confirmButton').textContent).toEqual('Confirm');
    fireEvent.click(screen.queryByText('Confirm'));

    expect(screen.queryAllByText('Password is not correct')).toHaveLength(0);
    await waitFor(() => expect(screen.queryByTestId('confirmButton').textContent).toEqual('Done'), { timeout: 30000 });
  });
});
