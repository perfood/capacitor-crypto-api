import { CryptoApi } from '@perfood/capacitor-crypto-api';

window.registerTag = async () => {
  const inputValue = document.getElementById('registerTag').value;
  
  // generate a private key for given tag, and also the public key
  const key = await CryptoApi.generateKey({
    tag: inputValue,
    algorithm: 'ECDSA',
  });

  // associate the public key with the tag on the server
  await fetch('https://localhost:3001/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tag: inputValue,
      publicKey: key.publicKey,
    }),
  })
  .then(response => response.ok ? response.json() : Promise.reject(response))
  .then(async (data) => {
    document.getElementById('publicKey').textContent = key.publicKey;
  });
};

window.testSignVerify = async () => {
  const inputValue = document.getElementById('signVerifyInput').value;
  const verifySignature = document.getElementById('verifySignature');
  const status = document.getElementById('verifyStatus');

  // create a random
  const random = crypto.randomUUID();

  // sign the random
  try {
    const signature = await CryptoApi.sign({
      tag: inputValue,
      data: random,
    });

    verifySignature.textContent = signature.signature;
    
    fetch('https://localhost:3001/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag: inputValue,
        signed: signature,
        random
      }),
    })
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then(async (data) => {
      status.textContent = data.valid ? 'Valid' : 'Invalid';
    })
    .catch(error => {
      verifySignature.textContent = '';
      status.textContent = error.statusText;
    });
  } catch (error) {
    verifySignature.textContent = '';
    status.textContent = error;
  }
};