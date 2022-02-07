// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Link as LinkIcon, NotificationsNone as NotificationsNoneIcon, CallReceived as CallReceivedIcon, StopCircle as StopCircleIcon, Redeem as RedeemIcon, Check as CheckIcon, Remove as RemoveIcon, CallMade as CallMadeIcon, Add as AddIcon, AddCircleOutline as AddCircleOutlineIcon } from '@mui/icons-material';

export function getTxIcon(action: string): React.ReactNode {
  switch (action.toLowerCase()) {
    case ('send'):
      return <CallMadeIcon fontSize='small' color='secondary' />;
    case ('receive'):
      return <CallReceivedIcon fontSize='small' color='primary' />;
    case ('bond'):
      return <AddIcon fontSize='small' color='success' />;
    case ('unbond'):
      return <RemoveIcon fontSize='small' sx={{ color: 'red' }} />;
    case ('bond_extra'):
      return <AddCircleOutlineIcon fontSize='small' />;
    case ('nominate'):
      return <CheckIcon fontSize='small' sx={{ color: 'green' }} />;
    case ('redeem'):
      return <RedeemIcon fontSize='small' sx={{ color: 'forestgreen' }} />;
    case ('stop_nominating'):
      return <StopCircleIcon fontSize='small' sx={{ color: 'black' }} />;
    case ('link'):
      return <LinkIcon fontSize='small' sx={{ color: 'blue' }} />;
    default:
      return <NotificationsNoneIcon fontSize='small' sx={{ color: 'red' }} />;
  }
}
