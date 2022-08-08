// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, fireEvent, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { chain, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import AsFriend from './AsFriend';

jest.setTimeout(240000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
let recoveryConsts: RecoveryConsts;
const showAsFriendModal = () => true;
const notRecoverableAcc = accountWithId[5].accountId;
const lostAcc = accountWithId[0].accountId;
const notRsecuerAcc = accountWithId[3].accountId;
const rescuerAcc = accountWithId[2].accountId;

describe('Testing AsFriend component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };
  });

  test('Checking the existance of the elements', () => {
    const { queryByRole, queryByText } = render(
      <AsFriend
        account={accountWithId[6]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={showAsFriendModal()}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    // Header text
    expect(queryByText('Vouch account')).toBeTruthy();
    // Helper text
    expect(queryByText('Enter the lost account address (or identity) that you want to vouch for:')).toBeTruthy();
    expect(queryByRole('combobox', { hidden: true, name: 'Lost' })).toBeTruthy();

    expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeFalsy();
    expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeFalsy();

    expect(queryByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);
  });

  test('If lost account is Not recoverable', async () => {
    const { queryAllByText, queryByRole, queryByText } = render(
      <AsFriend
        account={accountWithId[6]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={showAsFriendModal()}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: notRecoverableAcc } });
    expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    await waitFor(() => expect(queryAllByText('The account is not recoverable')).toBeTruthy(), {
      timeout: 10000,
      onTimeout: () => {
        throw new Error('Something went wrong in fetching the lost account recovery information!');
      }
    });
    expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeFalsy();
    expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeFalsy();
    expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);
  });

  test('When recovery is not initiated by the rescuer', async () => {
    const { queryByRole, queryByText } = render(
      <AsFriend
        account={accountWithId[6]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={showAsFriendModal()}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: lostAcc } });
    expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    await waitFor(() => expect(queryByText('The account is recoverable')).toBeTruthy(), {
      timeout: 10000,
      onTimeout: () => {
        throw new Error('Something went wrong in fetching the lost account recovery information!');
      }
    });

    await waitFor(() => expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeTruthy(), { timeout: 40000 });
    // expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeTruthy();
    // expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);

    // fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Rescuer' }) as Element, { target: { value: notRsecuerAcc } });
    // expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    // fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    // expect(queryByText('Checking the resuer account')).toBeTruthy();
    // await waitForElementToBeRemoved(() => queryByText('Checking the resuer account'), { timeout: 5000 });
    // expect(queryByText('Account recovery for the lost account has not been initiated by this rescuer')).toBeTruthy();
    // expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);
  });

  // test('Not a friend as friend', async () => {
  //   const { queryByRole, queryByText } = render(
  //     <AsFriend
  //       account={accountWithId[2]}
  //       accountsInfo={accountWithId}
  //       addresesOnThisChain={addresesOnThisChain}
  //       api={chainInfo.api}
  //       chain={chain('westend')}
  //       handleCloseAsFriend={showAsFriendModal()}
  //       recoveryConsts={recoveryConsts}
  //       showAsFriendModal={showAsFriendModal()}
  //     />
  //   );

  //   fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: lostAcc } });
  //   expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
  //   fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

  //   await waitFor(() => expect(queryByText('You are not registered as a friend of the lost account!')).toBeTruthy(), { onTimeout: () => { throw new Error('Unable to fetch the lost account recovery friends!') }, timeout: 10000 });
  //   expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);
  // });

  // test('When everything is ready for VOUCH', async () => {
  //   const { queryByRole, queryByText } = render(
  //     <AsFriend
  //       account={accountWithId[6]}
  //       accountsInfo={accountWithId}
  //       addresesOnThisChain={addresesOnThisChain}
  //       api={chainInfo.api}
  //       chain={chain('westend')}
  //       handleCloseAsFriend={showAsFriendModal()}
  //       recoveryConsts={recoveryConsts}
  //       showAsFriendModal={showAsFriendModal()}
  //     />
  //   );

  //   fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: lostAcc } });
  //   fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);
  //   await waitFor(() => expect(queryByText('The account is recoverable')).toBeTruthy(), { onTimeout: () => { throw new Error('Something went wrong in fetching the lost account recovery information!') }, timeout: 10000 });

  //   fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Rescuer' }) as Element, { target: { value: rescuerAcc } });
  //   fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

  //   expect(queryByText('Checking the resuer account')).toBeTruthy();
  //   await waitForElementToBeRemoved(() => queryByText('Checking the resuer account'), { timeout: 5000 });

  //   expect(queryByText('The rescuer has initiated the recovery, proceed')).toBeTruthy();

  //   expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(false);
  // });

  // test('When Props doesn\'t set yet', async () => {
  //   for (let i = 0; i <= 1; i++) {
  //     const { queryByRole, queryByText } = render(
  //       <AsFriend
  //         account={undefined}
  //         accountsInfo={undefined}
  //         addresesOnThisChain={[]}
  //         api={i <= 1 ? chainInfo.api : undefined}
  //         chain={chain('westend')}
  //         handleCloseAsFriend={showAsFriendModal()}
  //         recoveryConsts={undefined}
  //         showAsFriendModal={showAsFriendModal()}
  //       />
  //     );

  //     fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: (i === 0 || i === 2) ? lostAcc : notRecoverableAcc } });
  //     expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
  //     fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

  //     (i === 1 || i === 3) &&
  //       await waitFor(() => expect(queryByText('The account is not recoverable')).toBeTruthy(), {
  //         timeout: 10000,
  //         onTimeout: () => {
  //           if (i === 1) {
  //             throw new Error('There is something wrong in fetching lost account address recovery information!');
  //           }

  //           if (i === 3) { return; }
  //         }
  //       });

  //     (i === 0 || i === 2) &&
  //       await waitFor(() => expect(queryByText('The account is recoverable')).toBeTruthy(), {
  //         timeout: 10000,
  //         onTimeout: () => {
  //           if (i === 0) {
  //             throw new Error('There is something wrong in fetching lost account address recovery information!');
  //           }

  //           if (i === 2) { return; }
  //         }
  //       });

  //     (i === 0) &&
  //       await waitFor(() => expect(queryByText('You are not registered as a friend of the lost account!')).toBeTruthy(), {
  //         timeout: 10000,
  //         onTimeout: () => {
  //           // when account is undefined this massage shouldn't be apeared, so this test checks for unavailablity of it
  //           return;
  //         }
  //       });

  //     expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeFalsy();
  //     expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeFalsy();

  //     expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);

  //     cleanup();
  //   }
  // });
});
