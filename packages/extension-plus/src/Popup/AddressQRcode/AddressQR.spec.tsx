// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import '@polkadot/extension-mocks/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, shallow } from 'enzyme';
import QRCode from 'qrcode.react';
import React from 'react';

import Identicon from '@polkadot/react-identicon';

import AddressQRcode from './AddressQRcode';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

const Chain = {
  name: 'westend'
};

const Props = {
  address: '5FkGthTZn2eNkNX5eN7Rac8KNsE9QvBejwrzaDiBV3UrQgYQ',
  chain: Chain,
  formattedAddress: '5FkGthTZn2eNkNX5eN7Rac8KNsE9QvBejwrzaDiBV3UrQgYQ',
  name: 'amir khan'
};

describe('Testing AddressQRcode component', () => {

  test('rendering AddressQRcode', () => {
    const wrapper = shallow(<AddressQRcode address={Props.address} chain={Chain} name={Props.name} showQRcodeModalOpen={true} setQRcodeModalOpen={() => { }} />).dive();

    expect(wrapper.find(QRCode)).toHaveLength(1);
    expect(wrapper.find(QRCode).prop('value')).toBe(Props.address);

    expect(wrapper.find('#name').text()).toEqual(Props.name);

    expect(wrapper.find(Identicon)).toHaveLength(1);
    expect(wrapper.find('#address').text()).toEqual(Props.address);
  });
});
