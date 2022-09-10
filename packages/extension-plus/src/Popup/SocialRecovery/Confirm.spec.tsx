// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { cleanup, Matcher, render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN, BN_ZERO } from '@polkadot/util';

import { ShowBalance2 } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, RecoveryConsts } from '../../util/plusTypes';
import { chain, lostAccfriends, lostAccount, rescuer, signerAcc } from '../../util/test/testHelper';
import Confirm from './Confirm';

jest.setTimeout(100000);
ReactDOM.createPortal = jest.fn((modal) => modal);
jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate HoC receive the t function as a prop
  withTranslation: () => Component => {
    Component.defaultProps = { ...Component.defaultProps, t: () => "" };
    return Component;
  },
  useTranslation: () => {
    return {
      t: (str) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
}));

let chainInfo: ChainInfo;
let recoveryConsts: RecoveryConsts;
const showConfirmModal = () => true;
const setConfirmModalOpen = jest.fn();
const setState = jest.fn();
const states = ['makeRecoverable', 'removeRecovery', 'closeRecovery', 'initiateRecovery', 'vouchRecovery', 'withdrawWithClaim', 'withdrawAsRecovered'];
const recoveryDelay = 2; // 2 Days
const recoveryThreshold = 1; // 1 friend

const ShowValue = (value: BN, title = '') => {
  return render(
    <ShowBalance2
      api={chainInfo.api}
      balance={value}
      title={title}
    />
  ).asFragment().textContent;
};

let lostAccountBalance: DeriveBalancesAll;
let lostAccountLedger: StakingLedger | null;
let lostAccountRecoveryInfo: PalletRecoveryRecoveryConfig | null;
let totalWithdrawable: BN;

describe('Testing Confirm component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };

    await chainInfo.api.derive.balances?.all(lostAccount.accountId).then((b) => {
      lostAccountBalance = b;
    });
    await chainInfo.api.query.staking.ledger(lostAccount.accountId).then((l) => {
      lostAccountLedger = l?.isSome ? l.unwrap() as unknown as StakingLedger : null;
    });
    await chainInfo.api.query.recovery.recoverable(lostAccount.accountId).then((r) => {
      lostAccountRecoveryInfo = r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null;
    });
    totalWithdrawable = (lostAccountBalance?.availableBalance ?? BN_ZERO).add(lostAccountRecoveryInfo?.deposit);
  });

  test('Confirm: makeRecoverable - removeRecovery - closeRecovery - initiateRecovery - vouchRecovery', async () => {
    for (let i = 0; i <= 4; i++) {
      const { getByRole, queryAllByTestId, queryByLabelText, queryByText } = render(
        <Confirm
          account={signerAcc}
          api={chainInfo.api} // don't care
          chain={chain('westend')} // don't care
          friends={lostAccfriends}
          lostAccount={i === 3 || i === 4 ? lostAccount : signerAcc}
          otherPossibleRescuers={undefined}
          recoveryConsts={recoveryConsts} // don't care
          recoveryDelay={i === 2 ? undefined : recoveryDelay}
          recoveryThreshold={i === 2 ? undefined : recoveryThreshold}
          rescuer={i === 2 || i === 4 ? rescuer : undefined}
          setConfirmModalOpen={setConfirmModalOpen} // don't care
          setState={setState} // don't care
          showConfirmModal={showConfirmModal()} // don't care
          state={states[i]}
          withdrawAmounts={undefined} // don't care
        />
      );

      const depositForMakeRecoverable = recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(lostAccfriends.length));
      const depositForInitiateRecovery = recoveryConsts.recoveryDeposit;

      // Header text
      (i === 0) && expect(queryByText('Make Recoverable')).toBeTruthy();
      (i === 1) && expect(queryByText('Remove Recovery')).toBeTruthy();
      (i === 2) && expect(queryByText('Close Recovery')).toBeTruthy();
      (i === 3) && expect(queryByText('Initiate Recovery')).toBeTruthy();
      (i === 4) && expect(queryByText('Vouch Recovery')).toBeTruthy();
      // Transaction information
      expect(queryByText('Recoverable account')).toBeTruthy();

      if (i === 3 || i === 4) {
        expect(queryByText(lostAccount.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(lostAccount.accountId))).toBeTruthy();
      } else {
        expect(queryByText(signerAcc.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(signerAcc.accountId))).toBeTruthy();
      }

      expect(queryByText('Fee')).toBeTruthy();
      expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual('Fee');

      if (i === 0 || i === 3 || i === 4) {
        expect(queryByText('Recovery threshold')).toBeTruthy();
        expect(queryByText(`${recoveryThreshold} friends`)).toBeTruthy();
        !(i === 4) && expect(queryByText('Deposit')).toBeTruthy();
        i === 0 && expect(queryAllByTestId('ShowBalance2')[1]?.textContent).toEqual(ShowValue(depositForMakeRecoverable, 'Deposit'));
        i === 3 && expect(queryAllByTestId('ShowBalance2')[1]?.textContent).toEqual(ShowValue(depositForInitiateRecovery, 'Deposit'));
        i === 4 && expect(queryByText('Deposit')).toBeFalsy();
        expect(queryByText('Recovery delay')).toBeTruthy();
        expect(queryByText(`${recoveryDelay} days`)).toBeTruthy();
        i === 0 && expect(queryByText('List of friends')).toBeTruthy();
        i === 0 && lostAccfriends.forEach((friend) => {
          expect(queryByText(friend.identity.display as unknown as Matcher)).toBeTruthy();
          expect(queryByText(friend.accountId?.toString() as unknown as Matcher)).toBeTruthy();
        });
      }

      (i === 1) && expect(queryByText('Removing your account configuration as recoverable. Your {{deposit}} deposit will be unlocked')).toBeTruthy();
      (i === 3) && expect(queryByText('Initiating recovery for the recoverable account, with the following friend(s)')).toBeTruthy();
      (i === 4) && expect(queryByText('Vouching to rescue the recoverable account using the rescuer account')).toBeTruthy();

      if (i === 2) {
        expect(queryByText('Recovery threshold')).toBeFalsy();
        expect(queryByText('Deposit')).toBeFalsy();
        expect(queryByText('Recovery delay')).toBeFalsy();
        expect(queryByText('List of friends')).toBeFalsy();

        expect(queryByText('The recoverable account will receive the recovery deposit {{deposit}} placed by the rescuer account')).toBeTruthy();
        expect(queryByText('Rescuer account')).toBeTruthy();
        expect(queryByText(rescuer.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(rescuer.accountId))).toBeTruthy();
      }

      if (i === 4) {
        expect(queryByText('Rescuer account')).toBeTruthy();
        expect(queryByText(rescuer.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(rescuer.accountId))).toBeTruthy();
      }

      expect(queryByLabelText('Password')).toBeTruthy();
      expect(queryByLabelText('Password')?.hasAttribute('disabled')).toBe(true);
      await waitFor(() => expect(queryAllByTestId('ShowBalance2')[0]?.textContent).not.toEqual('Fee'), { timeout: 10000 });
      expect(queryByLabelText('Password')?.hasAttribute('disabled')).toBe(false);
      expect(getByRole('button', { hidden: true, name: 'Confirm' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Confirm' }).hasAttribute('disabled')).toBe(false);
      cleanup();
    }
  });

  test('Confirm: withdrawWithClaim - withdrawAsRecovered', async () => {
    for (let i = 5; i <= 6; i++) {
      const { debug, getByRole, queryAllByTestId, queryByLabelText, queryByText } = render(
        <Confirm
          account={signerAcc}
          api={chainInfo.api} // don't care
          chain={chain('westend')} // don't care
          friends={lostAccfriends}
          lostAccount={lostAccount}
          otherPossibleRescuers={{ ...signerAcc, option: rescuer.option }}
          recoveryConsts={recoveryConsts} // don't care
          recoveryDelay={recoveryDelay}
          recoveryThreshold={recoveryThreshold}
          rescuer={rescuer}
          setConfirmModalOpen={setConfirmModalOpen} // don't care
          setState={setState} // don't care
          showConfirmModal={showConfirmModal()} // don't care
          state={states[i]}
          withdrawAmounts={{
            available: lostAccountBalance.availableBalance,
            redeemable: BN_ZERO,
            spanCount: 0,
            staked: lostAccountLedger ? lostAccountLedger.active.unwrap() : BN_ZERO,
            totalWithdrawable
          }} // don't care
        />
      );

      // Header text
      expect(queryByText('Withdraw')).toBeTruthy();

      expect(queryByText(lostAccount.identity.display as unknown as Matcher)).toBeTruthy();
      expect(queryByText(String(lostAccount.accountId))).toBeTruthy();

      if (i === 6) {
        expect(queryByText('Recovery threshold')).toBeFalsy();
        expect(queryByText('Recovery delay')).toBeFalsy();
      } else {
        expect(queryByText('Recovery threshold')).toBeTruthy();
        expect(queryByText(`${recoveryThreshold} friends`)).toBeTruthy();
        expect(queryByText('Recovery delay')).toBeTruthy();
        expect(queryByText(`${recoveryDelay} days`)).toBeTruthy();
      }

      expect(queryByText('Fee')).toBeTruthy();
      expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual('Fee');

      expect(queryByText('Deposit')).toBeFalsy();
      expect(queryByText('List of friends')).toBeFalsy();

      expect(queryByText('Withdrawing {{amount}}')).toBeTruthy();

      expect(queryByLabelText('Password')).toBeTruthy();
      expect(queryByLabelText('Password')?.hasAttribute('disabled')).toBe(true);
      await waitFor(() => expect(queryAllByTestId('ShowBalance2')[0]?.textContent).not.toEqual('Fee'), { timeout: 10000 });
      expect(queryByLabelText('Password')?.hasAttribute('disabled')).toBe(false);
      expect(getByRole('button', { hidden: true, name: 'Confirm' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Confirm' }).hasAttribute('disabled')).toBe(false);

      cleanup();
    }
  });
});
