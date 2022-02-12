// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { fireEvent, render, RenderResult, screen, waitFor } from '@testing-library/react';
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

const recepientAddress = '5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX';

describe('Testing TransferFund index', () => {
  const invalidAddress = 'bela bela bela';
  const availableBalance = balanceToHuman(sender, 'available');

  let rendered: RenderResult<typeof import('@testing-library/dom/types/queries'), HTMLElement>;
  const transferAmountInHuman = '0.1';
  const invalidAmount = 1000;

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
    fireEvent.change(screen.queryByLabelText('Transfer Amount'), { target: { value: transferAmountInHuman } });
    expect(screen.queryByTestId('nextButton').children.item(0).textContent).toEqual('Next');
    expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(false);

    expect(screen.queryByTestId('allButton').children.item(0).textContent).toEqual('All');
    expect(screen.queryByTestId('safeMaxButton').children.item(0).textContent).toEqual('Safe max');
    fireEvent.click(screen.queryByTestId('nextButton').children.item(0));
    expect(screen.queryAllByText('Confirm Transfer')).toHaveLength(1);
  });
});

describe('Testing transferFund with real account', () => {
  let extension: Extension;
  let state: State;
  let realSender: AccountsBalanceType | null;
  let secondAddress: string;
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

  test('checking All button', async () => {
    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: secondAddress } });
    expect(screen.queryByTestId('allButton').children.item(0).textContent).toEqual('All');
    fireEvent.click(screen.queryByTestId('allButton').children.item(0).children.item(0));

    await waitFor(() => expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(false), { timeout: 10000 });// wait enough to receive fee from blockchain

    fireEvent.click(screen.queryByTestId('nextButton').children.item(0));
    expect(screen.queryAllByText('Confirm Transfer')).toHaveLength(1);
  });

  test('checking Safe max button', async () => {
    fireEvent.change(screen.queryByLabelText('Recipient'), { target: { value: secondAddress } });

    expect(screen.queryByTestId('safeMaxButton').children.item(0).textContent).toEqual('Safe max');
    fireEvent.click(screen.queryByTestId('safeMaxButton').children.item(0).children.item(0));
    await waitFor(() => expect(screen.queryByTestId('nextButton').children.item(0).hasAttribute('disabled')).toBe(false), { timeout: 10000 });

    fireEvent.click(screen.queryByTestId('nextButton').children.item(0));
    expect(screen.queryAllByText('Confirm Transfer')).toHaveLength(1);
  });
});
