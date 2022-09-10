// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, fireEvent, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, RecoveryConsts } from '../../util/plusTypes';
import { addresesOnThisChain, chain, lostAccfriends, lostAccount, notRecoverableAcc, notRescuerAcc, rescuerAcc, validatorsIdentities as accountWithId } from '../../util/test/testHelper';
import AsFriend from './AsFriend';

jest.setTimeout(120000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
let recoveryConsts: RecoveryConsts;
const showAsFriendModal = () => true;
const handleCloseAsFriend = jest.fn();

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
        account={lostAccfriends[0]}
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
        account={lostAccfriends[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={handleCloseAsFriend}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: String(notRecoverableAcc.accountId) } });
    expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    await waitFor(() => expect(queryAllByText('The account is not recoverable')).toHaveLength(2), {
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
        account={lostAccfriends[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={handleCloseAsFriend}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: lostAccount.accountId?.toString() } });
    expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);
    expect(queryByText('Checking the lost account')).toBeTruthy();
    await waitForElementToBeRemoved(queryByText('Checking the lost account'), { timeout: 10000 });
    await waitFor(() => expect(queryByText('The account is recoverable')).toBeTruthy(), { timeout: 10000 });

    await waitFor(() => expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeTruthy(), { timeout: 15000 });
    expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeTruthy();
    expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Rescuer' }) as Element, { target: { value: notRescuerAcc.accountId?.toString() } });
    expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    expect(queryByText('Checking the resuer account')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Checking the resuer account'), { timeout: 5000 });
    expect(queryByText('Account recovery for the lost account has not been initiated by this rescuer')).toBeTruthy();
    expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);
  });

  test('Not a friend as friend', async () => {
    const { queryByRole, queryByText } = render(
      <AsFriend
        account={accountWithId[1]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={handleCloseAsFriend}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: lostAccount.accountId?.toString() } });
    expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    await waitFor(() => expect(queryByText('You are not registered as a friend of the lost account!')).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Unable to fetch the lost account recovery friends!');
      },
      timeout: 10000
    });
    expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);
  });

  test('When everything is ready for VOUCH', async () => {
    const { queryByRole, queryByText } = render(
      <AsFriend
        account={lostAccfriends[1]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={handleCloseAsFriend}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: lostAccount.accountId?.toString() } });
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);
    await waitFor(() => expect(queryByText('The account is recoverable')).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Something went wrong in fetching the lost account recovery information!');
      },
      timeout: 10000
    });

    await waitFor(() => expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeTruthy(), { timeout: 15000 });
    expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeTruthy();
    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Rescuer' }) as Element, { target: { value: rescuerAcc.accountId?.toString() } });
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    expect(queryByText('Checking the resuer account')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Checking the resuer account'), { timeout: 5000 });

    expect(queryByText('The rescuer has initiated the recovery, proceed')).toBeTruthy();

    expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(false);
  });

  test('Already vouched friend', async () => {
    const { queryByRole, queryByText } = render(
      <AsFriend
        account={lostAccfriends[0]}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsFriend={handleCloseAsFriend}
        recoveryConsts={recoveryConsts}
        showAsFriendModal={showAsFriendModal()}
      />
    );

    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: lostAccount.accountId?.toString() } });
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);
    await waitFor(() => expect(queryByText('The account is recoverable')).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Something went wrong in fetching the lost account recovery information!');
      },
      timeout: 10000
    });

    await waitFor(() => expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeTruthy(), { timeout: 15000 });
    expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeTruthy();
    fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Rescuer' }) as Element, { target: { value: rescuerAcc.accountId?.toString() } });
    fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

    expect(queryByText('Checking the resuer account')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Checking the resuer account'), { timeout: 5000 });

    expect(queryByText('You have already vouched for these accounts!')).toBeTruthy();

    expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(false);
  });

  test('When Props doesn\'t set yet', async () => {
    for (let i = 0; i <= 2; i++) {
      const { debug, queryByRole, queryByText, queryAllByText } = render(
        <AsFriend
          account={undefined}
          accountsInfo={undefined}
          addresesOnThisChain={[]}
          api={i === 2 ? undefined : chainInfo.api}
          chain={chain('westend')}
          handleCloseAsFriend={handleCloseAsFriend}
          recoveryConsts={undefined}
          showAsFriendModal={showAsFriendModal()}
        />
      );

      fireEvent.change(queryByRole('combobox', { hidden: true, name: 'Lost' }) as Element, { target: { value: (i === 0) ? lostAccount.accountId?.toString() : notRecoverableAcc.accountId?.toString() } });
      expect(queryByRole('button', { hidden: true, name: 'Confirm the account address' })).toBeTruthy();
      fireEvent.click(queryByRole('button', { hidden: true, name: 'Confirm the account address' }) as Element);

      if (i === 1) {
        await waitFor(() => expect(queryAllByText('The account is not recoverable')).toHaveLength(2), {
          timeout: 25000,
          onTimeout: () => {
            debug(undefined, 30000)
            throw new Error('There is something wrong in fetching lost account address recovery information!');
          }
        });
      }

      if (i === 0) {
        await waitFor(() => expect(queryByText('The account is recoverable')).toBeTruthy(), {
          timeout: 25000,
          onTimeout: () => {
            throw new Error('There is something wrong in fetching lost account address recovery information!');
          }
        });
      }

      if (i === 0) {
        await waitFor(() => expect(queryByText('You are not registered as a friend of the lost account!')).toBeTruthy(), {
          timeout: 25000,
          onTimeout: () => {
            // when account is undefined this massage shouldn't be apeared, so this test checks for unavailablity of it

          }
        });
      }

      expect(queryByText('Enter the rescuer account address (or search by identity):')).toBeFalsy();
      expect(queryByRole('combobox', { hidden: true, name: 'Rescuer' })).toBeFalsy();

      expect(queryByRole('button', { hidden: true, name: 'Next' })?.hasAttribute('disabled')).toBe(true);

      cleanup();
    }
  });
});
