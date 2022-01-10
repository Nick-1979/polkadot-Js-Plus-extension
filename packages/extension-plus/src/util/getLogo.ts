// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { chainLogos, emptyLogos, namedLogos, nodeLogos, specLogos } from '@polkadot/apps-config';

import { Chain } from '../../../extension-chains/src/types';

function sanitize(value?: string): string {
  return value?.toLowerCase().replace('-', ' ') || '';
}

export default function getLogo(info: string | undefined | Chain): string {
  const chainName = (info as Chain)?.name?.replace(' Relay Chain', '').toLowerCase() ?? info as string;
  const found = chainName ? (namedLogos[chainName] || chainLogos[sanitize(chainName)] || nodeLogos[sanitize(chainName)] || specLogos[sanitize(chainName)]) : undefined;

  return (found || emptyLogos.empty) as string;
}