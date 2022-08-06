// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Chain } from '@polkadot/extension-chains/types';

import { Close, Initiation } from '../../../util/plusTypes';
import { getCloses, getInitiations } from '../../../util/subquery';

export function getRescuers(chain: Chain, lostId: string) {
  const chainName = chain?.name.replace(' Relay Chain', '');

  lostId && chainName && getInitiations(chainName, lostId, 'lost').then((initiations: Initiation[] | null) => {
    if (!initiations?.length) {
      // no initiations set rescuers null
      return null;
    }

    // eslint-disable-next-line no-void
    void getCloses(chainName, lostId).then((closes: Close[] | null) => {
      if (!closes?.length) {
        // return set all initiations
        return initiations?.map((i) => i.rescuer);
      }

      const openInitiation = initiations.filter((i: Initiation) => !closes.find((c: Close) => c.lost === i.lost && c.rescuer === i.rescuer && new BN(i.blockNumber).lt(new BN(c.blockNumber))));

      return openInitiation?.map((oi) => oi.rescuer);
    });
  });
}

// export function isRecovering(api, chain: Chain, lostId: string, rescuer: string) {
//   api.query.recovery.activeRecoveries(lostId, rescuer).then((activeRecovery: Option<PalletRecoveryActiveRecovery>) => {

//     if (activeRecovery?.isSome) {
//       const unwrapedRescuer = activeRecovery.unwrap();

//       return {
//         accountId: rescuer,
//         option: {
//           created: unwrapedRescuer.created,
//           deposit: unwrapedRescuer.deposit,
//           friends: JSON.parse(JSON.stringify(unwrapedRescuer.friends)) as string[]
//         }
//       };
//     }

//     return null;
//   });
//   }