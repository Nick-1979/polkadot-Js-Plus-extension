// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';
import 'jsdom-worker-fix';

import { fireEvent, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter, Route } from 'react-router';

import { AccountContext, SettingsContext } from '@polkadot/extension-ui/components';
import { buildHierarchy } from '@polkadot/extension-ui/util/buildHierarchy';
import { BN } from '@polkadot/util';

import { ShowBalance2 } from '../../../src/components';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, RecoveryConsts } from '../../util/plusTypes';
import { accounts, chain, SettingsStruct } from '../../util/test/testHelper';
import SocialRecoveryIndex from './index';

jest.setTimeout(240000);
ReactDOM.createPortal = jest.fn((modal) => modal);

const validAddress = '5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX';
const kusamaGenesisHash = chain('kusama').definition.genesisHash;
let recoveryConsts: RecoveryConsts;
let chainInfo: ChainInfo;

describe('Testing Social Recovery component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('kusama') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };
  });

  test('Checking if everything is working properly in CONFIGURE component', async () => {
    const { getByRole, queryAllByTestId, queryByText } = render(
      <SettingsContext.Provider value={SettingsStruct}>
        <AccountContext.Provider
          value={{
            accounts,
            hierarchy: buildHierarchy(accounts)
          }}
        >
          <MemoryRouter initialEntries={[`/socialRecovery/${kusamaGenesisHash}/${validAddress}`]}>
            <Route path='/socialRecovery/:genesisHash/:address'>
              <SocialRecoveryIndex />
            </Route>
          </MemoryRouter>
        </AccountContext.Provider>
      </SettingsContext.Provider>
    );

    const ShowValue = (value: BN, title = '') => {
      return render(
        <ShowBalance2
          api={chainInfo.api}
          balance={value}
          title={title}
        />
      ).asFragment().textContent;
    };

    await waitFor(() => expect(queryByText(`Social Recovery on ${chain('kusama').definition.chain}`)).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });

    expect(queryByText('CONFIGURE MY ACCOUNT')).toBeTruthy();
    expect(queryByText('You can make your account "recoverable", remove recovery from an already recoverable account, or close a recovery process that is initiated by a (malicious) rescuer account.')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Configure' })).toBeTruthy();

    expect(queryByText('RESCUE ANOTHER ACCOUNT')).toBeTruthy();
    expect(queryByText('You can try to rescue another account. As a "rescuer", you can recover a lost account, or as a "friend", you can "vouch" to confirm the recovery of a lost account by a rescuer account.')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Rescue' })).toBeTruthy();

    // Configure my account component's elements
    fireEvent.click(getByRole('button', { hidden: true, name: 'Configure' }) as Element);
    // Header Text
    expect(queryByText('Configure my account')).toBeTruthy();
    // Tab's
    expect(getByRole('tab', { hidden: true, name: 'Configuration' })).toBeTruthy();
    expect(getByRole('tab', { hidden: true, name: 'Info' })).toBeTruthy();

    // Configuration tab's elements while loading informations
    expect(getByRole('progressbar', { hidden: true })).toBeTruthy();
    expect(queryByText('Checking if the account is recoverable')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Checking if the account is recoverable'), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });

    // Configuration tab's elemnts while loading finished and account is not recoverable
    expect(queryByText('Make recoverable')).toBeTruthy();
    expect(queryByText('Your recovery friends (0)')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'addFriend' })).toBeTruthy();
    expect(queryAllByTestId('ShowBalance2')[0].textContent).toEqual(ShowValue(recoveryConsts.configDepositBase, 'Deposit:'));
    expect(queryByText('No friends are added yet!')).toBeTruthy();
    expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
    expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

    // Info tab's elemnts
    fireEvent.click(getByRole('tab', { hidden: true, name: 'Info' }));
    expect(queryByText('Welcome to social recovery')).toBeTruthy();
    expect(queryByText('Information you need to know')).toBeTruthy();
    expect(queryByText('The base {{token}}s needed to reserve to make an account recoverable:')).toBeTruthy();
    await waitFor(() => expect(queryAllByTestId('ShowBalance2')[0].textContent).toEqual(ShowValue(recoveryConsts.configDepositBase)), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });
    expect(queryByText('{{token}}s needed to be reserved per added friend:')).toBeTruthy();
    expect(queryAllByTestId('ShowBalance2')[1].textContent).toEqual(ShowValue(recoveryConsts.friendDepositFactor));
    expect(queryByText('The maximum amount of friends allowed in a recovery configuration:')).toBeTruthy();
    expect(queryByText(recoveryConsts.maxFriends)).toBeTruthy();
    expect(queryByText('The base amount of {{token}}s needed to reserve for initiating a recovery:')).toBeTruthy();
    expect(queryAllByTestId('ShowBalance2')[2].textContent).toEqual(ShowValue(recoveryConsts.recoveryDeposit));
  });

  test('Checking if everything is working properly in RESCUE (as Rescuer) component', async () => {
    const { getByRole, queryByText } = render(
      <SettingsContext.Provider value={SettingsStruct}>
        <AccountContext.Provider
          value={{
            accounts,
            hierarchy: buildHierarchy(accounts)
          }}
        >
          <MemoryRouter initialEntries={[`/socialRecovery/${kusamaGenesisHash}/${validAddress}`]}>
            <Route path='/socialRecovery/:genesisHash/:address'>
              <SocialRecoveryIndex />
            </Route>
          </MemoryRouter>
        </AccountContext.Provider>
      </SettingsContext.Provider>
    );

    await waitFor(() => expect(queryByText(`Social Recovery on ${chain('kusama').definition.chain}`)).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });
    // Rescue another account component's element
    fireEvent.click(getByRole('button', { hidden: true, name: 'Rescue' }) as Element);
    // Header Text
    expect(queryByText('Rescue another account')).toBeTruthy();
    // Choises
    expect(queryByText('as Rescuer')).toBeTruthy();
    expect(queryByText("You can initiate the recovery. If recovery conditions are met, the lost account's balances can be withdrawn.")).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Rescue' })).toBeTruthy();

    expect(queryByText('as Friend')).toBeTruthy();
    expect(queryByText('An account, who has been set as a friend of a lost account, can vouch for recovering the lost account by a rescuer.')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Vouch' })).toBeTruthy();
    expect(getByRole('progressbar', { hidden: true })).toBeTruthy(); // progressbar in the Rescue button, 

    await waitForElementToBeRemoved(() => getByRole('progressbar', { hidden: true }), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });

    // AsResuer component's elements
    fireEvent.click(getByRole('button', { hidden: true, name: 'Rescue' }) as Element);
    // Header Text
    expect(queryByText('Rescue account')).toBeTruthy();
    // Rescueing steps texts
    expect(queryByText('Initiate')).toBeTruthy();
    expect(queryByText('Wait')).toBeTruthy();
    expect(queryByText('Withdraw')).toBeTruthy();
    // While loading identities
    expect(queryByText('Enter a lost account address (or search by identity):')).toBeTruthy();
    expect(getByRole('combobox', { hidden: true, name: 'Lost' })).toBeTruthy();
    expect(getByRole('progressbar', { hidden: true })).toBeTruthy();
    expect(queryByText('Loading identities ...')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Loading identities ...'), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
  });

  test('Checking if everything is working properly in RESCUE (as Friend) component', async () => {
    const { getByRole, queryByText } = render(
      <SettingsContext.Provider value={SettingsStruct}>
        <AccountContext.Provider
          value={{
            accounts,
            hierarchy: buildHierarchy(accounts)
          }}
        >
          <MemoryRouter initialEntries={[`/socialRecovery/${kusamaGenesisHash}/${validAddress}`]}>
            <Route path='/socialRecovery/:genesisHash/:address'>
              <SocialRecoveryIndex />
            </Route>
          </MemoryRouter>
        </AccountContext.Provider>
      </SettingsContext.Provider>
    );

    await waitFor(() => expect(queryByText(`Social Recovery on ${chain('kusama').definition.chain}`)).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });
    fireEvent.click(getByRole('button', { hidden: true, name: 'Rescue' }) as Element);

    // asFriend component's elements
    fireEvent.click(getByRole('button', { hidden: true, name: 'Vouch' }) as Element);
    // Header Text
    expect(queryByText('Vouch account')).toBeTruthy();
    // While loading identities
    expect(queryByText('Enter the lost account Id (identity), you want to vouch for:')).toBeTruthy();
    expect(getByRole('combobox', { hidden: true, name: 'Lost' })).toBeTruthy();
    expect(getByRole('progressbar', { hidden: true })).toBeTruthy();
    expect(queryByText('Loading identities ...')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Loading identities ...'), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
  });
});
