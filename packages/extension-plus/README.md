
# ![polkadot{.js} plus extension](docs/logo.jpg)

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

## Installation (Development version)

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

## How To's

