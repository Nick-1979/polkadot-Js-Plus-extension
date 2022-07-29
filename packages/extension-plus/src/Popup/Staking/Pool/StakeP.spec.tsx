// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { Chain } from '@polkadot/extension-chains/types';
import { BN } from '@polkadot/util';

import ShowBalance2 from '../../../components/ShowBalance2';
import getChainInfo from '../../../util/getChainInfo';
import { AccountsBalanceType, ChainInfo } from '../../../util/plusTypes';
import { amountToMachine } from '../../../util/plusUtils';
import { pool, poolStakingConst } from '../../../util/test/testHelper';
import Stake from './Stake';

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);
const chain: Chain = {
  name: 'westend'
};
const availableBalance = '5.4321';
let chainInfo: ChainInfo;
const state = '';
let staker: AccountsBalanceType;

const setStakeAmount = () => null;

const setState = () => null;

describe('Testing stake tab', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend') as ChainInfo;
    staker = { address: '5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX' ,balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals } };
  });

  test('Checking the existence of components while loading', () => {
    const { queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={undefined} // undefined == loading
        handleConfirmStakingModalOpen={setState}
        myPool={undefined} // don't care
        nextPoolId={undefined} // don't care
        poolStakingConsts={poolStakingConst} // don't care
        poolsInfo={undefined} // don't care
        poolsMembers={undefined} // don't care
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );

    expect(queryByText('Loading ...')).toBeTruthy();
  });

  test('When account hasn\'t staked', () => {
    const { queryAllByTestId, queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={null} // (null) && !mypool choose to join or create
        handleConfirmStakingModalOpen={setState}
        myPool={null}
        nextPoolId={undefined} // don't care
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined} // don't care
        poolsMembers={undefined} // don't care
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );

    const ShowValue = (value: BN | string) => {
      return render(
        <ShowBalance2
          api={chainInfo.api}
          balance={value}
        />
      ).asFragment().textContent;
    };

    expect(queryByText('Create pool')).toBeTruthy();
    expect(queryByText('Min to join:')).toBeTruthy();
    expect(queryAllByTestId('ShowBalance2')[0].textContent).toEqual(ShowValue(poolStakingConst?.minJoinBond));
    expect(queryByText('Join pool')).toBeTruthy();
    expect(queryByText('Min to create:')).toBeTruthy();
    expect(queryAllByTestId('ShowBalance2')[1].textContent).toEqual(ShowValue(poolStakingConst?.minCreationBond));
  });

  test('Pool state is OPEN or BLOCKED also available balance > 0', () => {
    const currentlyStaked = pool().member?.points;

    const { queryByLabelText, queryByRole, queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={currentlyStaked}
        handleConfirmStakingModalOpen={setState}
        myPool={pool('joinPool')} // pool state open
        nextPoolId={undefined}
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined}
        poolsMembers={undefined}
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );
    const amountInput = queryByRole('spinbutton');

    expect(queryByLabelText('Amount')).toBeTruthy();
    expect(queryByText('Max: ~')).toBeTruthy();
    expect(queryByText('You are staking in "{{poolName}}" pool (index: {{poolId}}).')).toBeTruthy();
    expect(amountInput?.hasAttribute('disabled')).toBeFalsy();
  });

  test('Available balance == 0', () => {
    const currentlyStaked = pool().member?.points;

    staker.balanceInfo.available = 0n;

    const { queryByLabelText, queryByRole, queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={currentlyStaked}
        handleConfirmStakingModalOpen={setState}
        myPool={pool('joinPool')}
        nextPoolId={undefined}
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined}
        poolsMembers={undefined}
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );

    const amountInput = queryByRole('spinbutton');

    expect(queryByLabelText('Amount')).toBeTruthy();
    expect(queryByText('No available fund to stake')).toBeTruthy();
    expect(queryByText('You are staking in "{{poolName}}" pool (index: {{poolId}}).')).toBeTruthy();
    expect(amountInput?.hasAttribute('disabled')).toBeFalsy();
  });

  test('Pool state is DESTROYING', () => {
    const currentlyStaked = pool().member?.points;

    staker.balanceInfo.available = amountToMachine(availableBalance, chainInfo.decimals);

    const { queryByLabelText, queryByRole, queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={currentlyStaked}
        handleConfirmStakingModalOpen={setState}
        myPool={pool()}
        nextPoolId={undefined}
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined}
        poolsMembers={undefined}
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );
    const amountInput = queryByRole('spinbutton');

    expect(queryByLabelText('Amount')).toBeTruthy();
    expect(queryByText('Max: ~')).toBeTruthy();
    expect(queryByText('"{{poolName}}" pool is in {{state}} state, hence can not stake anymore.')).toBeTruthy();
    expect(amountInput?.hasAttribute('disabled')).toBeTruthy();
  });
});
