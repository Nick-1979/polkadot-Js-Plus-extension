// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @description
 * this component provides icons related to each action, which is depicted in transaction history
 * */

import {
  AcUnit as AcUnitIcon,
  Add as AddIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  AllOut as AllOutIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  Check as CheckIcon,
  GroupRemove as GroupRemoveIcon,
  HowToReg as HowToRegIcon,
  Link as LinkIcon,
  MoveUpRounded as MoveUpRoundedIcon,
  NotificationsNone as NotificationsNoneIcon,
  Pool as PoolIcon,
  PublishedWithChanges as PublishedWithChangesIcon,
  RecommendOutlined as RecommendOutlinedIcon,
  Redeem as RedeemIcon,
  Remove as RemoveIcon,
  SettingsAccessibility as SettingsAccessibilityIcon,
  SettingsApplicationsOutlined as SettingsApplicationsOutlinedIcon,
  GppMaybeOutlined as GppMaybeOutlinedIcon,
  AddModeratorOutlined as AddModeratorOutlinedIcon,
  AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon,
  SportsScore  as SportsScoreIcon ,
  StopCircle as StopCircleIcon,
  SummarizeOutlined as SummarizeOutlinedIcon,
  SystemUpdateAltOutlined as SystemUpdateAltOutlinedIcon,
  ThumbsUpDownRounded as ThumbsUpDownRoundedIcon,
  VolunteerActivismSharp as VolunteerActivismSharpIcon,
  VerifiedUserOutlined as VerifiedUserOutlinedIcon,
  SettingsBackupRestore  as SettingsBackupRestoreIcon 
} from '@mui/icons-material';
import React from 'react';

export function getTxIcon(action: string): React.ReactNode {
  switch (action.toLowerCase()) {
    case ('send'):
      return <CallMadeIcon
        color='secondary'
        fontSize='small'
      />;
    case ('receive'):
      return <CallReceivedIcon
        color='primary'
        fontSize='small'
      />;
    case ('bond'):
    case ('pool_bond'):
      return <AddIcon
        color='success'
        fontSize='small'
      />;
    case ('unbond'):
    case ('pool_unbond'):
    case ('pool_unbond2'):
      return <RemoveIcon
        color='error'
        fontSize='small'
      />;
    case ('bond_extra'):
    case ('pool_bond_extra'):
      return <AddCircleOutlineIcon
        color='action'
        fontSize='small'
      />;
    case ('nominate'):
    case ('pool_nominate'):
      return <CheckIcon
        fontSize='small'
        sx={{ color: 'green' }}
      />;
    case ('redeem'):
    case ('pool_redeem'):
      return <RedeemIcon
        color='warning'
        fontSize='small'
      />;
    case ('pool_claim'):
      return <SystemUpdateAltOutlinedIcon
        color='warning'
        fontSize='small'
      />;
    case ('pool_join'):
      return <SettingsAccessibilityIcon
        color='warning'
        fontSize='small'
      />;
    case ('pool_create'):
      return <PoolIcon
        color='info'
        fontSize='small'
      />;
    case ('pool_setstate'):
      return <PublishedWithChangesIcon
        color='action'
        fontSize='small'
      />;
    case ('pool_edit'):
      return <SettingsApplicationsOutlinedIcon
        color='warning'
        fontSize='small'
      />;
    case ('pool_stop_nominating'):
      return <StopCircleIcon
        fontSize='small'
        sx={{ color: 'black' }}
      />;
    case ('stop_nominating'):
      return <StopCircleIcon
        fontSize='small'
        sx={{ color: 'black' }}
      />;
    case ('chill'):
      return <AcUnitIcon
        fontSize='small'
        sx={{ color: '#e2e7ba' }}
      />;
    case ('contribute'):
      return <AllOutIcon
        color='info'
        fontSize='small'
      />;
    case ('link'):
      return <LinkIcon
        fontSize='small'
        sx={{ color: 'blue' }}
      />;
    case ('tuneup'):
      return <MoveUpRoundedIcon
        color='primary'
        fontSize='small'
      />;
    case ('democracy_vote'):
      return <ThumbsUpDownRoundedIcon
        fontSize='small'
        sx={{ color: 'blue' }}
      />;
    case ('endorse'):
      return <RecommendOutlinedIcon
        fontSize='small'
        sx={{ color: 'purple' }}
      />;
    case ('council_vote'):
      return <HowToRegIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
    case ('cancel_vote'):
      return <GroupRemoveIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
    case ('submit_proposal'):
      return <SummarizeOutlinedIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
    case ('propose_tip'):
      return <VolunteerActivismSharpIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
    case ('initiate_recovery'):
      return <SportsScoreIcon 
        fontSize='small'
        sx={{ color: 'OrangeRed' }}
      />;
    case ('vouch_recovery'):
      return <AdminPanelSettingsOutlinedIcon
        fontSize='small'
        sx={{ color: 'green' }}
      />;
    case ('close_recovery'):
      return <GppMaybeOutlinedIcon
        fontSize='small'
        sx={{ color: 'Crimson' }}
      />;
    case ('make_recoverable'):
      return <AddModeratorOutlinedIcon
        fontSize='small'
        sx={{ color: 'Tomato' }}
      />;
    case ('remove_recovery'):
      return <VerifiedUserOutlinedIcon
        fontSize='small'
        sx={{ color: 'DarkSlateGray' }}
      />;
    case ('withdraw'):
      return <SettingsBackupRestoreIcon 
        fontSize='small'
        sx={{ color: 'LimeGreen' }}
      />;
    default:
      return <NotificationsNoneIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
  }
}
