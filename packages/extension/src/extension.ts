// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-inject/crossenv';

import { createView, Popup } from '@polkadot/extension-ui';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/background.js')
    .then(function (registration) {
      console.log('Registration successful, scope:', registration.scope);
    })
    .catch(function (error) {
      console.log('Service worker registration failed, error:', error);
    });
}

createView(Popup);
