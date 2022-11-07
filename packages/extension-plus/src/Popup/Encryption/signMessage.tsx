// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

useEffect(() => {

    const message = 'Salam 123 kami jo0n'

    const senderAddress = '5FCDdXBYSEJxaKnfDdJyic3VGS3amZx2pWvyr3k7S8RWgVRq';
    const senderPublicKey = decodeAddress(senderAddress);
    const senderPublicKeySr = new createPair({ encodeAddress, type: 'sr25519' }, { publicKey: senderPublicKey });
    const sender = keyring.getPair(senderAddress);
    const senderPassword = 'Kami,12*';
    sender.unlock(senderPassword);

    const receiverAddress = '5DRbuYvzokyX7X4QDxrk1BNRxYS6NP4V9CHiciPXdTe2vT4Z';
    const receiverPublicKey = decodeAddress(receiverAddress);
    const receiverPublicKeySr = new createPair({ encodeAddress, type: 'sr25519' }, { publicKey: receiverPublicKey });
    const receiver = keyring.getPair(receiverAddress);
    const receiverPassword = 'Kami,12*';
    receiver.unlock(receiverPassword);


    const encryptedMessage = sender.encryptMessage(message, receiverPublicKeySr.getPublicKeys()[0]);
    console.log('encryptedMesssage', encryptedMessage);

    const decryptedMessage = receiver.decryptMessage(encryptedMessage, senderPublicKeySr.getPublicKeys()[0]);
    console.log('decryptedMessage ', decryptedMessage);

    const decrypteText = Array.from(decryptedMessage).map((val) => String.fromCharCode(val)).join('');
    console.log('decrypteText is ', decrypteText);
  }, []);