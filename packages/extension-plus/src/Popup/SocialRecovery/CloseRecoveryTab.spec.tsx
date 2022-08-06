// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { Matcher, render, waitFor } from '@testing-library/react';
import React from 'react';

import { BN } from '@polkadot/util';

import { ShowBalance2 } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import { chain, makeShortAddr, validatorsIdentities as accountWithId } from '../../util/test/testHelper';
import CloseRecovery from './CloseRecoveryTab';

jest.setTimeout(90000);
let chainInfo: ChainInfo;
const rescuerAcc = accountWithId[1].accountId;
const rescuer: Rescuer = {
  accountId: rescuerAcc,
  option: {
    created: new BN('11907021'),
    deposit: new BN('5000000000000'),
    friends: ['5G6TeiXHZJFV3DtPABJ22thuLguSEPJgH7FkqcRPrn88mFKh']
  }
};
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
    const { getByRole, queryByTestId, queryByText } = render(
      <CloseRecovery
        account={accountWithId[0]}
        api={chainInfo.api}
        chain={chain('kusama')}
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
    await waitFor(() => expect(queryByText(makeShortAddr(rescuerAcc as unknown as string) as Matcher)).toBeTruthy(), {
      onTimeout: () => {
        throw new Error('Slow connection detected!\nRun the test again.');
      },
      timeout: 30000
    });
    expect(queryByText(rescuerAcc as unknown as Matcher)).toBeTruthy();
    expect(queryByTestId('ShowBalance2')?.textContent).toEqual(ShowValue(recoveryConsts.recoveryDeposit, 'Deposited:'));
    expect(queryByText('Initiation time')).toBeTruthy();
    expect(queryByText("If it isn't you, close the recovery process, which will automatically transfer it's deposit to your account")).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);
  });

  test('When api prop is undefined', () => {
    const { getByRole, queryByTestId, queryByText } = render(
      <CloseRecovery
        account={accountWithId[0]}
        api={undefined}
        chain={chain('kusama')}
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
    expect(queryByText(makeShortAddr(rescuerAcc as unknown as string) as Matcher)).toBeTruthy();
    expect(queryByText(rescuerAcc as unknown as Matcher)).toBeTruthy();
    expect(queryByTestId('ShowBalance2')?.textContent).toEqual(ShowValue(recoveryConsts.recoveryDeposit, 'Deposited:'));
    expect(queryByText('Initiation time')).toBeTruthy();
    expect(queryByText("If it isn't you, close the recovery process, which will automatically transfer it's deposit to your account")).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
  });
});
