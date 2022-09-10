// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { Matcher, render, waitFor } from '@testing-library/react';
import React from 'react';

import { BN } from '@polkadot/util';

import { ShowBalance2 } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, RecoveryConsts } from '../../util/plusTypes';
import { chain, lostAccount, rescuer } from '../../util/test/testHelper';
import CloseRecovery from './CloseRecoveryTab';

jest.setTimeout(90000);

let chainInfo: ChainInfo;
let recoveryConsts: RecoveryConsts;

describe('Testing CloseRecoveryTab component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };
  });

  test('Checking the existance of elements', async () => {
    const {debug, getByRole, queryByTestId, queryByText } = render(
      <CloseRecovery
        account={lostAccount}
        api={chainInfo.api}
        chain={chain('westend')}
        rescuer={rescuer}
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

    expect(queryByText('Close recovery')).toBeTruthy();
    expect(queryByText('The following account has initiated a recovery process for your account:')).toBeTruthy();
    await waitFor(() => expect(queryByText(rescuer.identity.display as string)).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Slow connection detected! Run the test again.');
      },
      timeout: 30000
    });
    debug(undefined,30000)
    expect(queryByText(rescuer.accountId?.toString() as unknown as Matcher)).toBeTruthy();
    expect(queryByTestId('ShowBalance2')?.textContent).toEqual(ShowValue(recoveryConsts.recoveryDeposit, 'Deposited:'));
    expect(queryByText('Initiation time')).toBeTruthy();
    expect(queryByText("If it isn't you, close the recovery process, which will automatically transfer it's deposit to your account")).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);
  });

  test('When api prop is undefined', () => {
    const { getByRole, queryByTestId, queryByText } = render(
      <CloseRecovery
        account={lostAccount}
        api={undefined}
        chain={chain('westend')}
        rescuer={rescuer}
      />
    );

    const ShowValue = (value: BN, title = '') => {
      return render(
        <ShowBalance2
          api={undefined}
          balance={value}
          title={title}
        />
      ).asFragment().textContent;
    };

    expect(queryByText('Close recovery')).toBeTruthy();
    expect(queryByText('The following account has initiated a recovery process for your account:')).toBeTruthy();
    // expect(queryByText(makeShortAddr(rescuerAcc.accountId?.toString() as unknown as string) as Matcher)).toBeTruthy();
    expect(queryByText(rescuer.identity.display as string)).toBeTruthy();
    expect(queryByText(rescuer.accountId?.toString() as unknown as Matcher)).toBeTruthy();
    expect(queryByTestId('ShowBalance2')?.textContent).toEqual(ShowValue(recoveryConsts.recoveryDeposit, 'Deposited:'));
    expect(queryByText('Initiation time')).toBeTruthy();
    expect(queryByText("If it isn't you, close the recovery process, which will automatically transfer it's deposit to your account")).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
  });
});
