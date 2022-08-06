// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { ApiPromise } from '@polkadot/api';

import ShowBalance2 from '../../../components/ShowBalance2';
import getChainInfo from '../../../util/getChainInfo';
import { toHuman } from '../../../util/plusUtils';
import { nominatorInfoFalse, stakingConsts } from '../../../util/test/testHelper';
import Info from './InfoTab';

let api: ApiPromise;
let decimals: number;
let coin: string;

ReactDOM.createPortal = jest.fn((modal) => modal);
jest.setTimeout(60000);

describe('Testing Info component', () => {
  beforeAll(async () => {
    const chainInfo = await getChainInfo('westend');

    api = chainInfo?.api;
    decimals = chainInfo?.decimals;
    coin = chainInfo?.coin;
  });

  test('Checking the existence of elements', async () => {
    const currentEraIndex = Number(await api.query.staking.currentEra());
    const { queryByTestId, queryByText } = render(
      <Info
        api={api}
        currentEraIndex={currentEraIndex}
        minNominated={nominatorInfoFalse.minNominated}
        stakingConsts={stakingConsts}
      />);
    const ED = render(<ShowBalance2 api={api} balance={stakingConsts.existentialDeposit} />).asFragment().textContent;

    expect(queryByText('Welcome to Staking')).toBeTruthy();
    expect(queryByText('Information you need to know about')).toBeTruthy();
    expect(queryByTestId('info')?.children.item(2)?.children.item(0)?.textContent).toEqual(`Maximum validators you can select: ${stakingConsts.maxNominations} `);
    expect(queryByTestId('info')?.children.item(2)?.children.item(1)?.textContent).toEqual(`Minimum {{symbol}}s to be a staker (threshold): ${toHuman(api, stakingConsts.minNominatorBond)}`);
    expect(queryByTestId('info')?.children.item(2)?.children.item(2)?.textContent).toEqual(`Minimum {{symbol}}s to recieve rewards today (era: {{eraIndex}}):${toHuman(api, nominatorInfoFalse.minNominated)}`);
    expect(queryByTestId('info')?.children.item(2)?.children.item(3)?.textContent).toEqual(`Maximum nominators of a validator, who may receive rewards: ${stakingConsts.maxNominatorRewardedPerValidator} `);
    expect(queryByTestId('info')?.children.item(2)?.children.item(4)?.textContent).toEqual(`Days it takes to receive your funds back after unstaking:  ${stakingConsts.unbondingDuration} days`);
    expect(queryByTestId('info')?.children.item(2)?.children.item(5)?.textContent).toEqual(`Minimum {{symbol}}s that must remain in your account (ED): ${ED}`);
  });
});
