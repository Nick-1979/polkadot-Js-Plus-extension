// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { faBorderNone, faCheck, faCoins, faLevelDownAlt, faLevelUpAlt, faLink, faMinus, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';

export function getIcon(action: string): { color: string, icon: IconDefinition } {
  switch (action.toLowerCase()) {
    case ('send'):
      return { color: 'blue', icon: faLevelUpAlt };
    case ('receive'):
      return { color: 'purple', icon: faLevelDownAlt };
    case ('bond'):
      return { color: 'orange', icon: faCoins };
    case ('unbond'):
      return { color: 'crimson', icon: faMinus };
    case ('bond_extra'):
      return { color: 'chocolate', icon: faPlus };
    case ('nominate'):
      return { color: 'deepskyblue', icon: faCheck };
    case ('redeem'):
      return { color: 'gold', icon: faLevelDownAlt };
    case ('stop_nominating'):
      return { color: 'gold', icon: faLevelDownAlt };
    case ('link'):
      return { color: 'blue', icon: faLink };
    default:
      return { color: '', icon: faBorderNone };
  }
}
