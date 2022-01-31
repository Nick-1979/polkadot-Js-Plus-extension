// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import '@polkadot/extension-mocks/chrome';

import { Skeleton } from '@mui/material';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount } from 'enzyme';
import React from 'react';

import { AccountsBalanceType, BalanceType } from '../util/plusTypes';
import Balance from './Balance';

configure({ adapter: new Adapter() });

const Chain = {
  name: 'westend'
};

const Props = {
  address: '5FkGthTZn2eNkNX5eN7Rac8KNsE9QvBejwrzaDiBV3UrQgYQ',
  chain: Chain,
  formattedAddress: '5FkGthTZn2eNkNX5eN7Rac8KNsE9QvBejwrzaDiBV3UrQgYQ',
  givenType: undefined,
  name: 'amir khan',
  type: 'total'
};

const totalBalanceToHuman = 4;
const availableBalanceToHuman = 2;

const decimals = 12;
const price = 12.345
const availableBalanceTomachine = BigInt(availableBalanceToHuman * 10 ** decimals);
const totalBalanceTomachine = BigInt(totalBalanceToHuman * 10 ** decimals);

const balanceInfo: BalanceType = {
  available: availableBalanceTomachine,
  coin: 'WND',
  decimals: decimals,
  total: totalBalanceTomachine
};

const balance: AccountsBalanceType | null = {
  address: Props.address,
  balanceInfo: balanceInfo,
  chain: 'westend',
  name: 'westend'
};

describe('Testing Balance component', () => {

  test('rendering Balance component for total balance', () => {
    mount(<Balance balance={balance} type='total' price={price} />);
  });

  test('rendering Balance component for available', () => {
    mount(<Balance balance={balance} type='available' price={price} />);
  });

  test('rendering Balance component while  balance  is null', () => {
    const wrapper = mount(<Balance balance={null} type='total' price={price} />);

    expect(wrapper.find(Skeleton)).toHaveLength(1);
  });

  test('testing account balance for Total balance', () => {
    const label = 'Total';
    const wrapper = mount(<Balance balance={balance} price={price} type={label} />);

    expect(wrapper.find('span').first().text()).toEqual(label + ':  ');
    expect(wrapper.find('span').at(1).text()).toEqual(`${totalBalanceToHuman} `);
    expect(wrapper.find('span').last().text()).toEqual(balanceInfo.coin);
    expect(wrapper.find('div').last().text()).toEqual(`$  ${parseFloat(String(price * totalBalanceToHuman)).toFixed(2)}`);

  });
 
  test('testing account balance for Available balance', () => {
    const label = 'Available';
    const wrapper = mount(<Balance balance={balance} price={price} type={label} />);

    expect(wrapper.find('span').first().text()).toEqual(label + ':  ');
    expect(wrapper.find('span').at(1).text()).toEqual(`${availableBalanceToHuman} `);
    expect(wrapper.find('span').last().text()).toEqual(balanceInfo.coin);
    expect(wrapper.find('div').last().text()).toEqual(`$  ${parseFloat(String(price * availableBalanceToHuman)).toFixed(2)}`);

  });
});
