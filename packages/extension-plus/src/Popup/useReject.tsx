// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import React, { useState } from 'react';

export let reject = false;
export let setReject: React.Dispatch<React.SetStateAction<boolean>>;

export const useReject = () => ([reject, setReject] = useState<boolean>(false));
