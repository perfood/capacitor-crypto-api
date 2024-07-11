import { CryptoApi } from '@perfood/capacitor-crypto-api';

const API_URL = 'https://localhost:3001';

/**
 * Creates a key pair for the tag.
 */
window.createKeyPair = async () => {
  console.log('createKeyPair');
  const tag = document.getElementById('tag').value;

  if (!tag) {
    alert('Please enter a tag.');
    return;
  }

  const key = await CryptoApi.generateKey({
    tag,
  });
  document.getElementById('publicKey').textContent = key.publicKey;
};

/**
 * Registers the public key for the tag in the api.
 */
window.registerPublicKey = async () => {
  console.log('registerPublicKey');
  const tag = document.getElementById('tag').value;
  const publicKey = document.getElementById('publicKey').textContent;

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
    .then(response =>
      response.ok ? response.json() : Promise.reject(response),
    )
    .then(data => {
      document.getElementById('registered').textContent = data.success
        ? 'registered'
        : 'not registered';
    })
    .catch(error => {
      document.getElementById('registered').textContent =
        error.statusText || error;
    });
};

/**
 * Gets a challenge for the tag from the api.
 */
window.getChallenge = async () => {
  console.log('getChallenge');
  const tag = document.getElementById('tag').value;

  if (!tag) {
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
    .then(response =>
      response.ok ? response.json() : Promise.reject(response),
    )
    .then(data => {
      document.getElementById('challenge').value = data.challenge;
    })
    .catch(error => {
      document.getElementById('challenge').value = error.statusText || error;
    });
};

/**
 * Signs the challenge with the tag.
 */
window.sign = async () => {
  console.log('sign');
  const tag = document.getElementById('tag').value;
  const challenge = document.getElementById('challenge').value;

  const signature = await CryptoApi.sign({
    tag,
    data: challenge,
  });
  document.getElementById('signature').textContent = signature.signature;
};

/**
 * Verifies the signature for the challenge locally and with the api.
 */
window.verify = async () => {
  console.log('verify');
  const tag = document.getElementById('tag').value;
  const challenge = document.getElementById('challenge').value;
  const signature = document.getElementById('signature').textContent;

  if (!tag || !challenge || !signature) {
    return;
  }

  const key = await CryptoApi.loadKey({
    tag,
  });

  // Verify locally.
  const valid = await CryptoApi.verify({
    foreignPublicKey: key.publicKey,
    data: challenge,
    signature,
  });
  document.getElementById('verifiedLocal').textContent = valid;

  // Verify with the api.
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
    .then(response =>
      response.ok ? response.json() : Promise.reject(response),
    )
    .then(data => {
      document.getElementById('verifiedServer').textContent = data.valid;
    })
    .catch(error => {
      document.getElementById('verifiedServer').textContent =
        error.statusText || error;
    });
};
