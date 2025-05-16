/* eslint-disable no-undef */
import { CryptoApi } from '@perfood/capacitor-crypto-api';

const API_URL = 'https://localhost:3001';

/**
 * Loads the ECDSA key-pair tags.
 */
window.getECDSATags = async () => {
  console.log('getECDSATags');
  const result = await CryptoApi.getECDSATags();
  document.getElementById('ECDSATags').textContent = JSON.stringify(result.tags);
};

/**
 * Creates a ECDSA key pair for the tag.
 */
window.createECDSAKeyPair = async () => {
  console.log('createECDSAKeyPair');
  const tag = document.getElementById('ecdsa-tag').value;

  if (!tag) {
    alert('Please enter a tag.');
    return;
  }

  const key = await CryptoApi.generateKey({
    tag,
    algorithm: 'ecdsa',
  });
  document.getElementById('ecdsa-public-key').textContent = key.publicKey;
};

/**
 * Registers the public key for the tag in the api.
 */
window.registerECDSAPublicKey = async () => {
  console.log('registerECDSAPublicKey');
  const tag = document.getElementById('ecdsa-tag').value;
  const publicKey = document.getElementById('ecdsa-public-key').textContent;

  if (!tag || !publicKey) {
    return;
  }

  fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tag,
      publicKey,
    }),
  })
    .then((response) => (response.ok ? response.json() : Promise.reject(response)))
    .then((data) => {
      document.getElementById('ecdsa-registered').textContent = data.success ? 'registered' : 'not registered';
    })
    .catch((error) => {
      document.getElementById('ecdsa-registered').textContent = error.statusText || error;
    });
};

/**
 * Gets a challenge for the tag from the api.
 */
window.getECDSAChallenge = async () => {
  console.log('getECDSAChallenge');
  const tag = document.getElementById('ecdsa-tag').value;

  if (!tag) {
    alert('Please enter a tag.');
    return;
  }

  fetch(`${API_URL}/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tag,
    }),
  })
    .then((response) => (response.ok ? response.json() : Promise.reject(response)))
    .then((data) => {
      document.getElementById('ecdsa-challenge').value = data.challenge;
    })
    .catch((error) => {
      document.getElementById('ecdsa-challenge').value = error.statusText || error;
    });
};

/**
 * Signs the challenge with the tag.
 */
window.signECDSA = async () => {
  console.log('signECDSA');
  const tag = document.getElementById('ecdsa-tag').value;
  const challenge = document.getElementById('ecdsa-challenge').value;

  if (!tag || !challenge) {
    alert('Please enter a tag and a challenge');
    return;
  }

  const signature = await CryptoApi.sign({
    tag,
    data: challenge,
  });
  document.getElementById('ecdsa-signature').value = signature.signature;
};

/**
 * Copies the own ECDSA public key to the foreign public key field.
 */
window.copyOwnECDSAPublicKey = async () => {
  console.log('copyOwnECDSAPublicKey');
  const publicKey = document.getElementById('ecdsa-public-key').textContent;

  if (!publicKey) {
    alert('Please create a key pair first.');
    return;
  }

  document.getElementById('ecdsa-foreign-public-key').value = publicKey;
};

/**
 * Verifies the signature for the challenge locally.
 */
window.verifyECDSALocal = async () => {
  console.log('verifyECDSALocal');
  const foreignPublicKey = document.getElementById('ecdsa-foreign-public-key').value;
  const challenge = document.getElementById('ecdsa-challenge').value;
  const signature = document.getElementById('ecdsa-signature').value;

  if (!foreignPublicKey || !challenge || !signature) {
    alert('A foreign public key, challenge and signature are required.');
    return;
  }

  try {
    const verify = await CryptoApi.verify({
      foreignPublicKey,
      data: challenge,
      signature,
    });
    document.getElementById('ecdsa-verified-local').textContent = verify.verified;
  } catch (error) {
    document.getElementById('ecdsa-verified-local').textContent = error.statusText || error;
  }
};

/**
 * Verifies the signature for the challenge with the server.
 */
window.verifyECDSAServer = async () => {
  console.log('verifyECDSAServer');
  const challenge = document.getElementById('ecdsa-challenge').value;
  const signature = document.getElementById('ecdsa-signature').value;

  if (!challenge || !signature) {
    alert('A challenge and signature are required.');
    return;
  }

  fetch(`${API_URL}/response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      challenge,
      signature,
    }),
  })
    .then((response) => (response.ok ? response.json() : Promise.reject(response)))
    .then((data) => {
      document.getElementById('ecdsa-verified-server').textContent = data.verified;
    })
    .catch((error) => {
      document.getElementById('ecdsa-verified-server').textContent = error.statusText || error;
    });
};

/**
 * Loads the ECDSA key-pair tags.
 */
window.getECDHTags = async () => {
  console.log('getECDHTags');
  const result = await CryptoApi.getECDHTags();
  document.getElementById('ECDHTags').textContent = JSON.stringify(result.tags);
};

/**
 * Creates a ECDH key pair for the tag.
 */
window.createECDHKeyPair = async () => {
  console.log('createECDHKeyPair');
  const tag = document.getElementById('ecdh-tag').value;

  if (!tag) {
    alert('Please enter a tag.');
    return;
  }

  const key = await CryptoApi.generateKey({
    tag,
    algorithm: 'ecdh',
  });
  document.getElementById('ecdh-public-key').textContent = key.publicKey;
};

/**
 * Copies the own ECDH public key to the foreign public key field.
 */
window.copyOwnECDHPublicKey = async () => {
  console.log('copyOwnECDHPublicKey');
  const publicKey = document.getElementById('ecdh-public-key').textContent;

  if (!publicKey) {
    alert('Please create a key pair first.');
    return;
  }

  document.getElementById('ecdh-foreign-public-key').value = publicKey;
};

/**
 * Encrypt a text.
 */
window.encryptECDH = async () => {
  console.log('encryptECDH');
  const tag = document.getElementById('ecdh-tag').value;
  const foreignPublicKey = document.getElementById('ecdh-foreign-public-key').value;
  const plaintext = document.getElementById('ecdh-plaintext').value;

  if (!tag || !foreignPublicKey || !plaintext) {
    alert('Please enter a tag, a text to encrypt and the foreign public key.');
    return;
  }

  const result = await CryptoApi.encrypt({
    tag,
    foreignPublicKey,
    plaintext,
  });

  document.getElementById('ecdh-iv').value = result.iv;
  document.getElementById('ecdh-encrypted-data').value = result.encryptedData;
};

/**
 * Decrypt a text.
 */
window.decryptECDH = async () => {
  console.log('decryptECDH');
  const tag = document.getElementById('ecdh-tag').value;
  const foreignPublicKey = document.getElementById('ecdh-foreign-public-key').value;
  const iv = document.getElementById('ecdh-iv').value;
  const encryptedData = document.getElementById('ecdh-encrypted-data').value;

  if (!tag || !foreignPublicKey || !iv || !encryptedData) {
    alert('Please enter a tag, encrypt a text and copy the foreign public key.');
    return;
  }

  try {
    const result = await CryptoApi.decrypt({
      tag,
      foreignPublicKey,
      iv,
      encryptedData,
    });

    document.getElementById('ecdh-decrypted-data').textContent = result.plaintext;
  } catch (error) {
    console.error(error);
    document.getElementById('ecdh-decrypted-data').textContent = error.statusText || error;
  }
};
