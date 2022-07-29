// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, nameAddress, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import { chain, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import Configure from './Configure';

jest.setTimeout(240000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
let recoveryConsts: RecoveryConsts;
const rescuerValue: Rescuer = {
  accountId: accountWithId[1].accountId,
  option: {
    created: new BN('11907021'),
    deposit: new BN('5000000000000'),
    friends: ['5G6TeiXHZJFV3DtPABJ22thuLguSEPJgH7FkqcRPrn88mFKh']
  }
};
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
const setConfigureModalOpen = () => undefined;
const recoveryInfoStates = [undefined, null];
const rescuerStates = [undefined, null, rescuerValue];
const apiStates = [undefined];

describe('Testing the Configure component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend') as ChainInfo;
    apiStates.push(chainInfo.api);
    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };

    await chainInfo.api.query.recovery.recoverable(accountWithId[0].accountId).then((r) => {
      recoveryInfoStates.push(r.unwrap());
    });
  });

  test('Testing RecoveryChecking component', () => {
    for (const api of apiStates) {
      for (const recoveryInfo of recoveryInfoStates) {
        for (const rescuer of rescuerStates) {
          const { getByRole, queryByText } = render(
            <Configure
              account={accountWithId[1]}
              accountsInfo={accountWithId} // don't care
              addresesOnThisChain={addresesOnThisChain} // don't care
              api={api}
              chain={chain('kusama')} // don't care
              recoveryConsts={recoveryConsts} // don't care
              recoveryInfo={recoveryInfo}
              rescuer={rescuer}
              setConfigureModalOpen={setConfigureModalOpen} // don't care
              showConfigureModal={true} // don't care
            />
          );

          // Header Text
          expect(queryByText('Configure my account')).toBeTruthy();
          // Tab's
          expect(getByRole('tab', { hidden: true, name: 'Configuration' })).toBeTruthy();
          expect(getByRole('tab', { hidden: true, name: 'Info' })).toBeTruthy();

          if (recoveryInfo === undefined) {
            expect(queryByText('Checking if the account is recoverable')).toBeTruthy();
          } else if (recoveryInfo === null) {
            api && expect(queryByText('Make recoverable')).toBeTruthy();
          } else {
            if (rescuer === undefined) {
              expect(queryByText('Checking if a malicious rescuer is recovering your account')).toBeTruthy();
            } else if (rescuer === null) {
              api && expect(queryByText('Remove recovery')).toBeTruthy();
            } else {
              expect(queryByText('Close recovery')).toBeTruthy();
            }
          }

          cleanup();
        }
      }
    }
  });
});
