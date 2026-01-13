import { WebPlugin } from '@capacitor/core';

import type {
  AuthenticateWithPasskeyOptions,
  AuthenticateWithPasskeyResult,
  AvailableHardwareResponse,
  BiometricsEnabledOptions,
  BiometricsEnabledResponse,
  BiometricsStatusOptions,
  BiometricsStatusResponse,
  CryptoApiPlugin,
  DecryptOptions,
  DecryptResponse,
  DeleteKeyOptions,
  DevicePasscodeResponse,
  EncryptOptions,
  EncryptResponse,
  GenerateKeyOptions,
  GenerateKeyResponse,
  GetTagsResponse,
  LoadKeyOptions,
  LoadKeyResponse,
  RegisterPasskeyOptions,
  RegisterPasskeyResult,
  SecureHardwareResponse,
  SignOptions,
  SignResponse,
  VerifyOptions,
  VerifyResponse,
} from './definitions';
import {
  CRYPTO_API_AES_GCM_ALGORITHM,
  CRYPTO_API_ECDH_KEY_ALGORITHM,
  CRYPTO_API_ECDH_ALGORITHM,
  CRYPTO_API_ECDSA_KEY_ALGORITHM,
  CRYPTO_API_ECDSA_SIGN_ALGORITHM,
  IV_LENGTH,
  PRIVATE_KEY_FORMAT,
  PUBLIC_KEY_FORMAT,
  SECRET_KEY_LENGHT,
} from './definitions';
import { arrayBufferToBase64, base64ToArrayBuffer, derToP1363, p1363ToDer, toArrayBuffer } from './utils';

const LabelECDSA = 'CryptoApiECDSA:';
const LabelECDH = 'CryptoApiECDH:';
const BASE64URL_PADDING = '=';
const BASE64URL_PAD_LENGTH = 4;

export class CryptoApiWeb extends WebPlugin implements CryptoApiPlugin {
  async getECDSATags(): Promise<GetTagsResponse> {
    console.log('CryptoApi.getECDSATags');

    return {
      tags: Object.keys(localStorage)
        .filter((key) => key.startsWith(LabelECDSA))
        .map((key) => key.replace(LabelECDSA, '')),
    };
  }

  async getECDHTags(): Promise<GetTagsResponse> {
    console.log('CryptoApi.getECDHTags');

    return {
      tags: Object.keys(localStorage)
        .filter((key) => key.startsWith(LabelECDH))
        .map((key) => key.replace(LabelECDH, '')),
    };
  }

  async generateKey(options: GenerateKeyOptions): Promise<GenerateKeyResponse> {
    console.log('CryptoApi.generateKey', options);

    if (window.location.protocol != 'https:') {
      throw new Error('WebCrypto API is only available in secure contexts (https)');
    }

    const { publicKey: publicKeyFound } = await this.loadKey({
      tag: options.tag,
      algorithm: options.algorithm,
    });
    if (publicKeyFound) {
      return {
        publicKey: publicKeyFound,
      };
    }

    const algorithm = options.algorithm === 'ecdsa' ? CRYPTO_API_ECDSA_KEY_ALGORITHM : CRYPTO_API_ECDH_KEY_ALGORITHM;
    const keyUsages: KeyUsage[] = options.algorithm === 'ecdsa' ? ['sign', 'verify'] : ['deriveKey'];

    const subtleKeyPair = await crypto.subtle.generateKey(algorithm, true, keyUsages);

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

    const label = this.getLabel(options.algorithm);
    localStorage.setItem(`${label}${options.tag}`, JSON.stringify(keyPair));

    return {
      publicKey: keyPair.publicKey,
    };
  }

  async loadKey(options: LoadKeyOptions): Promise<LoadKeyResponse> {
    console.log('CryptoApi.loadKey', options);

    const label = this.getLabel(options.algorithm);
    const item = localStorage.getItem(`${label}${options.tag}`);
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

    const label = this.getLabel(options.algorithm);
    localStorage.removeItem(`${label}${options.tag}`);
  }

  async sign(options: SignOptions): Promise<SignResponse> {
    console.log('CryptoApi.sign', options);

    if (window.location.protocol != 'https:') {
      throw new Error('WebCrypto API is only available in secure contexts (https)');
    }

    const item = localStorage.getItem(`${LabelECDSA}${options.tag}`);
    if (!item) {
      throw new Error('Key not found');
    }

    const keyPair = JSON.parse(item);
    if (!keyPair.privateKey) {
      throw new Error('Private key not found');
    }

    const signatureArrayBuffer = await crypto.subtle.sign(
      CRYPTO_API_ECDSA_SIGN_ALGORITHM,
      await this.importKey('ecdsa', PRIVATE_KEY_FORMAT, keyPair.privateKey, ['sign']),
      toArrayBuffer(base64ToArrayBuffer(btoa(options.data))),
    );

    const signature = arrayBufferToBase64(toArrayBuffer(p1363ToDer(new Uint8Array(signatureArrayBuffer))));

    return { signature };
  }

  async verify(options: VerifyOptions): Promise<VerifyResponse> {
    console.log('CryptoApi.verify', options);

    if (window.location.protocol != 'https:') {
      throw new Error('WebCrypto API is only available in secure contexts (https)');
    }

    const verified = await crypto.subtle.verify(
      CRYPTO_API_ECDSA_SIGN_ALGORITHM,
      await this.importKey('ecdsa', PUBLIC_KEY_FORMAT, options.foreignPublicKey, ['verify']),
      toArrayBuffer(derToP1363(base64ToArrayBuffer(options.signature))),
      toArrayBuffer(base64ToArrayBuffer(btoa(options.data))),
    );

    return { verified };
  }

  async encrypt(options: EncryptOptions): Promise<EncryptResponse> {
    console.log('CryptoApi.encrypt', options);

    if (window.location.protocol != 'https:') {
      throw new Error('WebCrypto API is only available in secure contexts (https)');
    }

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: CRYPTO_API_AES_GCM_ALGORITHM,
        iv,
      },
      await this.deriveKey(options.tag, options.foreignPublicKey),
      new TextEncoder().encode(options.plaintext),
    );

    return {
      iv: arrayBufferToBase64(toArrayBuffer(iv)),
      ciphertext: arrayBufferToBase64(ciphertext),
    };
  }

  async decrypt(options: DecryptOptions): Promise<DecryptResponse> {
    console.log('CryptoApi.decrypt', options);

    if (window.location.protocol != 'https:') {
      throw new Error('WebCrypto API is only available in secure contexts (https)');
    }

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: CRYPTO_API_AES_GCM_ALGORITHM,
        iv: toArrayBuffer(base64ToArrayBuffer(options.iv)),
      },
      await this.deriveKey(options.tag, options.foreignPublicKey),
      toArrayBuffer(base64ToArrayBuffer(options.ciphertext)),
    );

    return {
      plaintext: new TextDecoder().decode(decryptedData),
    };
  }

  async isBiometricsEnabled(options: BiometricsEnabledOptions): Promise<BiometricsEnabledResponse> {
    console.log('CryptoApi.isBiometricsEnabled', options);

    return {
      isEnabled: false,
    };
  }

  async getBiometricsStatus(options: BiometricsStatusOptions): Promise<BiometricsStatusResponse> {
    console.log('CryptoApi.isBiometricsEnabled', options);

    return {
      status: 'UNKNOWN',
    };
  }

  async getAvailableHardware(): Promise<AvailableHardwareResponse> {
    return {
      hardware: [],
    };
  }

  async isDevicePasscodeSet(): Promise<DevicePasscodeResponse> {
    return {
      isDevicePasscodeSet: false,
    };
  }

  async hasSecureHardware(): Promise<SecureHardwareResponse> {
    return {
      hasSecureHardware: false,
    };
  }

  async registerPasskey(options: RegisterPasskeyOptions): Promise<RegisterPasskeyResult> {
    const createOptions = {
      ...options,
      challenge: this.base64urlToBuffer(options.challenge),
      user: {
        ...options.user,
        id: this.base64urlToBuffer(options.user.id),
      },
    };
    const publicKeyCredential = (await navigator.credentials.create({
      publicKey: createOptions,
    })) as PublicKeyCredential;

    if (!publicKeyCredential) {
      throw new Error('No response from authenticator');
    }

    const response = publicKeyCredential.response as AuthenticatorAttestationResponse;

    const authenticatorAttachment =
      'authenticatorAttachment' in publicKeyCredential
        ? (publicKeyCredential as any).authenticatorAttachment
        : undefined;

    return {
      id: publicKeyCredential.id,
      rawId: this.bufferToBase64url(new Uint8Array(publicKeyCredential.rawId)),
      type: publicKeyCredential.type,
      response: {
        attestationObject: this.bufferToBase64url(new Uint8Array(response.attestationObject)),
        clientDataJSON: this.bufferToBase64url(new Uint8Array(response.clientDataJSON)),
      },
      authenticatorAttachment,
    };
  }

  async authenticateWithPasskey(options: AuthenticateWithPasskeyOptions): Promise<AuthenticateWithPasskeyResult> {
    const allowCredentials = (options.allowCredentials || []).map((cred) => {
      return { id: this.base64urlToBuffer(cred.id), type: cred.type };
    });

    const webOptions = {
      ...options,
      challenge: this.base64urlToBuffer(options.challenge),
      allowCredentials,
    };

    const publicKeyCredential = (await navigator.credentials.get({ publicKey: webOptions })) as PublicKeyCredential;

    if (!publicKeyCredential) {
      throw new Error('No response from authenticator');
    }

    const response = publicKeyCredential.response as AuthenticatorAssertionResponse;

    const authenticatorAttachment =
      'authenticatorAttachment' in publicKeyCredential
        ? (publicKeyCredential as any).authenticatorAttachment
        : undefined;

    return {
      id: publicKeyCredential.id,
      rawId: this.bufferToBase64url(new Uint8Array(publicKeyCredential.rawId)),
      type: publicKeyCredential.type,
      response: {
        authenticatorData: this.bufferToBase64url(response.authenticatorData),
        clientDataJSON: this.bufferToBase64url(response.clientDataJSON),
        signature: this.bufferToBase64url(response.signature),
        userHandle: response.userHandle ? this.bufferToBase64url(response.userHandle) : undefined,
      },
      authenticatorAttachment,
    };
  }

  private async importKey(
    algorithm: 'ecdsa' | 'ecdh',
    format: 'pkcs8' | 'spki',
    privateKeyBase64: string,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey> {
    const keyData = toArrayBuffer(base64ToArrayBuffer(privateKeyBase64));
    const keyAlgorithm = algorithm == 'ecdsa' ? CRYPTO_API_ECDSA_KEY_ALGORITHM : CRYPTO_API_ECDH_KEY_ALGORITHM;
    return crypto.subtle.importKey(format, keyData, keyAlgorithm, false, keyUsages);
  }

  private async deriveKey(tag: string, foreignPublicKey: string): Promise<CryptoKey> {
    const item = localStorage.getItem(`${LabelECDH}${tag}`);
    if (!item) {
      throw new Error('Key not found');
    }

    const keyPair = JSON.parse(item);
    if (!keyPair.privateKey) {
      throw new Error('Private key not found');
    }

    const sharedSecret = await crypto.subtle.deriveKey(
      {
        name: CRYPTO_API_ECDH_ALGORITHM,
        public: await this.importKey('ecdh', PUBLIC_KEY_FORMAT, foreignPublicKey, []),
      },
      await this.importKey('ecdh', PRIVATE_KEY_FORMAT, keyPair.privateKey, ['deriveKey']),
      {
        name: CRYPTO_API_AES_GCM_ALGORITHM,
        length: SECRET_KEY_LENGHT,
      },
      true,
      ['encrypt', 'decrypt'],
    );
    return sharedSecret;
  }

  private getLabel(algorithm: 'ecdsa' | 'ecdh'): string {
    return algorithm === 'ecdsa' ? LabelECDSA : LabelECDH;
  }

  private bufferToBase64url(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private base64urlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (BASE64URL_PAD_LENGTH - (base64.length % BASE64URL_PAD_LENGTH)) % BASE64URL_PAD_LENGTH;
    const paddedBase64 = base64 + BASE64URL_PADDING.repeat(paddingNeeded);
    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }
}
