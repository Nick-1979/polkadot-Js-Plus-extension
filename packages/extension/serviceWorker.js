// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

try {
  // This is the file produced by webpack
  self.importScripts('build/background.js');
} catch (e) {
  // This will allow you to see error logs during registration/execution
  console.error(e);
}
