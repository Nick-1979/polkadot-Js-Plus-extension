// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { fireEvent, Matcher, render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import { ShowBalance2 } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { chain, makeShortAddr, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import RecoverableTab from './RecoverableTab';

jest.setTimeout(240000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
let recoveryConsts: RecoveryConsts;
let counter: number;
let recoveryInfo: PalletRecoveryRecoveryConfig;

describe('Testing RecoverableTab component', () => {
  describe('Making an account recoverable', () => {
    beforeAll(async () => {
      chainInfo = await getChainInfo('kusama') as ChainInfo;

      recoveryConsts = {
        configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
        friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
        maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
        recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
      };
    });
    test('Checking if everything is working properly', () => {
      const { getByRole, queryAllByTestId, queryByText } = render(
        <RecoverableTab
          account={accountWithId[0]}
          accountsInfo={accountWithId} // undefined
          addresesOnThisChain={addresesOnThisChain} // empty
          api={chainInfo.api}
          chain={chain('kusama')}
          recoveryConsts={recoveryConsts} // undeifend
          recoveryInfo={null}
        />
      );

      counter = 1;

      const ShowValue = (value: BN, title = '') => {
        return render(
          <ShowBalance2
            api={chainInfo.api}
            balance={value}
            title={title}
          />
        ).asFragment().textContent;
      };

      const addFriend = () => {
        fireEvent.click(getByRole('button', { hidden: true, name: 'addFriend' }) as Element);
        fireEvent.change(getByRole('combobox', { hidden: true, name: 'New friend' }), { target: { value: accountWithName[counter].address } });
        fireEvent.click(getByRole('button', { hidden: true, name: 'Add' }) as Element);
        counter++;
      };

      expect(queryByText('Make recoverable')).toBeTruthy();
      expect(queryByText('Your recovery friends (0)')).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'addFriend' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'addFriend' }).hasAttribute('disabled')).toBe(false);
      expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual(ShowValue(recoveryConsts.configDepositBase, 'Deposit:'));
      expect(queryByText('No friends are added yet!')).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 1 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' }), { target: { value: 1 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
      addFriend();
      expect(queryByText(accountWithName[1].name)).toBeTruthy();
      expect(queryByText(accountWithName[1].address)).toBeTruthy();

      expect(queryByText('Your recovery friends (1)')).toBeTruthy();
      expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual(ShowValue(recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor), 'Deposit:'));
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 2 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

      for (let i = 2; i <= 9; i++) {
        addFriend();
        expect(queryByText(`Your recovery friends (${i})`)).toBeTruthy();

        if (i < 9) {
          expect(getByRole('button', { hidden: true, name: 'addFriend' }).hasAttribute('disabled')).toBe(false);
        } else {
          expect(getByRole('button', { hidden: true, name: 'addFriend' }).hasAttribute('disabled')).toBe(true);
        }

        expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual(ShowValue(recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(i)), 'Deposit:'));

        if (i < 7) {
          expect(queryByText(accountWithName[i].name)).toBeTruthy();
        } else {
          expect(queryByText(makeShortAddr(accountWithName[i].address) as Matcher)).toBeTruthy();
        }

        expect(queryByText(accountWithName[i].address)).toBeTruthy();
      }

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 9 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);
      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 10 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
    });

    test('When some props have not set yet', () => {
      const { getByRole } = render(
        <RecoverableTab
          account={accountWithId[0]}
          accountsInfo={undefined} // Don't care
          addresesOnThisChain={[]} // Don't care
          api={chainInfo.api}
          chain={chain('kusama')}
          recoveryConsts={undefined}
          recoveryInfo={null}
        />
      );

      expect(getByRole('button', { hidden: true, name: 'addFriend' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'addFriend' }).hasAttribute('disabled')).toBe(true);
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 1 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Removing an account recoverability', () => {
    beforeAll(async () => {
      chainInfo = await getChainInfo('westend') as ChainInfo;

      recoveryConsts = {
        configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
        friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
        maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
        recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
      };

      await chainInfo.api.query.recovery.recoverable(accountWithId[0].accountId).then((r) => {
        recoveryInfo = r.unwrap() as unknown as PalletRecoveryRecoveryConfig;
      });
    });

    test('Checking if everything is working properly', () => {
      const { getByRole, queryByRole, queryByTestId, queryByText } = render(
        <RecoverableTab
          account={accountWithId[0]}
          accountsInfo={accountWithId}
          addresesOnThisChain={addresesOnThisChain}
          api={chainInfo.api}
          chain={chain('kusama')}
          recoveryConsts={recoveryConsts}
          recoveryInfo={recoveryInfo}
        />
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

      const recoveryDelayInDays = (recoveryInfo.delayPeriod.toNumber() / (24 * 60 * 10)).toString();

      expect(queryByText('Remove recovery')).toBeTruthy();
      expect(queryByText(`Your recovery friends (${recoveryInfo.friends.length})`)).toBeTruthy();
      expect(queryByRole('button', { hidden: true, name: 'addFriend' })).toBeFalsy();
      expect(queryByTestId('ShowBalance2')?.textContent).toEqual(ShowValue(recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(recoveryInfo.friends.length)), 'Deposit:'));

      for (const friend of recoveryInfo.friends) {
        const hasId = accountWithId.find((account) => account.accountId?.toString() === friend.toString());

        hasId && expect(queryByText(hasId.identity.display as Matcher)).toBeTruthy();
        !hasId && expect(queryByText(makeShortAddr(friend.toString()) as Matcher)).toBeTruthy();
        expect(queryByText(friend.toString())).toBeTruthy();
      }

      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }).getAttribute('value')).toEqual(recoveryInfo.threshold.toString());
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }).hasAttribute('disabled')).toBe(true);
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' }).getAttribute('value')).toEqual(recoveryDelayInDays);
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' }).hasAttribute('disabled')).toBe(true);
      expect(getByRole('button', { hidden: true, name: 'Next to remove recovery' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next to remove recovery' }).hasAttribute('disabled')).toBe(false);
    });

    test('When some props have not set yet', () => {
      const { getByRole, queryByRole, queryByTestId, queryByText } = render(
        <RecoverableTab
          account={accountWithId[0]}
          accountsInfo={accountWithId}
          addresesOnThisChain={addresesOnThisChain}
          api={chainInfo.api}
          chain={chain('kusama')}
          recoveryConsts={undefined}
          recoveryInfo={recoveryInfo}
        />
      );

      const ShowValue = (value: BN | undefined, title = '') => {
        return render(
          <ShowBalance2
            api={chainInfo.api}
            balance={value}
            title={title}
          />
        ).asFragment().textContent;
      };

      const recoveryDelayInDays = (recoveryInfo.delayPeriod.toNumber() / (24 * 60 * 10)).toString();

      expect(queryByText('Remove recovery')).toBeTruthy();
      expect(queryByText(`Your recovery friends (${recoveryInfo.friends.length})`)).toBeTruthy();
      expect(queryByRole('button', { hidden: true, name: 'addFriend' })).toBeFalsy();
      expect(queryByTestId('ShowBalance2')?.textContent).toEqual(ShowValue(undefined, 'Deposit:'));

      for (const friend of recoveryInfo.friends) {
        const hasId = accountWithId.find((account) => account.accountId?.toString() === friend.toString());

        hasId && expect(queryByText(hasId.identity.display as Matcher)).toBeTruthy();
        !hasId && expect(queryByText(makeShortAddr(friend.toString()) as Matcher)).toBeTruthy();
        expect(queryByText(friend.toString())).toBeTruthy();
      }

      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }).getAttribute('value')).toEqual(recoveryInfo.threshold.toString());
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }).hasAttribute('disabled')).toBe(true);
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' }).getAttribute('value')).toEqual(recoveryDelayInDays);
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' }).hasAttribute('disabled')).toBe(true);
      expect(getByRole('button', { hidden: true, name: 'Next to remove recovery' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next to remove recovery' }).hasAttribute('disabled')).toBe(false);
    });
  });
});
