
# ![polkadot{.js} plus extension](packages/extension-plus/docs/logo.jpg)

A user-friendly wallet to interact with the Polkadot/Substrate based blockchains through a browser. It allows users to access their Polkadot account(s), which can also be used to interact with decentralized apps.

It is based on polkadot js extension, which injects a [@polkadot/api](https://github.com/polkadot-js/api) signer into a page, along with any associated accounts.

Polkadot js plus extension is actually the original polkadot js extension, plus some new functionalities.

## New functinalities

Currently, the following features are added:
  - View balances
  - Transfer funds
  - View an address as QR code
  - Staking / unstaking / redeem funds and edit nominated validator list
  - Contribute in crowdloans

## Installation 

### Add-on

The beta version of Plus extension for firefox can be downloaded from [here](https://www.dropbox.com/s/fxb7pct4g8vjjhc/plus-0.1.xpi?dl=0)
 - open downloaded file with firefox


### Development version

Steps to build the extension and view your changes in a browser:

1. Build via `yarn build` or `yarn watch`
2. Install the extension
  - Chrome:
    - go to `chrome://extensions/`
    - ensure you have the Development flag set
    - "Load unpacked" and point to `packages/extension/build`
    - if developing, after making changes - refresh the extension
  - Firefox:
    - go to `about:debugging#addons`
    - check "Enable add-on debugging"
    - click on "Load Temporary Add-on" and point to `packages/extension/build/manifest.json`
    - if developing, after making changes - reload the extension


Once added, you can create an account (via a generated seed) or import via an existing seed.

#### To test on westend:

1- add genesis of wetend to '@polkadot/networks/genesis.js':

    westend:['0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e'] 


2- add network info of westend to '@polkadot/networks/substrate.js':

 {
    decimals: [12],
    displayName: 'Westend', 
    network: 'westend',
    prefix: 42,
    standardAccount: '*25519',
    symbols: ['WND'],
    website: 'https://polkadot.network'
  }



## More information 

for more information about the extension and how it worsk, please go to the wiki page [here](https://github.com/Nick-1979/polkadot-Js-Plus-extension/wiki) 







