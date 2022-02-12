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
import { AccountsBalanceType, BalanceType, ChainInfo } from '../../util/plusTypes';
import { amountToMachine, balanceToHuman, amountToHuman, fixFloatingPoint, toShortAddress } from '../../util/plusUtils';
import getChainInfo from '../../util/getChainInfo';
import ConfirmTransfer from './ConfirmTransfer';

jest.setTimeout(50000);

ReactDOM.createPortal = jest.fn((modal) => modal);

const props = {
    address: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
    chain: {
        name: 'westend',
        icon: 'westend'
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


let extension: Extension;
let state: State;
let sender: AccountsBalanceType;
let recepient: AccountsBalanceType;
let firstAddress: string;
let secondAddress: string;
let fee: bigint;
let availableBalance: string;
const transferAmountInHuman = '0.1';
const transferAmount = amountToMachine(transferAmountInHuman, decimals);
let firstSuri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
let secondSuri = 'inspire erosion chalk grant decade photo ribbon custom quality sure exhaust detail';
const password = 'passw0rd';
const type = 'sr25519';
const westendGenesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';
let chainInfo: ChainInfo;
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

[firstSuri, secondSuri] = [secondSuri, firstSuri]; /** comment or uncomment this when test fails due to insufficient balance */


describe('ConfirmTransfer for Successful Scenario (Note: account must have some fund to transfer)', () => {
    beforeAll(async () => {
        [firstSuri, secondSuri] = [secondSuri, firstSuri]; /** comment or uncomment this when test fails due to insufficient balance */
        extension = await createExtension();
        chainInfo = await getChainInfo(props.chain.name)
        firstAddress = await createAccount(firstSuri);
        secondAddress = await createAccount(secondSuri);

        sender = {
            address: firstAddress,
            balanceInfo: balanceInfo,
            chain: 'westend',
            name: 'Amir khan'
        };

        recepient = {
            address: secondAddress,
            chain: 'westend',
            name: ''
        };

        availableBalance = balanceToHuman(sender, 'available');
        const { api } = await getChainInfo(sender.chain)
        const transfer = api.tx.balances.transfer;

        const { partialFee } = await transfer(sender.address, transferAmount).paymentInfo(sender.address);
        fee = partialFee.toBigInt();
    });

    beforeEach(async () => {
        render(
            <ConfirmTransfer
                availableBalance={availableBalance}
                chainInfo={chainInfo}
                recepient={recepient}
                sender={sender}
                transferAmount={transferAmount}
                chain={props.chain}
                lastFee={fee}
                confirmModalOpen={true}
            />
        );
    });

    test('Successfull Scenario', async () => {
        expect(screen.queryAllByText('Confirm Transfer')).toHaveLength(1)
        expect(screen.queryAllByText(sender.name)).toHaveLength(1);
        expect(screen.queryAllByText(toShortAddress(recepient.address))).toHaveLength(1);
        const refreshFeeButton = screen.queryByTestId('infoInMiddle').children.item(1).children.item(0).children.item(2).children.item(0).children.item(0);

        const amountToTransfer = screen.queryByTestId('infoInMiddle').children.item(0).children.item(1).textContent;

        expect(amountToTransfer).toEqual(`${transferAmountInHuman}${balanceInfo.coin}`);
        expect(screen.queryByTestId('infoInMiddle').children.item(1).children.item(1).textContent).toEqual(`${amountToHuman(fee, decimals)}estimated`);
        expect(screen.queryByTestId('infoInMiddle').children.item(3).children.item(0).textContent).toEqual('Total');

        const total = transferAmount + fee;
        const totalInHuman = amountToHuman(total.toString(), decimals);
        const parsedTotal = fixFloatingPoint(totalInHuman);

        expect(screen.queryByTestId('infoInMiddle').children.item(3).children.item(2).textContent).toEqual(parsedTotal + 'WND');

        expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
        fireEvent.change(screen.queryByLabelText('Password'), { target: { value: password } });

        expect(screen.queryAllByText('Confirm')).toHaveLength(1);
        fireEvent.click(screen.queryByText('Confirm'));

        expect(screen.queryAllByText('Password is not correct')).toHaveLength(0);
        await waitFor(() => expect(screen.queryByTestId('confirmButton').textContent).toEqual('Done'), { timeout: 30000 }); // wait enough to recive the transaction confirm from blockchain
    });

    test('ConfirmTransfer when password is wrong', async () => {
        const refreshFeeButton = screen.queryByTestId('infoInMiddle').children.item(1).children.item(0).children.item(2).children.item(0).children.item(0);

        const invalidPassword = '123456';
        expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
        fireEvent.change(screen.queryByLabelText('Password'), { target: { value: invalidPassword } });

        expect(screen.queryAllByText('Confirm')).toHaveLength(1);
        fireEvent.click(screen.queryByText('Confirm'));

        expect(screen.queryAllByText('Password is not correct')).toHaveLength(1);
    });
});

describe('ConfirmTransfer for Failed Scenario', () => {
    const invaliTransferAmount = amountToMachine('1000', decimals);
    beforeAll(async () => {
        [firstSuri, secondSuri] = [secondSuri, firstSuri]; /** comment or uncomment this when test fails due to insufficient balance */
        chainInfo = await getChainInfo(props.chain.name)
        sender = {
            address: firstAddress,
            balanceInfo: balanceInfo,
            chain: 'westend',
            name: 'Amir khan'
        };

        recepient = {
            address: secondAddress,
            chain: 'westend',
            name: 'recipientName'
        };

        availableBalance = balanceToHuman(sender, 'available');
        const { api } = await getChainInfo(sender.chain)
        const transfer = api.tx.balances.transfer;

        const { partialFee } = await transfer(sender.address, transferAmount).paymentInfo(sender.address);
        fee = partialFee.toBigInt();
    });

    test('Failed Scenario', async () => {
        render(
            <ConfirmTransfer
                availableBalance={availableBalance}
                chainInfo={chainInfo}
                recepient={recepient}
                sender={sender}
                transferAmount={invaliTransferAmount}
                chain={props.chain}
                lastFee={fee}
                confirmModalOpen={true}
            />
        );

        const refreshFeeButton = screen.queryByTestId('infoInMiddle').children.item(1).children.item(0).children.item(2).children.item(0).children.item(0);

        const invalidPasswod = '123456';
        expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
        fireEvent.change(screen.queryByLabelText('Password'), { target: { value: password } });

        expect(screen.queryAllByText('Confirm')).toHaveLength(1);
        fireEvent.click(screen.queryByText('Confirm'));

        await waitFor(() => expect(screen.queryByTestId('confirmButton').textContent).toEqual('Failed'), { timeout: 30000 }); // wait enough to recive the transaction confirm from blockchain

    });
});
