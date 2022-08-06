// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import keyring from '@polkadot/ui-keyring';
import { BN } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import Extension from '../../../../extension-base/src/background/handlers/Extension';
import State, { AuthUrls } from '../../../../extension-base/src/background/handlers/State';
import { AccountsStore } from '../../../../extension-base/src/stores';
import { Crowdloan, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts, PutInFrontInfo, RebagInfo, StakingConsts, ValidatorsName } from '../../util/plusTypes';
import { SHORT_ADDRESS_CHARACTERS } from '../constants';
import { Auction } from '../plusTypes';

export const westendGenesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';
const type = 'sr25519';
const password = 'passw0rd';

export const firstSuri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
export const secondSuri = 'inspire erosion chalk grant decade photo ribbon custom quality sure exhaust detail';

export const auction: Auction = {
  auctionCounter: 10,
  auctionInfo: [
    7,
    9095310
  ],
  blockchain: 'polkadot',
  crowdloans: [{
    fund: {
      depositor: '13pQt6LnK2tXZtXbiQ6PBYikEoNTi6MXkeBdQCeyR9hm6k1p',
      verifier: null,
      deposit: '5000000000000',
      raised: '3660257994777',
      end: 9388800,
      cap: '50000000000000000',
      lastContribution: {
        ending: 9117345
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 27,
      paraId: '2028',
      hasLeased: false
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '1zunQTaRifL1XULrRLPgSbf6YbkZnjeJiQfwZuxVoJR5mhA',
      verifier: null,
      deposit: '5000000000000',
      raised: '3393179616292899',
      end: 9388800,
      cap: '80000000000000000',
      lastContribution: {
        ending: 9136288
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 24,
      paraId: '2035',
      hasLeased: false
    },
    identity: {
      info: {
        display: 'Phala Genesis',
        web: 'https://phala.network'
      }
    }
  },
  {
    fund: {
      depositor: '14gZicKnmFj3238utrQ6B7CGWBeNGntKUyoUHqoTN85FnHWk',
      verifier: null,
      deposit: '5000000000000',
      raised: '24744466313081235',
      end: 9388800,
      cap: '500000000000000000',
      lastContribution: {
        ending: 9136445
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 15,
      paraId: '2032',
      hasLeased: false
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '12LxQoLA9hebiMSPT3G7ixz73LLuYomMNuRLqX7c9bRWxDFG',
      verifier: null,
      deposit: '5000000000000',
      raised: '76953774505455550',
      end: 9388800,
      cap: '500000000000000000',
      lastContribution: {
        ending: 8360909
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 20,
      paraId: '2021',
      hasLeased: true
    },
    identity: {
      info: {
        display: 'Efinity (EFI)',
        legal: 'Efinity',
        web: 'https://efinity.io/',
        twitter: '@enjin'
      }
    }
  },
  {
    fund: {
      depositor: '13QrQ7Xos6bseivYW3xRjvi4T2iHihxVnTrQgyHmWGTNv972',
      verifier: null,
      deposit: '5000000000000',
      raised: '539223363758938',
      end: 9388800,
      cap: '50000000000000000',
      lastContribution: {
        ending: 9136317
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 13,
      paraId: '2008',
      hasLeased: false
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '1muqpuFcWvy1Q3tf9Tek882A6ngz46bWPsV6sWiYccnVjKb',
      verifier: null,
      deposit: '5000000000000',
      raised: '325159802323576263',
      end: 8179200,
      cap: '500000000000000000',
      lastContribution: {
        ending: 7756102
      },
      firstPeriod: 6,
      lastPeriod: 13,
      trieIndex: 0,
      paraId: '2000',
      hasLeased: true
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '14e4GmLj5CccWe9Rant9q6yQro1oysqvKiBiHcpCRoscZ1yY',
      verifier: null,
      deposit: '5000000000000',
      raised: '97524874268038525',
      end: 8179200,
      cap: '500000000000000000',
      lastContribution: {
        ending: 8159302
      },
      firstPeriod: 6,
      lastPeriod: 13,
      trieIndex: 5,
      paraId: '2002',
      hasLeased: true
    },
    identity: {
      info: {
        display: 'Clover',
        legal: 'Clover',
        web: 'https://clover.finance',
        email: 'info@clover.finance',
        twitter: '@clover_finance'
      }
    }
  },
  {
    fund: {
      depositor: '12jYuVktdKEC6C4g4d5fuW9MLgUDbxvJRhMBkhEGyqarUzbQ',
      verifier: null,
      deposit: '5000000000000',
      raised: '1279767453472237',
      end: 9388800,
      cap: '80000000000000000',
      lastContribution: {
        ending: 9134581
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 26,
      paraId: '2036',
      hasLeased: false
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '16RzEcgXVzXXn2gEQbqqp74Pw7MJSb7PKtz29BhVZmpXBKRn',
      verifier: null,
      deposit: '5000000000000',
      raised: '54573854554250',
      end: 9388800,
      cap: '4000000000000000',
      lastContribution: {
        ending: 9130216
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 23,
      paraId: '2017',
      hasLeased: false
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '14fhPR28n9EHZitNyf6wjYZVBPwKgcgogVjJPTzvCcb8qi9G',
      verifier: null,
      deposit: '5000000000000',
      raised: '12637919863332626',
      end: 9388800,
      cap: '77500000000000000',
      lastContribution: {
        ending: 9136419
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 19,
      paraId: '2011',
      hasLeased: false
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '12KHAurRWMFJyxU57S9pQerHsKLCwvWKM1d3dKZVx7gSfkFJ',
      verifier: {
        sr25519: '0x16732d1a045c9351606743bf786aad1db344e5dd51e15d6417deb3828044080e'
      },
      deposit: '5000000000000',
      raised: '357599313927924796',
      end: 8179199,
      cap: '1000000000000000000',
      lastContribution: {
        ending: 7815351
      },
      firstPeriod: 6,
      lastPeriod: 13,
      trieIndex: 2,
      paraId: '2004',
      hasLeased: true
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '12EXcpt1CwnSAF9d7YWrh91bQw6R5wmCpJUXPWi7vn2CZFpJ',
      verifier: null,
      deposit: '5000000000000',
      raised: '60754867365972247',
      end: 9388800,
      cap: '250000000000000000',
      lastContribution: {
        ending: 8562504
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 17,
      paraId: '2019',
      hasLeased: true
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '143pzStAtMv3RbYbcHyr2xHipWPkme8VjVgAr4QDQP8d3Xrc',
      verifier: null,
      deposit: '5000000000000',
      raised: '54351606709535446',
      end: 9388800,
      cap: '200000000000000000',
      lastContribution: {
        ending: 8764087
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 18,
      paraId: '2031',
      hasLeased: true
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '1Rp3mJJUxPD1nJ6gf179scdejMSSJb46eYoFyEktR6DYt6z',
      verifier: null,
      deposit: '5000000000000',
      raised: '24625428629746054',
      end: 9388800,
      cap: '80000000000000000',
      lastContribution: {
        ending: 8965708
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 25,
      paraId: '2034',
      hasLeased: true
    },
    identity: {
      info: {
        display: null,
        legal: null,
        web: null,
        email: null,
        twitter: null
      }
    }
  },
  {
    fund: {
      depositor: '15kjdKF4hRbYWzLjovPiohT5pVheXhhk8oKHr3DyTaxF2evd',
      verifier: null,
      deposit: '5000000000000',
      raised: '107515186195417478',
      end: 8179200,
      cap: '400000000000000000',
      lastContribution: {
        ending: 8058505
      },
      firstPeriod: 6,
      lastPeriod: 13,
      trieIndex: 6,
      paraId: '2012',
      hasLeased: true
    },
    identity: {
      info: {
        display: 'Parallel Finance - 2',
        web: 'https://parallel.fi/',
        twitter: 'https://twitter.com/ParallelFi'
      }
    }
  },
  {
    fund: {
      depositor: '16LKv69ct6xDzSiUjuz154vCg62dkyysektHFCeJe85xb6X',
      verifier: null,
      deposit: '5000000000000',
      raised: '8041687933258179',
      end: 9388800,
      cap: '250000000000000000',
      lastContribution: {
        ending: 9136045
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 14,
      paraId: '2026',
      hasLeased: false
    },
    identity: {
      info: {
        display: 'Nodle',
        twitter: '@NodleNetwork'
      }
    }
  },
  {
    fund: {
      depositor: '1EdsnniYSKNjHNAvDgvBfRNzKnSzi6kgsHQFCG4PhAyyJWH',
      verifier: null,
      deposit: '5000000000000',
      raised: '2824692492981460',
      end: 9388800,
      cap: '300000000000000000',
      lastContribution: {
        ending: 9135961
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 10,
      paraId: '2003',
      hasLeased: false
    },
    identity: {
      info: {
        display: 'Darwinia Dev'
      }
    }
  },
  {
    fund: {
      depositor: '1j5YyEGdcPd9BxkzVNNjKkqdi5f7g3Dd7JMgaGUhsMrZ6dZ',
      verifier: null,
      deposit: '5000000000000',
      raised: '103335520433166970',
      end: 8179200,
      cap: '350000010000000000',
      lastContribution: {
        ending: 7957704
      },
      firstPeriod: 6,
      lastPeriod: 13,
      trieIndex: 3,
      paraId: '2006',
      hasLeased: true
    },
    identity: {
      info: {
        display: 'Astar Network',
        legal: 'Astar Network',
        web: 'https://astar.network/',
        twitter: '@AstarNetwork'
      }
    }
  },
  {
    fund: {
      depositor: '152deMvsN7wxMbSmdApsds6LWNNNGgsJ8TTpZLTD2ipEHNg3',
      verifier: null,
      deposit: '5000000000000',
      raised: '4389963539740334',
      end: 9388800,
      cap: '120000000000000000',
      lastContribution: {
        ending: 9136025
      },
      firstPeriod: 7,
      lastPeriod: 14,
      trieIndex: 21,
      paraId: '2013',
      hasLeased: false
    },
    identity: {
      info: {
        display: 'Litentry',
        legal: 'Litentry',
        email: 'info@litentry.com'
      }
    }
  }
  ],
  currentBlockNumber: 9136492,
  minContribution: '50000000000',
  winning: [
    [
      '13UVJyLnbVp77Z2t6rgdY269yXtxjxjdsPXr1N3BwQVsktTK',
      '2,032',
      '23456145892351463'
    ]
  ]
};

export const endpoints: LinkOption[] = [
  {
    info: 'statemint',
    isChild: true,
    paraId: 1000,
    text: 'Statemint',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://statemint-rpc.polkadot.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    info: 'statemint',
    isChild: true,
    paraId: 1000,
    text: 'Statemint',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://statemint.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-0.aca-api.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-1.aca-api.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-2.aca-api.network/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-3.aca-api.network/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala.polkawallet.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-polkadot.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://www.aresprotocol.io/',
    info: 'odyssey',
    isChild: true,
    paraId: 2028,
    text: 'Ares Odyssey',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://wss.odyssey.aresprotocol.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://astar.network',
    info: 'astar',
    isChild: true,
    paraId: 2006,
    text: 'Astar',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.astar.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://astar.network',
    info: 'astar',
    isChild: true,
    paraId: 2006,
    text: 'Astar',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://astar.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://clover.finance',
    info: 'clover',
    isChild: true,
    paraId: 2002,
    text: 'Clover',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc-para.clover.finance',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://clover.finance',
    info: 'clover',
    isChild: true,
    paraId: 2002,
    text: 'Clover',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://clover.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://efinity.io',
    info: 'efinity',
    isChild: true,
    paraId: 2021,
    text: 'Efinity',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.efinity.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://interlay.io/',
    info: 'interlay',
    isChild: true,
    paraId: 2032,
    text: 'Interlay',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://api.interlay.io/parachain',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://manta.network',
    info: 'manta',
    isChild: true,
    paraId: 2015,
    text: 'Manta',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://kuhlii.manta.systems',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://manta.network',
    info: 'manta',
    isChild: true,
    paraId: 2015,
    text: 'Manta',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://pectinata.manta.systems',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://moonbeam.network/networks/moonbeam/',
    info: 'moonbeam',
    isChild: true,
    paraId: 2004,
    text: 'Moonbeam',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://wss.api.moonbeam.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://moonbeam.network/networks/moonbeam/',
    info: 'moonbeam',
    isChild: true,
    paraId: 2004,
    text: 'Moonbeam',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://moonbeam.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://parallel.fi',
    info: 'parallel',
    isChild: true,
    paraId: 2012,
    text: 'Parallel',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parallel.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://parallel.fi',
    info: 'parallel',
    isChild: true,
    paraId: 2012,
    text: 'Parallel',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.parallel.fi',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://polkadex.trade/',
    info: 'polkadex',
    isChild: true,
    paraId: 2036,
    text: 'Polkadex',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://mainnet.polkadex.trade/',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://dot.bifrost.app/?ref=polkadotjs',
    info: 'bifrost',
    isChild: true,
    isUnreachable: true,
    paraId: 2001,
    text: 'Bifrost',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://bifrost-dot.liebi.com/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://centrifuge.io',
    info: 'centrifuge',
    isChild: true,
    isUnreachable: true,
    paraId: 2031,
    text: 'Centrifuge',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://fullnode.parachain.centrifuge.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'http://www.coinversation.io/',
    info: 'coinversation',
    isChild: true,
    isUnreachable: true,
    paraId: 2027,
    text: 'Coinversation',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.coinversation.io/',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://composable.finance/',
    info: 'composableFinance',
    isChild: true,
    isUnreachable: true,
    paraId: 2019,
    text: 'Composable Finance',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.composable.finance',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://crust.network',
    info: 'crustParachain',
    isChild: true,
    isUnreachable: true,
    paraId: 2008,
    text: 'Crust',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.crust.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://darwinia.network/',
    info: 'darwinia',
    isChild: true,
    isUnreachable: true,
    paraId: 2003,
    text: 'Darwinia',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parachain-rpc.darwinia.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://equilibrium.io/',
    info: 'equilibrium',
    isChild: true,
    isUnreachable: true,
    paraId: 2011,
    text: 'Equilibrium',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://node.equilibrium.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://hydradx.io/',
    info: 'hydra',
    isChild: true,
    isUnreachable: true,
    paraId: 2034,
    text: 'HydraDX',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc-01.hydradx.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://crowdloan.litentry.com',
    info: 'litentry',
    isChild: true,
    isUnreachable: true,
    paraId: 2013,
    text: 'Litentry',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parachain.litentry.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://nodle.com',
    info: 'nodle',
    isChild: true,
    isUnreachable: true,
    paraId: 2026,
    text: 'Nodle',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.nodle.com',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://phala.network',
    info: 'phala',
    isChild: true,
    isUnreachable: true,
    paraId: 2035,
    text: 'Phala Network',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://api.phala.network/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://subdao.network/',
    info: 'subdao',
    isChild: true,
    isUnreachable: true,
    paraId: 2018,
    text: 'SubDAO',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parachain-rpc.subdao.org',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'http://subgame.org/',
    info: 'subgame',
    isChild: true,
    isUnreachable: true,
    paraId: 2017,
    text: 'SubGame Gamma',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://gamma.subgame.org/',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  }
];

const winning = auction?.winning.find((x) => x);

export const crowdloan: Crowdloan = auction?.crowdloans.find((c) => c.fund.paraId === winning[1].replace(/,/g, ''));
export const actives = auction.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber && !c.fund.hasLeased);
export const winners = auction.crowdloans.filter((c) => c.fund.hasLeased);

export const display = (c: Crowdloan): string => c.identity.info.display || c.identity.info.legal || getText(c.fund.paraId) || '';
export const getText = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.text as string);

export function makeShortAddr(address: string | undefined) {
  if (!address) {
    return;
  }

  return `${address?.slice(0, SHORT_ADDRESS_CHARACTERS)}...${address?.slice(-1 * SHORT_ADDRESS_CHARACTERS)}`;
}

export const validatorsName: ValidatorsName[] = [
  { address: '5HTGweepNDc7dCa34YtPn6kF4BLJvaMxbW3i3vzXBGn41Nz3', name: 'AmirEF' },
  { address: '5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX', name: 'Adam' },
  { address: '5EfEfh3pW9GaquFvpBpeeVwQJCGUS7CuVpSMXXXked3Xi6hp', name: 'Diego' },
  { address: '5G6TeiXHZJFV3DtPABJ22thuLguSEPJgH7FkqcRPrn88mFKh', name: 'Moly' },
  { address: '5GVzG3QJvRc6MEtxaJZnLB3PAhQT8eMgesqgHxYiiQJE4HNv', name: 'Mary' },
  { address: '5CPDNHdbZMNNeHLq7t9Cc434CM1fBL6tkaifiCG3kaQ8KHv8', name: 'NewYork Times' },
  { address: '5C864nyotaG4cNoR3YBUqnPVnnvqF1NN1s9t9CuAebyQkQGF', name: 'Olivia' },
  { address: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA', name: 'Amir' },
  { address: '5GYaYNVq6e855t5hVCyk4Wuqssaf6ADTrvdPZ3QXyHvFXTip', name: 'Emma' },
  { address: '5Ek5JCnrRsyUGYNRaEvkufG1i1EUxEE9cytuWBBjA9oNZVsf', name: 'Mia' }
];

const others = [
  { who: validatorsName[0].address, value: 2331341969325348 },
  { who: validatorsName[1].address, value: 2233136292040751 },
  { who: validatorsName[2].address, value: 1102408869404150 },
  { who: validatorsName[3].address, value: 536346326599754 },
  { who: validatorsName[4].address, value: 536346326599754 },
  { who: validatorsName[5].address, value: 536346326599754 },
  { who: validatorsName[6].address, value: 536346326599754 },
  { who: validatorsName[7].address, value: 536346326599754 },
  { who: validatorsName[8].address, value: 536346326599754 },
  { who: validatorsName[9].address, value: 123257089339220 }
];

export const validatorsList: DeriveStakingQuery[] = [
  { accountId: validatorsName[0].address, exposure: { others: others.slice(0, 1), own: 345, total: 1523456 }, validatorPrefs: { commission: 200000000 } },
  { accountId: validatorsName[1].address, exposure: { others: others.slice(0, 2), own: 451, total: 1233456 }, validatorPrefs: { commission: 210000000 } },
  { accountId: validatorsName[2].address, exposure: { others: others.slice(0, 3), own: 4512, total: 1232456 }, validatorPrefs: { commission: 150000000 } },
  { accountId: validatorsName[3].address, exposure: { others: others.slice(0, 4), own: 45123, total: 123456 }, validatorPrefs: { commission: 90000000 } },
  { accountId: validatorsName[4].address, exposure: { others: others.slice(0, 6), own: 51234, total: 123456 }, validatorPrefs: { commission: 750000000 } },
  { accountId: validatorsName[5].address, exposure: { others: others.slice(0, 7), own: 1124, total: 1234567 }, validatorPrefs: { commission: 160000000 } },
  { accountId: validatorsName[6].address, exposure: { others: others.slice(0, 8), own: 2345, total: 12345678 }, validatorPrefs: { commission: 130000000 } }
];

export const validatorsIdentities: DeriveAccountInfo[] = [
  { accountId: validatorsList[0].accountId, identity: { display: validatorsName[0].name } },
  { accountId: validatorsList[1].accountId, identity: { display: validatorsName[1].name } },
  { accountId: validatorsList[2].accountId, identity: { display: validatorsName[2].name } },
  { accountId: validatorsList[3].accountId, identity: { display: validatorsName[3].name } },
  { accountId: validatorsList[4].accountId, identity: { display: validatorsName[4].name } },
  { accountId: validatorsList[5].accountId, identity: { display: validatorsName[5].name } },
  { accountId: validatorsList[6].accountId, identity: { display: validatorsName[6].name } }
];

export const stakingConsts: StakingConsts = {
  unbondingDuration: 28,
  existentialDeposit: 10000000000n,
  maxNominations: 16,
  maxNominatorRewardedPerValidator: 64,
  minNominatorBond: 1000000000000n
};

export const nominatorInfoFalse = {
  isInList: false,
  minNominated: 2500000000000n
};

export const nominatorInfoTrue = {
  isInList: false,
  minNominated: 2500000000000n
};

export const nominatedValidators: DeriveStakingQuery[] = [
  { accountId: validatorsName[5].address, exposure: { others: others.slice(1), total: 23456 }, validatorPrefs: { commission: 200000000 } },
  { accountId: validatorsName[6].address, exposure: { others: others.slice(0, 1), total: 123456 }, validatorPrefs: { commission: 210000000 } },
  { accountId: validatorsName[7].address, exposure: { others: others.slice(3), total: 12356 }, validatorPrefs: { commission: 150000000 } },
  { accountId: validatorsName[8].address, exposure: { others: others.slice(2), total: 12356 }, validatorPrefs: { commission: 90000000 } },
  { accountId: validatorsName[9].address, exposure: { others, total: 123456 }, validatorPrefs: { commission: 750000000 } }
];

export async function createAcc(suri: string, genesisHash: string, extension: Extension): Promise<string> {
  await extension.handle('id', 'pri(accounts.create.suri)', {
    genesisHash,
    name: 'Amir khan',
    password,
    suri,
    type
  }, {} as chrome.runtime.Port);

  const { address } = await extension.handle('id', 'pri(seed.validate)', { suri, type }, {} as chrome.runtime.Port);

  return address;
}

export async function createAccount(suri: string, extension: Extension): Promise<string> {
  await extension.handle('id', 'pri(accounts.create.suri)', {
    genesisHash: westendGenesisHash,
    name: 'Amir khan',
    password,
    suri,
    type
  }, {} as chrome.runtime.Port);

  const { address } = await extension.handle('id', 'pri(seed.validate)', { suri, type }, {} as chrome.runtime.Port);

  return address;
}

export async function createExtension(): Promise<Extension> {
  try {
    return new Promise((resolve) => {
      cryptoWaitReady()
        .then((): void => {
          keyring.loadAll({ store: new AccountsStore() });
          const authUrls: AuthUrls = {};

          authUrls['localhost:3000'] = {
            count: 0,
            id: '11',
            isAllowed: true,
            origin: 'example.com',
            url: 'http://localhost:3000'
          };
          localStorage.setItem('authUrls', JSON.stringify(authUrls));
          const state = new State();

          resolve(new Extension(state));
        }).catch((error): void => {
          console.error('initialization failed in testHelpers', error);
        });
    });
  } catch (error) {
    console.error('Catch error when loadAll:', error);
  }
}

export const accounts = [
  { address: '14fyMNdvtG6FiqQ1c4YiVr33kXeRGj5Nv4wceNyRV3ePeMw7', genesisHash: westendGenesisHash, name: 'Amir', type: 'sr25519' },
  { address: '5GYmFzQCuC5u3tQNiMZNbFGakrz3Jq31NmMg4D2QAkSoQ2g5', genesisHash: westendGenesisHash, name: 'Kami', type: 'sr25519' },
  { address: '5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX', genesisHash: westendGenesisHash, name: 'Mary', type: 'sr25519' }
] as AccountJson[];

export const SettingsStruct = { prefix: 0 };

export const chain = (name = 'Polkadot'): Chain => {
  return {
    definition: {
      chain: name.toLowerCase() === 'polkadot' ? 'Polkadot Relay Chain' : name.toLowerCase() === 'kusama' ? 'Kusama Relay Chain' : 'Westend',
      genesisHash: name.toLowerCase() === 'polkadot' ? '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3' : name.toLowerCase() === 'kusama' ? '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe' : westendGenesisHash,
      icon: name.toLowerCase() === 'polkadot' ? 'polkadot' : name.toLowerCase() === 'kusama' ? 'kusama' : 'westend',
      ss58Format: name.toLowerCase() === 'polkadot' ? 0 : name.toLowerCase() === 'kusama' ? 2 : 42,
      specVersion: 0,
      tokenDecimals: 15,
      tokenSymbol: name.toLowerCase() === 'polkadot' ? 'Dot' : name.toLowerCase() === 'kusama' ? 'Ksm' : 'Wnd',
      types: {}
    },
    genesisHash: name.toLowerCase() === 'polkadot' ? '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3' : name.toLowerCase() === 'kusama' ? '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe' : westendGenesisHash,
    hasMetadata: false,
    icon: 'polkadot',
    isUnknown: false,
    name: name.toLowerCase() === 'polkadot' ? 'polkadot' : name.toLowerCase() === 'kusama' ? 'kusama' : 'westend',
    registry: {},
    specVersion: 0,
    ss58Format: name.toLowerCase() === 'polkadot' ? 0 : name.toLowerCase() === 'kusama' ? 2 : 42,
    tokenDecimals: 15,
    tokenSymbol: name.toLowerCase() === 'polkadot' ? 'Dot' : name.toLowerCase() === 'kusama' ? 'Ksm' : 'Wnd'
  };
};

export const convictions = [
  {
    text: '0.1x voting balance, no lockup period',
    value: 0
  },
  {
    text: '1x voting balance, locked for 1x enactment (8.00 days)',
    value: 1
  },
  {
    text: '2x voting balance, locked for 2x enactment (16.00 days)',
    value: 2
  },
  {
    text: '3x voting balance, locked for 4x enactment (32.00 days)',
    value: 3
  },
  {
    text: '4x voting balance, locked for 8x enactment (64.00 days)',
    value: 4
  },
  {
    text: '5x voting balance, locked for 16x enactment (128.00 days)',
    value: 5
  },
  {
    text: '6x voting balance, locked for 32x enactment (256.00 days)',
    value: 6
  }
];

export const rebagFalse: RebagInfo = {
  currentBagThreshold: '4.5087 WND',
  shouldRebag: false
};

export const rebagTrue: RebagInfo = {
  currentBagThreshold: '4.5087 WND',
  shouldRebag: true
};

export const putInFront: PutInFrontInfo = {
  lighter: accounts[0].address,
  shouldPutInFront: true
};
export const state = ['stakeAuto', 'stakeManual', 'stakeKeepNominated', 'changeValidators', 'setNominees', 'unstake', 'withdrawUnbound', 'stopNominating', 'tuneUp', 'withdrawClaimable', 'bondExtraRewards', 'bondExtra', 'createPool', 'joinPool', 'editPool'];

export const poolStakingConst: PoolStakingConsts | undefined = {
  lastPoolId: new BN('30'),
  maxPoolMembers: 524288,
  maxPoolMembersPerPool: -1,
  maxPools: 512,
  minCreateBond: new BN('1010000000000'),
  minCreationBond: new BN('1000000000000'),
  minJoinBond: new BN('100000000000'),
  minNominatorBond: new BN('10817536')
};

export const pool = (states = '', nameEdited = false, rolesEdited = false): MyPoolInfo => {
  return {
    accounts: {
      rewardId: '5EYCAe5ijiYfAXEth5DXrWyDFTVKxJeJ5YA8VanQUrFZT3za',
      stashId: '5EYCAe5ijiYfAXEth5DG7VRd8xp8VkYRLsDcwe6a22NqBKJs'
    },
    bondedPool: {
      points: 13195788507322,
      state: ['bondExtra', 'joinPool', 'bondExtraRewards', 'withdrawClaimable', 'open'].includes(states) ? 'Open' : states === 'block' ? 'blocked' : 'Destroying',
      memberCounter: ['bondExtra', 'joinPool'].includes(states) ? 12 : 0,
      roles: {
        depositor: '5Cqq9GQEV2UdRKdZo2FkKmmBU2ZyxJWYrEpwnqemgyfTZ1ZD',
        root: !rolesEdited ? '5Cqq9GQEV2UdRKdZo2FkKmmBU2ZyxJWYrEpwnqemgyfTZ1ZD' : '5DaBEgUMNUto9krwGDzXfSAWcMTxxv7Xtst4Yjpq9nJue7tm',
        nominator: !rolesEdited ? '5Cqq9GQEV2UdRKdZo2FkKmmBU2ZyxJWYrEpwnqemgyfTZ1ZD' : '5DaBEgUMNUto9krwGDzXfSAWcMTxxv7Xtst4Yjpq9nJue7tm',
        stateToggler: !rolesEdited ? '5Cqq9GQEV2UdRKdZo2FkKmmBU2ZyxJWYrEpwnqemgyfTZ1ZD' : '5DaBEgUMNUto9krwGDzXfSAWcMTxxv7Xtst4Yjpq9nJue7tm'
      }
    },
    ledger: {
      stash: '5EYCAe5ijiYfAXEth5DG7VRd8xp8VkYRLsDcwe6a22NqBKJs',
      total: 13695788507322,
      active: 13695788507322,
      unlocking: states === ''
        ? [
          {
            value: 400000000000,
            era: 5194
          },
          {
            value: 100000000000,
            era: 5206
          }
        ]
        : [],
      claimedRewards: [
        5085,
        5086,
        5087,
        5088,
        5089,
        5090,
        5091,
        5092,
        5093,
        5094,
        5095,
        5096,
        5097,
        5098,
        5099,
        5100,
        5101,
        5102,
        5103,
        5104,
        5105,
        5106,
        5107,
        5108,
        5109,
        5110,
        5111,
        5112,
        5113,
        5114,
        5115,
        5116,
        5117,
        5118,
        5119,
        5120,
        5121,
        5122,
        5123,
        5124,
        5125,
        5126,
        5127,
        5128,
        5129,
        5130,
        5131,
        5132,
        5133,
        5134,
        5135,
        5136,
        5137,
        5138,
        5139,
        5140,
        5141,
        5142,
        5143,
        5144,
        5145,
        5146,
        5147,
        5148,
        5149,
        5150,
        5151,
        5152,
        5153,
        5154,
        5155,
        5156,
        5157,
        5158,
        5159,
        5160,
        5161,
        5162,
        5163,
        5164,
        5165,
        5166,
        5167,
        5168
      ]
    },
    member: {
      points: states === 'joinPool' ? 0 : 1267100000000,
      poolId: new BN('6'),
      rewardPoolTotalEarnings: 0,
      unbondingEras: {
        '5194': new BN('400000000000'),
        '5206': new BN('100000000000')
      }
    },
    metadata: !nameEdited ? 'Polkadot js plus' : 'Polkadot js plus ❤',
    myClaimable: new BN('16844370676'),
    poolId: new BN('6'),
    redeemable: new BN('500000000000'),
    rewardClaimable: new BN('523506206240'),
    rewardIdBalance: {
      feeFrozen: 0,
      free: 24405639157,
      miscFrozen: 0,
      reserved: 0
    },
    rewardPool: ['bondExtra', 'joinPool', 'bondExtraRewards', 'open'].includes(states)
      ? {
        balance: '269378329919',
        points: '3959162288463855089412904',
        totalEarnings: '1031972446337'
      }
      : null,
    stashIdAccount: {
      accountId: '5EYCAe5ijiYfAXEth5DG7VRd8xp8VkYRLsDcwe6a22NqBKJs',
      controllerId: '5EYCAe5ijiYfAXEth5DG7VRd8xp8VkYRLsDcwe6a22NqBKJs',
      exposure: {
        others: [],
        own: 0,
        total: 0
      },
      nextSessionIds: [],
      nominators: [
        '5CFPcUJgYgWryPaV1aYjSbTpbTLu42V32Ytw1L9rfoMAsfGh',
        '5CFPqoTU7fiUp1JJNbfcY2z6yavEBKDPQGg4SGeG3Fm7vCsg',
        '5GYaYNVq6e855t5hVCyk4Wuqssaf6ADTrvdPZ3QXyHvFXTip'
      ],
      redeemable: '0x00000000000000000000000000000000',
      rewardDestination: {
        account: '5EYCAe5ijiYfAXEth5DXrWyDFTVKxJeJ5YA8VanQUrFZT3za'
      },
      sessionIds: [],
      stakingLedger: {
        active: 13195788507322,
        claimedRewards: [
          5085,
          5086,
          5087,
          5088,
          5089,
          5090,
          5091,
          5092,
          5093,
          5094,
          5095,
          5096,
          5097,
          5098,
          5099,
          5100,
          5101,
          5102,
          5103,
          5104,
          5105,
          5106,
          5107,
          5108,
          5109,
          5110,
          5111,
          5112,
          5113,
          5114,
          5115,
          5116,
          5117,
          5118,
          5119,
          5120,
          5121,
          5122,
          5123,
          5124,
          5125,
          5126,
          5127,
          5128,
          5129,
          5130,
          5131,
          5132,
          5133,
          5134,
          5135,
          5136,
          5137,
          5138,
          5139,
          5140,
          5141,
          5142,
          5143,
          5144,
          5145,
          5146,
          5147,
          5148,
          5149,
          5150,
          5151,
          5152,
          5153,
          5154,
          5155,
          5156,
          5157,
          5158,
          5159,
          5160,
          5161,
          5162,
          5163,
          5164,
          5165,
          5166,
          5167,
          5168
        ],
        stash: '5EYCAe5ijiYfAXEth5DG7VRd8xp8VkYRLsDcwe6a22NqBKJs',
        total: 13695788507322,
        unlocking: states === ''
          ? [
            {
              value: 400000000000,
              era: 5194
            },
            {
              value: 100000000000,
              era: 5206
            }
          ]
          : []
      },
      stashId: '5EYCAe5ijiYfAXEth5DG7VRd8xp8VkYRLsDcwe6a22NqBKJs',
      validatorPrefs: {
        blocked: false,
        commission: 0
      }
    }
  };
};

export const poolsMembers: MembersMapEntry[] | undefined = {
  1: [
    {
      accountId: 'FaJi8E1WkeGDR7f79SyburcAkzh78X587diwWhKezDxn1p8',
      member: {
        poolId: 1,
        points: 35000000000000,
        rewardPoolTotalEarnings: 300374601212,
        unbondingEras: {}
      }
    },
    {
      accountId: 'JEdyd5VqxSUfNLNTZDtwPCt1xQejYqLV26DDYctctKWEKvs',
      member: {
        poolId: 1,
        points: 82000000000000,
        rewardPoolTotalEarnings: 312152374258,
        unbondingEras: {}
      }
    },
    {
      accountId: 'CrYym7rgcJfz82bUS2RT1LKS5FUSCr3kVtdAVExKd5rPpCd',
      member: {
        poolId: 1,
        points: 5000000000000,
        rewardPoolTotalEarnings: 50262907218,
        unbondingEras: {}
      }
    },
    {
      accountId: 'HTp224TrbWTGnpTfGkT5iC89jev42Bku2VC39U8mjxhkB3p',
      member: {
        poolId: 1,
        points: 60000000000000,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {}
      }
    },
    {
      accountId: 'E8a4iJyDLd2ZysHt4bWfg5VG3RwNfHqSZtkyt5SPNJpmYoq',
      member: {
        poolId: 1,
        points: 1000000000000,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {}
      }
    }
  ],
  2: [
    {
      accountId: 'EFQ1wXD4X1KvV68Ks9VsM2XEjrGZhZo14sjSLQndCTgTRrU',
      member: {
        poolId: 2,
        points: 2000000000000,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {}
      }
    },
    {
      accountId: 'FCWfkDNp5hUivm3rVXEmzSnaV41Y5HHfR5nyQthdJ7oZjvL',
      member: {
        poolId: 2,
        points: 1030000000000,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {}
      }
    },
    {
      accountId: 'GWw9zEkgeNd22pu28aJug3XhxxTpSWEU6C19rxjsuSgepTX',
      member: {
        poolId: 2,
        points: 1980000000000,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {}
      }
    }
  ],
  3: [
    {
      accountId: 'GypsNbingCkj1hovE5j1Nn7DLu53LMgHLDeddbVnCC3k1EN',
      member: {
        poolId: 3,
        points: 20000000000000,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {}
      }
    },
    {
      accountId: 'FnrX4nNyMpf94hfRK7J9ftkWjoEhAmk2iokho3oKni5ABF4',
      member: {
        poolId: 3,
        points: 2900000000000,
        rewardPoolTotalEarnings: 118866667426,
        unbondingEras: {}
      }
    },
    {
      accountId: 'GoM9FsSX959SAEvAYQm8mNAh5LsUpGWhktKNfDMDZMsYoqj',
      member: {
        poolId: 3,
        points: 1000000000000,
        rewardPoolTotalEarnings: 91388746411,
        unbondingEras: {}
      }
    }
  ],
  4: [
    {
      accountId: 'DB7TcWBFPHLRNvY35NktNWh17iXv26a2kX7usZxo35dJDSs',
      member: {
        poolId: 4,
        points: 0,
        rewardPoolTotalEarnings: 1407446973,
        unbondingEras: {
          3804: 100000000000
        }
      }
    },
    {
      accountId: 'G22hF2a8NDjQc9M1XXL9uf6juPU8Nr9Ddsjzeq9fqKUgr9X',
      member: {
        poolId: 4,
        points: 1000000000000,
        rewardPoolTotalEarnings: 9812864396,
        unbondingEras: {}
      }
    },
    {
      accountId: 'HL8bEp8YicBdrUmJocCAWVLKUaR2dd1y6jnD934pbre3un1',
      member: {
        poolId: 4,
        points: 5000000000000,
        rewardPoolTotalEarnings: 107670134800,
        unbondingEras: {}
      }
    }
  ],
  5: [
    {
      accountId: 'DE1QQkVPp8XVksN4v6qnQYWUjMBBrPGLkHtHM4zZ8N9Vmoc',
      member: {
        poolId: 5,
        points: 1000000000000,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {}
      }
    },
    {
      accountId: 'GcDZZCVPwkPqoWxx8vfLb4Yfpz9yQ1f4XEyqngSH8ygsL9p',
      member: {
        poolId: 5,
        points: 0,
        rewardPoolTotalEarnings: 0,
        unbondingEras: {
          3801: 50000000000000
        }
      }
    }
  ]
};

export const poolsInfo: PoolInfo[] = [
  {
    bondedPool: {
      points: 81151449765707,
      state: 'Open',
      memberCounter: 12,
      roles: {
        depositor: '5DiHoyQWyP4aW6PcHoY6djTPT9B7Cy5ZqDfMxnBKUhFv9FKy',
        root: '5DiHoyQWyP4aW6PcHoY6djTPT9B7Cy5ZqDfMxnBKUhFv9FKy',
        nominator: '5DiHoyQWyP4aW6PcHoY6djTPT9B7Cy5ZqDfMxnBKUhFv9FKy',
        stateToggler: '5DiHoyQWyP4aW6PcHoY6djTPT9B7Cy5ZqDfMxnBKUhFv9FKy'
      }
    },
    metadata: 'FIRST POOL',
    poolId: new BN('01'),
    rewardPool: {
      balance: 549515523642,
      totalEarnings: 866142815559,
      points: '0x0000000000000000000000000000000000000000001451e512e007bb6c0f02a8'
    }
  },
  {
    bondedPool: {
      points: 71151449765707,
      state: 'Open',
      memberCounter: 1,
      roles: {
        depositor: '5Gp8ykxb8wubVjfi4cEcb6zUC1uiDVtFPhyggNXHKMoiKzdU',
        root: '5Gp8ykxb8wubVjfi4cEcb6zUC1uiDVtFPhyggNXHKMoiKzdU',
        nominator: '5Gp8ykxb8wubVjfi4cEcb6zUC1uiDVtFPhyggNXHKMoiKzdU',
        stateToggler: '5Gp8ykxb8wubVjfi4cEcb6zUC1uiDVtFPhyggNXHKMoiKzdU'
      }
    },
    metadata: 'super pool',
    poolId: new BN('02'),
    rewardPool: {
      balance: 0,
      totalEarnings: 0,
      points: 0
    }
  },
  {
    bondedPool: {
      points: 61151449765707,
      state: 'Destroying',
      memberCounter: 3,
      roles: {
        depositor: '5FUDdxaaZfye6ogJgqHh3Usqd6WN6q8aApFH4XNjU9iDvC49',
        root: '5FUDdxaaZfye6ogJgqHh3Usqd6WN6q8aApFH4XNjU9iDvC49',
        nominator: '5FUDdxaaZfye6ogJgqHh3Usqd6WN6q8aApFH4XNjU9iDvC49',
        stateToggler: '5FUDdxaaZfye6ogJgqHh3Usqd6WN6q8aApFH4XNjU9iDvC49'
      }
    },
    metadata: 'I AM THE FIRST POOL ',
    poolId: new BN('03'),
    rewardPool: {
      balance: 1158933840359,
      totalEarnings: 2501461741151,
      points: '0x000000000000000000000000000000000000000003c0909d3ba099d67aad8000'
    }
  },
  {
    bondedPool: {
      points: 51151449765707,
      state: 'Open',
      memberCounter: 1,
      roles: {
        depositor: '5EWNeodpcQ6iYibJ3jmWVe85nsok1EDG8Kk3aFg8ZzpfY1qX',
        root: '5EWNeodpcQ6iYibJ3jmWVe85nsok1EDG8Kk3aFg8ZzpfY1qX',
        nominator: '5EWNeodpcQ6iYibJ3jmWVe85nsok1EDG8Kk3aFg8ZzpfY1qX',
        stateToggler: '5EWNeodpcQ6iYibJ3jmWVe85nsok1EDG8Kk3aFg8ZzpfY1qX'
      }
    },
    metadata: 'Ape Yacht Club’s Pool',
    poolId: new BN('04'),
    rewardPool: {
      balance: 0,
      totalEarnings: 0,
      points: 0
    }
  },
  {
    bondedPool: {
      points: 11514497657073,
      state: 'Open',
      memberCounter: 3,
      roles: {
        depositor: '5HeAYjXFNWrGmTnH35CuivoExNLFrHoeWf5CaQTWHM5qPxRW',
        root: '5HeAYjXFNWrGmTnH35CuivoExNLFrHoeWf5CaQTWHM5qPxRW',
        nominator: '5HeAYjXFNWrGmTnH35CuivoExNLFrHoeWf5CaQTWHM5qPxRW',
        stateToggler: '5HeAYjXFNWrGmTnH35CuivoExNLFrHoeWf5CaQTWHM5qPxRW'
      }
    },
    metadata: 'Just playing',
    poolId: new BN('05'),
    rewardPool: {
      balance: 2715491290,
      totalEarnings: 1151449765707,
      points: '0x00000000000000000000000000000000000000000000260aa24ccbcd9fefd000'
    }
  },
  {
    bondedPool: {
      points: 91151449765707,
      state: 'Open',
      memberCounter: 28,
      roles: {
        depositor: '5DRbuYvzokyX7X4QDxrk1BNRxYS6NP4V9CHiciPXdTe2vT4Z',
        root: '5DRbuYvzokyX7X4QDxrk1BNRxYS6NP4V9CHiciPXdTe2vT4Z',
        nominator: '5DRbuYvzokyX7X4QDxrk1BNRxYS6NP4V9CHiciPXdTe2vT4Z',
        stateToggler: '5FnDqyWepbvAynavU2TVScCscsPmorsv2TFqDYokseGoncmE'
      }
    },
    metadata: 'Polkadot js plus ❤️ | http://polkadotjs.plus',
    poolId: new BN('06'),
    rewardPool: {
      balance: 433614924637,
      totalEarnings: 1646342430175,
      points: '0x00000000000000000000000000000000000000000004f3c69e46247c9d281e14'
    }
  }
];
