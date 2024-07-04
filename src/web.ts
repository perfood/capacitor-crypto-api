import { WebPlugin } from '@capacitor/core';

import type { CryptoApiAlgorithm, CryptoApiPlugin } from './definitions';
import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';

/**
 * ECDH fake data
 * privateKeyApi--- MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg5e58Wl6E8ljJy3Z5BJ6E5mCqjoJU+hIbFGaNIZMIaEihRANCAAQmHAJOw9xQJ8iEku1kmiE7eOfk9qFOZkoMjdEjCSuqsggXowxu6xdO2+8jZ+FvOQQVYxRc4lUYWufCPGtXtNux
 * publicKeyApi --- MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEJhwCTsPcUCfIhJLtZJohO3jn5PahTmZKDI3RIwkrqrIIF6MMbusXTtvvI2fhbzkEFWMUXOJVGFrnwjxrV7TbsQ==
 * privateKeyApp--- MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgdQtTbHTY5swFFR0kLc3XNr0TUEvpu/t55gJrxA76zOShRANCAASs4dWdu4XQQ98zfRHzcXPmGoX2kkSaWjlyy70zcUlmpwdY9hkK8rD5Y7JN4PuAThiCxzmlrNilsXHhNEuLqTW3
 * publicKeyApp --- MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErOHVnbuF0EPfM30R83Fz5hqF9pJEmlo5csu9M3FJZqcHWPYZCvKw+WOyTeD7gE4Ygsc5pazYpbFx4TRLi6k1tw==
 * secretKeyApi --- ZA7N4GiZktJ7REOjlknqUF7iwXkVKAwhLNhC6EhoisM=
 * secretKeyApp --- ZA7N4GiZktJ7REOjlknqUF7iwXkVKAwhLNhC6EhoisM=
 * random       --- 4XayYy8+CI3MYvBR33nRyeNX47PJhG4uu00Cs9vL5AA=
 * iv           --- Kn05p+/47v3duVmrOBii7iX33OPqNVVYf9H1vCRGv1c=
 * challenge    --- PApKZ9emcr0jAm5pXQ9hF1N2L7UOqTXfTt7N2R0PrQBSTjH9N64unhGMhtQ7PpY0
 */
const CRYPTO_API_ECDH_KEY_ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};
const CRYPTO_API_ECDH_PRIVATE_KEY =
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgdQtTbHTY5swFFR0kLc3XNr0TUEvpu/t55gJrxA76zOShRANCAASs4dWdu4XQQ98zfRHzcXPmGoX2kkSaWjlyy70zcUlmpwdY9hkK8rD5Y7JN4PuAThiCxzmlrNilsXHhNEuLqTW3';
const CRYPTO_API_ECDH_PUBLIC_KEY =
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErOHVnbuF0EPfM30R83Fz5hqF9pJEmlo5csu9M3FJZqcHWPYZCvKw+WOyTeD7gE4Ygsc5pazYpbFx4TRLi6k1tw==';
const CRYPTO_API_ECDH_SECRET_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};
const CRYPTO_API_ECDH_RANDOM = '4XayYy8+CI3MYvBR33nRyeNX47PJhG4uu00Cs9vL5AA=';
const CRYPTO_API_ECDH_IV = 'Kn05p+/47v3duVmrOBii7iX33OPqNVVYf9H1vCRGv1c=';

/**
 * ECDSA fake data
 * privateKey--- MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgE8kCrPIT4vLOuEY8vZ2ppmO/dL4IpMofJVl05+/cEJqhRANCAAQTOm3ZLqWs02ahnHkVuE0/K82MqE6Hddo4Vm8z5i9YpzbAIyb36mb/ooc/PREsHF75cqdcDHqVf/Mox6JGZYSO
 * publicKey --- MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEzpt2S6lrNNmoZx5FbhNPyvNjKhOh3XaOFZvM+YvWKc2wCMm9+pm/6KHPz0RLBxe+XKnXAx6lX/zKMeiRmWEjg==
 * random    --- kJAQkZkvtee9wUbg/atjL+4HD8NpW0+tnEkYwdePvxI=
 * signature --- AzeJzeAaWUJuCIFxugswCMrFmtykyrlIHnZNvuwwOjlrtb37Ga3GM0cQG3OSFl9cUulc+ixrx4Jm5aZaBRWHyQ==
 */
const CRYPTO_API_ECDSA_KEY_ALGORITHM = {
  name: 'ECDSA',
  namedCurve: 'P-256',
};
const CRYPTO_API_ECDSA_PRIVATE_KEY =
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgE8kCrPIT4vLOuEY8vZ2ppmO/dL4IpMofJVl05+/cEJqhRANCAAQTOm3ZLqWs02ahnHkVuE0/K82MqE6Hddo4Vm8z5i9YpzbAIyb36mb/ooc/PREsHF75cqdcDHqVf/Mox6JGZYSO';
const CRYPTO_API_ECDSA_PUBLIC_KEY =
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEzpt2S6lrNNmoZx5FbhNPyvNjKhOh3XaOFZvM+YvWKc2wCMm9+pm/6KHPz0RLBxe+XKnXAx6lX/zKMeiRmWEjg==';
const CRYPTO_API_ECDSA_SIGN_ALGORITHM = {
  name: 'ECDSA',
  hash: { name: 'SHA-256' },
};
const CRYPTO_API_ECDSA_RANDOM = 'kJAQkZkvtee9wUbg/atjL+4HD8NpW0+tnEkYwdePvxI=';
const CRYPTO_API_ECDSA_SIGNATURE =
  'AzeJzeAaWUJuCIFxugswCMrFmtykyrlIHnZNvuwwOjlrtb37Ga3GM0cQG3OSFl9cUulc+ixrx4Jm5aZaBRWHyQ==';

export class CryptoApiWeb extends WebPlugin implements CryptoApiPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('CryptoApi.echo', options);
    return options;
  }

  async generateKey(options: {
    tag: string;
    algorithm: CryptoApiAlgorithm;
  }): Promise<{ publicKey: string }> {
    console.log('CryptoApi.generateKey', options);

    if (options.algorithm !== 'ECDH' && options.algorithm !== 'ECDSA') {
      throw new Error('Invalid algorithm');
    }

    if (window.location.protocol != 'https:') {
      console.info(
        `WebCrypto API only available in secure contexts (https).\n\nTo test this you must use\npublic-key: ${
          options.algorithm === 'ECDH'
            ? CRYPTO_API_ECDH_PUBLIC_KEY
            : CRYPTO_API_ECDSA_PUBLIC_KEY
        }`,
      );

      const keyPair = {
        privateKey:
          options.algorithm === 'ECDH'
            ? CRYPTO_API_ECDH_PRIVATE_KEY
            : CRYPTO_API_ECDSA_PRIVATE_KEY,
        publicKey:
          options.algorithm === 'ECDH'
            ? CRYPTO_API_ECDH_PUBLIC_KEY
            : CRYPTO_API_ECDSA_PUBLIC_KEY,
      };

      localStorage.setItem(options.tag, JSON.stringify(keyPair));

      return {
        publicKey: keyPair.publicKey,
      };
    }

    const subtleKeyPair = await crypto.subtle.generateKey(
      CRYPTO_API_ECDSA_KEY_ALGORITHM,
      true,
      ['sign', 'verify'],
    );

    const privateKey = subtleKeyPair.privateKey;
    const publicKey = subtleKeyPair.publicKey;

    const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey);
    const publicKeySpki = await crypto.subtle.exportKey('spki', publicKey);

    const privateKeyBase64 = arrayBufferToBase64(privateKeyPkcs8);
    const publicKeyBase64 = arrayBufferToBase64(publicKeySpki);

    const keyPair = {
      privateKey: privateKeyBase64,
      publicKey: publicKeyBase64,
    };

    localStorage.setItem(options.tag, JSON.stringify(keyPair));

    return {
      publicKey: keyPair.publicKey,
    };
  }

  async loadKey(options: { tag: string }): Promise<{ publicKey: string }> {
    console.log('CryptoApi.loadKey', options);

    const item = localStorage.getItem(options.tag);
    if (!item) {
      throw new Error('Key not found');
    }

    const keyPair = JSON.parse(item);
    if (!keyPair.publicKey) {
      throw new Error('Public key not found');
    }

    return {
      publicKey: keyPair.publicKey,
    };
  }

  async sign(options: {
    tag: string;
    data: string;
  }): Promise<{ signature: string }> {
    console.log('CryptoApi.sign', options);

    const item = localStorage.getItem(options.tag);
    if (!item) {
      throw new Error('Key not found');
    }

    const keyPair = JSON.parse(item);
    if (!keyPair.privateKey) {
      throw new Error('Private key not found');
    }

    if (window.location.protocol != 'https:') {
      console.info(
        `WebCrypto API only available in secure contexts (https).\n\nTo test this you must verify with\npublic-key: ${CRYPTO_API_ECDSA_PUBLIC_KEY}\nsignature: ${CRYPTO_API_ECDSA_SIGNATURE}\ndata: ${CRYPTO_API_ECDSA_RANDOM}`,
      );
      return { signature: CRYPTO_API_ECDSA_SIGNATURE };
    }

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      base64ToArrayBuffer(keyPair.privateKey),
      CRYPTO_API_ECDSA_KEY_ALGORITHM,
      false,
      ['sign'],
    );

    const signature = arrayBufferToBase64(
      await crypto.subtle.sign(
        CRYPTO_API_ECDSA_SIGN_ALGORITHM,
        privateKey,
        base64ToArrayBuffer(options.data),
      ),
    );

    return { signature };
  }

  async decrypt(options: {
    tag: string;
    foreignPublicKey: string;
    iv: string;
    encryptedData: string;
  }): Promise<{ data: string }> {
    console.log('CryptoApi.decrypt', options);

    const item = localStorage.getItem(options.tag);
    if (!item) {
      throw new Error('Key not found');
    }

    const keyPair = JSON.parse(item);
    if (!keyPair.privateKey) {
      throw new Error('Private key not found');
    }

    if (window.location.protocol != 'https:') {
      console.info(
        `WebCrypto API only available in secure contexts (https).\n\nTo test this you must encrypt with\npublic-key: ${CRYPTO_API_ECDH_PUBLIC_KEY}\niv: ${CRYPTO_API_ECDH_IV}\ndata: ${CRYPTO_API_ECDH_RANDOM}`,
      );
      return { data: CRYPTO_API_ECDH_RANDOM };
    }

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      base64ToArrayBuffer(keyPair.privateKey),
      CRYPTO_API_ECDH_KEY_ALGORITHM,
      false,
      ['deriveKey'],
    );

    const foreignPublicKey = await crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(options.foreignPublicKey),
      CRYPTO_API_ECDH_KEY_ALGORITHM,
      false,
      [],
    );

    const secretKey = await crypto.subtle.deriveKey(
      {
        name: CRYPTO_API_ECDH_KEY_ALGORITHM.name,
        public: foreignPublicKey,
      },
      privateKey,
      CRYPTO_API_ECDH_SECRET_ALGORITHM,
      false,
      ['encrypt', 'decrypt'],
    );

    const data = arrayBufferToBase64(
      await crypto.subtle.decrypt(
        {
          name: CRYPTO_API_ECDH_SECRET_ALGORITHM.name,
          iv: base64ToArrayBuffer(options.iv),
        },
        secretKey,
        base64ToArrayBuffer(options.encryptedData),
      ),
    );

    return { data };
  }
}
