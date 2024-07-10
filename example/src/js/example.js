import { CryptoApi } from '@perfood/capacitor-crypto-api';

const window = globalThis.window;

window.createKeyPair = async () => {
  window.console.log('createKeyPair');
  const tag = window.document.getElementById('tag').value;

  if(!tag) {
    return;
  }

  const key = await CryptoApi.generateKey({
    tag,
    algorithm: 'ECDSA',
  });

  window.document.getElementById('publicKey').textContent = key.publicKey;
};

window.registerPublicKey = async () => {
  window.console.log('registerPublicKey');
  const tag = window.document.getElementById('tag').value;
  const publicKey = window.document.getElementById('publicKey').textContent;

  await window
    .fetch('https://localhost:3001/register', {
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
    .then(async data => {
      window.document.getElementById('registered').textContent = 'registered';
    });
};

window.createRandomData = async () => {
  window.console.log('createRandomData');
  window.document.getElementById('data').value = window.crypto.randomUUID();
};

window.sign = async () => {
  window.console.log('sign');
  const tag = window.document.getElementById('tag').value;
  const data = window.document.getElementById('data').value;

  const signature = await CryptoApi.sign({
    tag,
    data,
  });

  window.document.getElementById('signature').textContent = signature.signature;
};

window.verify = async () => {
  window.console.log('verify');
  const tag = window.document.getElementById('tag').value;
  const data = window.document.getElementById('data').value;
  const signature = window.document.getElementById('signature').textContent;

  const key = await CryptoApi.loadKey({
    tag,
  });

  const valid = await CryptoApi.verify({
    foreignPublicKey: key.publicKey,
    data,
    signature,
  });

  window.document.getElementById('verifiedLocal').textContent = valid;

  window
    .fetch('https://localhost:3001/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag,
        data,
        signature,
      }),
    })
    .then(response =>
      response.ok ? response.json() : Promise.reject(response),
    )
    .then(async data => {
      window.document.getElementById('verifiedServer').textContent = data.valid;
    });
};
