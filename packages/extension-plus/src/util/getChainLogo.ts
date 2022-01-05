// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { Chain } from '@polkadot/extension-chains/types';

import DOT from '../assets/logos/DOT.png';
import KSM from '../assets/logos/KSM.svg';
import WSN from '../assets/logos/WSN.svg';
import getNetworkInfo from './getNetwork';

export default function getChainLogo(chain?: Chain | null | undefined, chainName?: string): string {
  const coin = chain ? getNetworkInfo(chain).coin : chainName;

  switch (coin) {
    case ('WSN'):
    case ('westend'):
      return WSN;
    case ('DOT'):
    case ('polkadot'):
      return DOT;
    case ('KSM'):
    case ('kusama'):
      return KSM;
    default:
      return WSN;
  }
}
