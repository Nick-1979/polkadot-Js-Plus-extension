// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { fireEvent, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import getCurrentBlockNumber from '../../util/api/getCurrentBlockNumber';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { remainingTimeCountDown } from '../../util/plusUtils';
import { chain, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import AsRescuer from './AsRescuer';

jest.setTimeout(90000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
let recoveryConsts: RecoveryConsts;
const showAsRescuerModal = () => true;
const notRecoverableAccount = accountWithName[6].address;
const recoverableAccount = accountWithName[0].address;
const initaitedRescuerAcc = accountWithId[2];

describe('Testing AsRescuer component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };
  });

  test('Checking the existance of the elements', async () => {
    const { getByRole, queryByText } = render(
      <AsRescuer
        account={accountWithId[3]} // undefined
        accountsInfo={accountWithId} // undefined - don't care
        addresesOnThisChain={addresesOnThisChain} // Don't care
        api={chainInfo.api} // Undefined
        chain={chain('westend')}
        handleCloseAsRescuer={showAsRescuerModal} // value
        lastLostAccount={undefined} // undefined
        recoveryConsts={recoveryConsts}
        showAsRescuerModal={showAsRescuerModal()}
      />
    );

    // Header's text
    expect(queryByText('Rescue account')).toBeTruthy();
    // Steps
    expect(queryByText('Initiate')).toBeTruthy();
    expect(queryByText('Wait')).toBeTruthy();
    expect(queryByText('Withdraw')).toBeTruthy();
    // Helper Text
    expect(queryByText('Enter a lost account address (or search by identity):')).toBeTruthy();
    // Elements in the page
    expect(getByRole('combobox', { hidden: true, name: 'Lost' })).toBeTruthy();
    expect(getByRole('combobox', { hidden: true, name: 'Lost' }).hasAttribute('disabled')).toBe(false);
    expect(queryByText('Loading identities ...')).toBeFalsy();
    expect(queryByText('Checking the account')).toBeFalsy();
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
  });

  test('Not recoverable account as lost account', async () => {
    const { getByRole, queryByText } = render(
      <AsRescuer
        account={accountWithId[3]} // undefined
        accountsInfo={accountWithId} // undefined - don't care
        addresesOnThisChain={addresesOnThisChain} // Don't care
        api={chainInfo.api}
        chain={chain('westend')}
        handleCloseAsRescuer={showAsRescuerModal} // value
        lastLostAccount={undefined} // undefined
        recoveryConsts={recoveryConsts}
        showAsRescuerModal={showAsRescuerModal()} // value
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'Lost' }), { target: { value: notRecoverableAccount } });
    expect(queryByText('No indetity found for this account!')).toBeFalsy();
    fireEvent.click(getByRole('button', { hidden: true, name: 'Confirm the account address' }));
    expect(getByRole('progressbar', { hidden: true })).toBeTruthy();
    expect(queryByText('Checking the account')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
    await waitForElementToBeRemoved(() => queryByText('Checking the account'), {
      onTimeout: () => {
        throw new Error('Please check your internet connection and run the test again!');
      },
      timeout: 40000
    });
    expect(queryByText('The account is NOT recoverable')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
  });

  test('Recoverable account as lost account; phase 1: Initiate', async () => {
    const { getByRole, queryByText } = render(
      <AsRescuer
        account={accountWithId[3]} // undefined
        accountsInfo={accountWithId} // undefined - don't care
        addresesOnThisChain={addresesOnThisChain} // Don't care
        api={chainInfo.api} // Undefined
        chain={chain('westend')}
        handleCloseAsRescuer={showAsRescuerModal} // value
        lastLostAccount={undefined} // undefined
        recoveryConsts={recoveryConsts}
        showAsRescuerModal={showAsRescuerModal()} // value
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'Lost' }), { target: { value: recoverableAccount } });
    fireEvent.click(getByRole('button', { hidden: true, name: 'Confirm the account address' }));
    expect(getByRole('progressbar', { hidden: true })).toBeTruthy();
    expect(queryByText('Checking the account')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Checking the account'), {
      onTimeout: () => {
        throw new Error('Please check your internet connection and run the test again!');
      },
      timeout: 40000
    });
    expect(queryByText('Proceed to initiate recovery, {{deposit}} needs to be deposited')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);
  });

  test('Recovering an account; phase 2: Wait', async () => {
    let VouchedFriends: string[];
    let initiateRecoveryBlock = 0;
    let recoveryInfo: PalletRecoveryRecoveryConfig;

    await chainInfo.api.query.recovery.activeRecoveries(recoverableAccount, initaitedRescuerAcc.accountId).then((activeRecovery) => {
      const unwrapedRescuer = activeRecovery.unwrap();

      initiateRecoveryBlock = unwrapedRescuer.created.toNumber() as number;
      VouchedFriends = JSON.parse(JSON.stringify(unwrapedRescuer.friends)) as string[];
    });
    await chainInfo.api.query.recovery.recoverable(recoverableAccount).then((r) => {
      recoveryInfo = r.unwrap() as unknown as PalletRecoveryRecoveryConfig;
    });

    const currentBlockNumber = await getCurrentBlockNumber('westend');
    const delayPeriod = recoveryInfo?.delayPeriod.toNumber();
    const remainingBlocksToClaim = (initiateRecoveryBlock + delayPeriod - currentBlockNumber) * 6;
    const remainingTime = remainingTimeCountDown(remainingBlocksToClaim);
    const remainingTimeForTest = remainingTime.slice(0, remainingTime.indexOf('r'));

    const { getByRole, queryByText } = render(
      <AsRescuer
        account={initaitedRescuerAcc} // undefined
        accountsInfo={accountWithId} // undefined - don't care
        addresesOnThisChain={addresesOnThisChain} // Don't care
        api={chainInfo.api} // Undefined
        chain={chain('westend')}
        handleCloseAsRescuer={showAsRescuerModal} // value
        lastLostAccount={undefined} // undefined
        recoveryConsts={recoveryConsts}
        showAsRescuerModal={showAsRescuerModal()} // value
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'Lost' }), { target: { value: recoverableAccount } });
    fireEvent.click(getByRole('button', { hidden: true, name: 'Confirm the account address' }));
    await waitForElementToBeRemoved(() => queryByText('Checking the account'), {
      onTimeout: () => {
        throw new Error('Please check your internet connection and run the test again!');
      },
      timeout: 40000
    });

    await waitFor(() => expect(queryByText('Wait until the condition(s) will be met')).toBeTruthy(), {
      timeout: 5000,
      onTimeout: () => {
        throw new Error('Please check your internet connection and run the test again!');
      }
    });
    expect(queryByText('Remaining time')).toBeTruthy();
    await waitFor(() => expect(queryByText(remainingTimeForTest, { exact: false })).toBeTruthy(), {
      timeout: 5000,
      onTimeout: () => {
        throw new Error('Something went wrong at showing reaminig time at Step 2: Wait');
      }
    });
    expect(queryByText('Received vouchers')).toBeTruthy();
    expect(queryByText(`${VouchedFriends.length}/${recoveryInfo.threshold.toNumber()}`)).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
  });

  test('Recovering an account; phase 3: Withdraw', async () => {
    const { getByRole, queryByText } = render(
      <AsRescuer
        account={accountWithId[0]} // undefined
        accountsInfo={accountWithId} // undefined - don't care
        addresesOnThisChain={addresesOnThisChain} // Don't care
        api={chainInfo.api} // Undefined
        chain={chain('westend')}
        handleCloseAsRescuer={showAsRescuerModal} // value
        lastLostAccount={undefined} // undefined
        recoveryConsts={recoveryConsts}
        showAsRescuerModal={showAsRescuerModal()} // value
      />
    );

    fireEvent.change(getByRole('combobox', { hidden: true, name: 'Lost' }), { target: { value: recoverableAccount } });
    fireEvent.click(getByRole('button', { hidden: true, name: 'Confirm the account address' }));
    await waitForElementToBeRemoved(() => queryByText('Checking the account'), {
      onTimeout: () => {
        throw new Error('Please check your internet connection and run the test again!');
      },
      timeout: 40000
    });
    await waitFor(() => expect(queryByText('The lost account\'s balance(s) can be withdrawn')).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Something went wrong at showing the Step 3: Withdraw Recovery progress!');
      },
      timeout: 5000
    });
    await waitFor(() => expect(queryByText('Total')).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Something went wrong at showing the Balances of the losted account!');
      },
      timeout: 5000
    });
    expect(queryByText('Available')).toBeTruthy();
    expect(queryByText('Reserved')).toBeTruthy();
    await waitFor(() => expect(queryByText('#Other rescuer(s)')).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Something went wrong at showing other possible rescuers of the losted account!');
      },
      timeout: 5000
    });
    expect(queryByText('Total deposited')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);
  });
});
