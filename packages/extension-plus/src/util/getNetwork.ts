// /* eslint-disable sort-keys */
// // Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// // SPDX-License-Identifier: Apache-2.0
// /* eslint-disable header/header */

// // eslint-disable-next-line header/header
// import type { Chain } from '@polkadot/extension-chains/types';

// // eslint-disable-next-line header/header
// export default function getNetworkInfo(chain?: Chain | null | undefined, chainName?: string): {
//   url: string,
//   coin: string,
//   decimals: number,
//   ED: number,
//   defaultFee: string,
//   minNominatorBond: string,
//   genesisHash?: string,
//   prefix?: number,
// } {
//   const network = chain ? chain.name.replace(' Relay Chain', '') : chainName;

//   switch (network?.toLowerCase()) {
//     case ('westend'):
//       return {
//         coin: 'WND',
//         decimals: 12,
//         ED: 0.01, // existential deposit
//         url: 'wss://westend-rpc.polkadot.io',
//         defaultFee: '16100000000',
//         minNominatorBond: '1000000000000',
//         genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
//         prefix: -1
//       };
//     case ('polkadot'):
//       return {
//         coin: 'DOT',
//         decimals: 10,
//         ED: 1,
//         url: 'wss://rpc.polkadot.io',
//         defaultFee: '161000000',
//         minNominatorBond: '1200000000000',
//         genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
//         prefix: 0
//       };
//     case ('kusama'):
//       return {
//         coin: 'KSM',
//         decimals: 12,
//         ED: 0.0000333333,
//         url: 'wss://kusama-rpc.polkadot.io',
//         defaultFee: '161000000',
//         minNominatorBond: '100000000000',
//         genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
//         prefix: 2

//       };
//     case ('bifrost'):
//       return {
//         coin: 'BNC',
//         url: 'wss://bifrost.polkadot.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     case ('centrifuge chain'):
//       return {
//         coin: 'CFG',
//         url: 'wss://centrifuge.polkadot.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     case ('dock mainnet'):
//       return {
//         coin: 'DCK',
//         url: 'wss://dock-rpc.polkadot.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     case ('edgeware'):
//       return {
//         coin: 'EDG',
//         url: 'wss://edgeware-rpc.polkadot.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     case ('equilibrium network'):
//       return {
//         coin: 'EQ',
//         url: 'wss://equilibrium-rpc.polkadot.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     case ('yydradX'):
//       return {
//         coin: 'HDX',
//         url: 'wss://hydradx-rpc.polkadot.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     case ('karura'):
//       return {
//         coin: 'KAR',
//         url: 'wss://karura.polkawallet.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     case ('Acala'):
//       return {
//         coin: 'ACR',
//         url: 'wss://acala.polkawallet.io',
//         decimals: 12,
//         ED: 1,
//         defaultFee: '16100000000',
//         minNominatorBond: '0'
//       };
//     default:
//       return {
//         coin: 'WND',
//         decimals: 12,
//         ED: 0.01,
//         url: 'wss://westend-rpc.polkadot.io',
//         defaultFee: '16100000000',
//         minNominatorBond: '1000000000000'
//         // genesisHash:'0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e'
//       };
//   }
// }
