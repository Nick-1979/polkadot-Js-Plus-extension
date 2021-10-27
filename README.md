
# ![polkadot{.js} plus extension](docs/logo.jpg)

A user-friendly wallet to interact with the Polkadot/substrate blockchain through a browser. It allows users to access their Polkadot account(s), which can also be used to interact with decentralized apps.

It is based on polkadot js extension, which injects a [@polkadot/api](https://github.com/polkadot-js/api) Signer into a page, along with any associated accounts.

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

## How Tos

Accounts page, shows the list of all accounts an their balances which you have created/imported on polkadot/kusama blockchain and parachains.

![accounts page screenshot](docs/pjp/accountsPage.PNG)

Transfering funds with the extention, first add a recepient, you can even choose recepient from you own accounts list to transfer between your accounts:

![add recepient page screenshot](docs/pjp/addRecepiet.PNG)

Choosing the amount you want to transfer, extension shows appropriate alerts based on your selected amount. Click on Safe Max to withdraw all from your account while still keep your account active.

![transfer funds page screenshot](docs/pjp/transferFunds.PNG)

In transaction confirmation page, confirm the transaction to broadcast it on the blockchain by entering your sending account password.

![confirm transaction page screenshot](docs/pjp/confirmTransaction.PNG)

After a little while, depend on the network response time, transaction will be done and you see the following page and your balance(s) will be updated.

![transaction done page screenshot](docs/pjp/transactionDone.PNG)

Transaction histroy can be seen from the account page, which shows the transaction details, status, the failure reason  if transaction is failed, and a link to subscan for more info.

![transaction history page screenshot](docs/pjp/transactionHistory.PNG)

Entering crypto address is error prone, hence use QR code to be scanned by camera is useful.

![Address QR code page screenshot](docs/pjp/addressQrCode.PNG)


