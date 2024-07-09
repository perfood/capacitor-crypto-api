import { WebPlugin } from '@capacitor/core';

import type {
  CryptoApiPlugin,
  DecryptOptions,
  DecryptResponse,
  GenerateKeyOptions,
  GenerateKeyResponse,
  LoadKeyOptions,
  LoadKeyResponse,
  SignOptions,
  SignResponse,
} from './definitions';
import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';

/**
 * ECDH key algorithm.
 */
const CRYPTO_API_ECDH_KEY_ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};
/**
 * ECDH secret algorithm.
 */
const CRYPTO_API_ECDH_SECRET_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};

/**
 * ECDSA key algorithm.
 */
const CRYPTO_API_ECDSA_KEY_ALGORITHM = {
  name: 'ECDSA',
  namedCurve: 'P-256',
};
/**
 * ECDSA sign algorithm.
 */
const CRYPTO_API_ECDSA_SIGN_ALGORITHM = {
  name: 'ECDSA',
  hash: { name: 'SHA-256' },
};

export class CryptoApiWeb extends WebPlugin implements CryptoApiPlugin {
  async generateKey(options: GenerateKeyOptions): Promise<GenerateKeyResponse> {
    console.log('CryptoApi.generateKey', options);

    if (options.algorithm !== 'ECDH' && options.algorithm !== 'ECDSA') {
      throw new Error('Invalid algorithm');
    }

    if (window.location.protocol != 'https:') {
      throw new Error(
        'WebCrypto API is only available in secure contexts (https)',
      );
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

  async loadKey(options: LoadKeyOptions): Promise<LoadKeyResponse> {
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

  async sign(options: SignOptions): Promise<SignResponse> {
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
      throw new Error(
        'WebCrypto API is only available in secure contexts (https)',
      );
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
        base64ToArrayBuffer(btoa(options.data)),
      ),
    );

    return { signature };
  }

  async decrypt(options: DecryptOptions): Promise<DecryptResponse> {
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
      throw new Error(
        'WebCrypto API is only available in secure contexts (https)',
      );
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

    const data = btoa(
      arrayBufferToBase64(
        await crypto.subtle.decrypt(
          {
            name: CRYPTO_API_ECDH_SECRET_ALGORITHM.name,
            iv: base64ToArrayBuffer(options.initVector),
          },
          secretKey,
          base64ToArrayBuffer(options.encryptedData),
        ),
      ),
    );

    return { data };
  }
}
