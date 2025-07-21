import { WebPlugin } from '@capacitor/core';
import { CRYPTO_API_AES_GCM_ALGORITHM, CRYPTO_API_ECDH_KEY_ALGORITHM, CRYPTO_API_ECDH_ALGORITHM, CRYPTO_API_ECDSA_KEY_ALGORITHM, CRYPTO_API_ECDSA_SIGN_ALGORITHM, IV_LENGTH, PRIVATE_KEY_FORMAT, PUBLIC_KEY_FORMAT, SECRET_KEY_LENGHT, } from './definitions';
import { arrayBufferToBase64, base64ToArrayBuffer, derToP1363, p1363ToDer } from './utils';
const LabelECDSA = 'CryptoApiECDSA:';
const LabelECDH = 'CryptoApiECDH:';
export class CryptoApiWeb extends WebPlugin {
    async getECDSATags() {
        console.log('CryptoApi.getECDSATags');
        return {
            tags: Object.keys(localStorage)
                .filter((key) => key.startsWith(LabelECDSA))
                .map((key) => key.replace(LabelECDSA, '')),
        };
    }
    async getECDHTags() {
        console.log('CryptoApi.getECDHTags');
        return {
            tags: Object.keys(localStorage)
                .filter((key) => key.startsWith(LabelECDH))
                .map((key) => key.replace(LabelECDH, '')),
        };
    }
    async generateKey(options) {
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
        const keyUsages = options.algorithm === 'ecdsa' ? ['sign', 'verify'] : ['deriveKey'];
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
    async loadKey(options) {
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
    async deleteKey(options) {
        console.log('CryptoApi.deleteKey', options);
        const label = this.getLabel(options.algorithm);
        localStorage.removeItem(`${label}${options.tag}`);
    }
    async sign(options) {
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
        const signature = arrayBufferToBase64(p1363ToDer(new Uint8Array(await crypto.subtle.sign(CRYPTO_API_ECDSA_SIGN_ALGORITHM, await this.importKey('ecdsa', PRIVATE_KEY_FORMAT, keyPair.privateKey, ['sign']), base64ToArrayBuffer(btoa(options.data))))));
        return { signature };
    }
    async verify(options) {
        console.log('CryptoApi.verify', options);
        if (window.location.protocol != 'https:') {
            throw new Error('WebCrypto API is only available in secure contexts (https)');
        }
        const verified = await crypto.subtle.verify(CRYPTO_API_ECDSA_SIGN_ALGORITHM, await this.importKey('ecdsa', PUBLIC_KEY_FORMAT, options.foreignPublicKey, ['verify']), derToP1363(base64ToArrayBuffer(options.signature)), base64ToArrayBuffer(btoa(options.data)));
        return { verified };
    }
    async encrypt(options) {
        console.log('CryptoApi.encrypt', options);
        if (window.location.protocol != 'https:') {
            throw new Error('WebCrypto API is only available in secure contexts (https)');
        }
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const ciphertext = await crypto.subtle.encrypt({
            name: CRYPTO_API_AES_GCM_ALGORITHM,
            iv,
        }, await this.deriveKey(options.tag, options.foreignPublicKey), new TextEncoder().encode(options.plaintext));
        return {
            iv: arrayBufferToBase64(iv),
            ciphertext: arrayBufferToBase64(ciphertext),
        };
    }
    async decrypt(options) {
        console.log('CryptoApi.decrypt', options);
        if (window.location.protocol != 'https:') {
            throw new Error('WebCrypto API is only available in secure contexts (https)');
        }
        const decryptedData = await crypto.subtle.decrypt({
            name: CRYPTO_API_AES_GCM_ALGORITHM,
            iv: base64ToArrayBuffer(options.iv),
        }, await this.deriveKey(options.tag, options.foreignPublicKey), base64ToArrayBuffer(options.ciphertext));
        return {
            plaintext: new TextDecoder().decode(decryptedData),
        };
    }
    async isBiometricsEnabled(options) {
        console.log('CryptoApi.isBiometricsEnabled', options);
        return {
            isEnabled: false,
        };
    }
    async getBiometricsStatus(options) {
        console.log('CryptoApi.isBiometricsEnabled', options);
        return {
            status: 'UNKNOWN',
        };
    }
    async getAvailableHardware() {
        return {
            hardware: [],
        };
    }
    async isDevicePasscodeSet() {
        return {
            isDevicePasscodeSet: false,
        };
    }
    async hasSecureHardware() {
        return {
            hasSecureHardware: false,
        };
    }
    async importKey(algorithm, format, privateKeyBase64, keyUsages) {
        const keyData = base64ToArrayBuffer(privateKeyBase64);
        const keyAlgorithm = algorithm == 'ecdsa' ? CRYPTO_API_ECDSA_KEY_ALGORITHM : CRYPTO_API_ECDH_KEY_ALGORITHM;
        return crypto.subtle.importKey(format, keyData, keyAlgorithm, false, keyUsages);
    }
    async deriveKey(tag, foreignPublicKey) {
        const item = localStorage.getItem(`${LabelECDH}${tag}`);
        if (!item) {
            throw new Error('Key not found');
        }
        const keyPair = JSON.parse(item);
        if (!keyPair.privateKey) {
            throw new Error('Private key not found');
        }
        const sharedSecret = await crypto.subtle.deriveKey({
            name: CRYPTO_API_ECDH_ALGORITHM,
            public: await this.importKey('ecdh', PUBLIC_KEY_FORMAT, foreignPublicKey, []),
        }, await this.importKey('ecdh', PRIVATE_KEY_FORMAT, keyPair.privateKey, ['deriveKey']), {
            name: CRYPTO_API_AES_GCM_ALGORITHM,
            length: SECRET_KEY_LENGHT,
        }, true, ['encrypt', 'decrypt']);
        return sharedSecret;
    }
    getLabel(algorithm) {
        return algorithm === 'ecdsa' ? LabelECDSA : LabelECDH;
    }
}
//# sourceMappingURL=web.js.map