// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { chainLogos, emptyLogos, namedLogos, nodeLogos, specLogos } from '@polkadot/apps-config';

function sanitize(value?: string): string {
    return value?.toLowerCase().replace('-', ' ') || '';
}

export function getLogo(logo: string | undefined): string {
    const found = logo ? (namedLogos[logo] || chainLogos[sanitize(logo)] || nodeLogos[sanitize(logo)] || specLogos[sanitize(logo)]) : undefined;

    return (found || emptyLogos.empty) as string;
}
