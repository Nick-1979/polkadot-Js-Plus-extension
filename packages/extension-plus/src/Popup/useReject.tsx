// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import React, { useState } from 'react';

export let reject = false;
export let setReject: React.Dispatch<React.SetStateAction<boolean>>;

export const useReject = () => ([reject, setReject] = useState<boolean>(false));
