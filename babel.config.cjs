// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const m = require('@polkadot/dev/config/babel-config-cjs.cjs')
m.plugins.push(require.resolve("babel-plugin-transform-import-meta"));

module.exports = m;
