import { WebPlugin } from '@capacitor/core';

import type {
  CryptoApiPlugin,
  DecryptOptions,
  DecryptResponse,
  DeleteKeyOptions,
  EncryptOptions,
  EncryptResponse,
  GenerateKeyOptions,
  GenerateKeyResponse,
  ListResponse,
  LoadKeyOptions,
  LoadKeyResponse,
  SignOptions,
  SignResponse,
  VerifyOptions,
  VerifyResponse
} from './definitions';
import {
  CRYPTO_API_AES_GCM_ALGORITHM,
  CRYPTO_API_ECDH_ALGORITHM,
  CRYPTO_API_ECDSA_KEY_ALGORITHM,
  CRYPTO_API_ECDSA_SIGN_ALGORITHM,
  IV_LENGTH,
  PRIVATE_KEY_FORMAT,
  PUBLIC_KEY_FORMAT,
  SECRET_KEY_LENGHT,
} from './definitions';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  derToP1363,
  p1363ToDer,
} from './utils';

const LabelECDSA = 'CryptoApiECDSA:';

export class CryptoApiWeb extends WebPlugin implements CryptoApiPlugin {
  async list(): Promise<ListResponse> {
    console.log('CryptoApi.list');

    return {
      list: Object.keys(localStorage)
        .filter(key => key.startsWith(LabelECDSA))
        .map(key => key.replace(LabelECDSA, '')),
    };
  }

  async generateKey(options: GenerateKeyOptions): Promise<GenerateKeyResponse> {
    console.log('CryptoApi.generateKey', options);

    if (window.location.protocol != 'https:') {
      throw new Error(
        'WebCrypto API is only available in secure contexts (https)',
      );
    }

    const { publicKey: publicKeyFound } = await this.loadKey({
      tag: options.tag,
    });
    if (publicKeyFound) {
      return {
        publicKey: publicKeyFound,
      };
    }

    const subtleKeyPair = await crypto.subtle.generateKey(
      CRYPTO_API_ECDSA_KEY_ALGORITHM,
      true,
      ['sign', 'verify'],
    );

    const privateKey = subtleKeyPair.privateKey;
    const publicKey = subtleKeyPair.publicKey;

    const privateKeyPkcs8 = await crypto.subtle.exportKey(PRIVATE_KEY_FORMAT, privateKey);
    const publicKeySpki = await crypto.subtle.exportKey(PUBLIC_KEY_FORMAT, publicKey);

    const privateKeyBase64 = arrayBufferToBase64(privateKeyPkcs8);
    const publicKeyBase64 = arrayBufferToBase64(publicKeySpki);

    const keyPair = {
      privateKey: privateKeyBase64,
      publicKey: publicKeyBase64,
    };

    localStorage.setItem(
      `${LabelECDSA}${options.tag}`,
      JSON.stringify(keyPair),
    );

    return {
      publicKey: keyPair.publicKey,
    };
  }

  async loadKey(options: LoadKeyOptions): Promise<LoadKeyResponse> {
    console.log('CryptoApi.loadKey', options);

    const item = localStorage.getItem(`${LabelECDSA}${options.tag}`);
    if (!item) {
      return {};
    }

    const keyPair = JSON.parse(item);
    if (!keyPair.publicKey) {
      return {};
    }

    return {
      publicKey: keyPair.publicKey,
    };
  }

  async deleteKey(options: DeleteKeyOptions): Promise<void> {
    console.log('CryptoApi.deleteKey', options);

    localStorage.removeItem(`${LabelECDSA}${options.tag}`);
  }

  async sign(options: SignOptions): Promise<SignResponse> {
    console.log('CryptoApi.sign', options);

    if (window.location.protocol != 'https:') {
      throw new Error(
        'WebCrypto API is only available in secure contexts (https)',
      );
    }

    const item = localStorage.getItem(`${LabelECDSA}${options.tag}`);
    if (!item) {
      throw new Error('Key not found');
    }

    const keyPair = JSON.parse(item);
    if (!keyPair.privateKey) {
      throw new Error('Private key not found');
    }

    const privateKey = await this.importKey(PRIVATE_KEY_FORMAT, keyPair.privateKey, ['sign'])

    const signature = arrayBufferToBase64(
      p1363ToDer(
        new Uint8Array(
          await crypto.subtle.sign(
            CRYPTO_API_ECDSA_SIGN_ALGORITHM,
            privateKey,
            base64ToArrayBuffer(btoa(options.data)),
          ),
        ),
      ),
    );

    return { signature };
  }

  async verify(options: VerifyOptions): Promise<VerifyResponse> {
    console.log('CryptoApi.verify', options);

    if (window.location.protocol != 'https:') {
      throw new Error(
        'WebCrypto API is only available in secure contexts (https)',
      );
    }

    const foreignPublicKey = await this.importKey(PUBLIC_KEY_FORMAT, options.foreignPublicKey, ['verify']);

    const verified = await crypto.subtle.verify(
      CRYPTO_API_ECDSA_SIGN_ALGORITHM,
      foreignPublicKey,
      derToP1363(base64ToArrayBuffer(options.signature)),
      base64ToArrayBuffer(btoa(options.data)),
    );

    return { verified };
  }

  async encrypt(options: EncryptOptions): Promise<EncryptResponse> {
    console.log('CryptoApi.encrypt', options);

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)); 
    const arrayBuffer = base64ToArrayBuffer(options.data); 
    const secretKey = await this.deriveSecret(options.tag)

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: CRYPTO_API_AES_GCM_ALGORITHM,
            iv: iv,
        },
        secretKey,
        arrayBuffer
    );

    const encrypted = JSON.stringify({
      iv, 
      encryptedData: encryptedData
    })

    return { encrypted }
  }

  async decrypt(options: DecryptOptions): Promise<DecryptResponse> {
    console.log('CryptoApi.decrypt', options);

    const data = JSON.parse(options.data)
    const secretKey = await this.deriveSecret(options.tag)

    const decryptedData = await crypto.subtle.decrypt(
        {
            name:CRYPTO_API_AES_GCM_ALGORITHM,
            iv: data.iv,
        },
        secretKey,
        data.encryptedData
    );
    const decrypted = arrayBufferToBase64(decryptedData);

    return { decrypted }
  }

  private async importKey(format: "pkcs8" | "spki", privateKeyBase64: string, keyUsages: KeyUsage[]): Promise<CryptoKey> {
    const keyData = base64ToArrayBuffer(privateKeyBase64);
    return crypto.subtle.importKey(
      format, 
      keyData,
      CRYPTO_API_ECDSA_KEY_ALGORITHM,
      false,
      keyUsages
    );
  }

  private async deriveSecret(tag: string): Promise<CryptoKey> {
    let item = localStorage.getItem(`${LabelECDSA}${tag}`);
    if (!item) {
      await this.generateKey({tag})
      item = localStorage.getItem(`${LabelECDSA}${tag}`);

      if(!item){
        throw new Error('CryptoApi.deriveSecret - Failed to generate new key pair.');
      }
    }
    const keyPair = JSON.parse(item);
    const privateKey = await this.importKey(PRIVATE_KEY_FORMAT, keyPair.privateKey, ['deriveKey']);
    const publicKey = await this.importKey(PUBLIC_KEY_FORMAT, keyPair.publicKey, ['deriveKey']);

    const sharedSecret = await crypto.subtle.deriveKey(
        {
            name: CRYPTO_API_ECDH_ALGORITHM,
            public: publicKey,
        },
        privateKey,
        {
          name: CRYPTO_API_AES_GCM_ALGORITHM,
          length: SECRET_KEY_LENGHT, 
        },
        true,
        ["encrypt", "decrypt"]
    );
    return sharedSecret;
  }
}
