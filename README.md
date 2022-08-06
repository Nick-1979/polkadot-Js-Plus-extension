
# ![polkadot{.js} plus extension](https://raw.githubusercontent.com/Nick-1979/PolkadotJsPlusPictures/main/Title.png)

A user-friendly wallet to interact with the Polkadot/Substrate based blockchains through a browser. It allows users to access their Polkadot/Kusama ecosystem account(s), which can also be used to interact with decentralized apps. It is based on polkadot js extension, which injects a [@polkadot/api](https://github.com/polkadot-js/api) signer into a page, along with any associated accounts.

Polkadot js Plus extension not only has all the abilities of the original Polkadot extension, but also many new functionalities as listed below are available, where more features are coming.

## New functionalities

Currently, the following features are available:
  - View balances (crypto/USD)
  - Transfer funds
  - View transaction history
  - View an address as QR code
  - Easy staking (Solo and Pool Staking)
  - Crowdloans (View Auctions and contribute to Crowdloans)
  - Governance (vote referendums, second proposals, vote/unvote councils, propose treasury proposals and tips, etc.)
  

# ![polkadot{.js} plus extension intro](packages/extension-plus/docs/intro.png)

### More photos [wiki](https://github.com/Nick-1979/polkadot-Js-Plus-extension/wiki/How-To's)


## Installation 

### Add-on

The extension for firefox can be downloaded from [here](https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-plus-extension/)


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


### Testing

* To run unit tests, first install dependencies using `yarn` then use: `yarn test:plus`

* Test on Westend blockchain:

   - It is possible via the provided [add-on](https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-plus-extension/). To receive some westies (Westend's native token) for a created account use [Westend Faucet](https://matrix.to/#/#westend_faucet:matrix.org)

   - Or build the extension on your own, but it needs to append the following Westend network info to './node_modules/@substrate/ss58-registry/esm/index.js') before build:

     `{
		"prefix": 42,
		"network": "westend",
		"displayName": "Westend",
		"symbols": [
			"WND"
		],
		"decimals": [
			12
		],
		"standardAccount": "*25519",
		"website": "https://polkadot.network"
	}`


## More information 

for more information about the extension and how it worsk, please go to the project [wiki](https://github.com/Nick-1979/polkadot-Js-Plus-extension/wiki) 

<!-- ## To support 


<img src="./packages/extension-plus/docs/logos/dot.svg" width="20" />  17VdcY2F3WvhSLFHBGZreubzQNQ3NZzLbQsugGzHmzzprSG

<img src="./packages/extension-plus/docs/logos/ksm.svg" width="20" />  Cgp9bcq1dGP1Z9B6F2ccTSTHNez9jq2iUX993ZbDVByPSU2 -->
