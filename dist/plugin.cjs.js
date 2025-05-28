'use strict';

var core = require('@capacitor/core');

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
/**
 * ECDH key algorithm.
 */
const CRYPTO_API_ECDH_KEY_ALGORITHM = {
    name: 'ECDH',
    namedCurve: 'P-256',
};
const PRIVATE_KEY_FORMAT = 'pkcs8';
const PUBLIC_KEY_FORMAT = 'spki';
const CRYPTO_API_AES_GCM_ALGORITHM = 'AES-GCM';
const CRYPTO_API_ECDH_ALGORITHM = 'ECDH';
const SECRET_KEY_LENGHT = 256;
const IV_LENGTH = 12;

/**
 * Convert a base64 string to an ArrayBuffer.
 */
function base64ToArrayBuffer(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
/**
 * Convert an ArrayBuffer to a base64 string.
 */
function arrayBufferToBase64(arrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}
/**
 * Convert a raw (IEEE P1363) signature to an ASN.1 DER signature.
 */
function p1363ToDer(sig) {
    const signature = Array.from(sig, (x) => ('00' + x.toString(16)).slice(-2)).join('');
    let r = signature.substr(0, signature.length / 2);
    let s = signature.substr(signature.length / 2);
    r = r.replace(/^(00)+/, '');
    s = s.replace(/^(00)+/, '');
    if ((parseInt(r, 16) & 0x80) > 0)
        r = `00${r}`;
    if ((parseInt(s, 16) & 0x80) > 0)
        s = `00${s}`;
    const rString = `02${(r.length / 2).toString(16).padStart(2, '0')}${r}`;
    const sString = `02${(s.length / 2).toString(16).padStart(2, '0')}${s}`;
    const derSig = `30${((rString.length + sString.length) / 2).toString(16).padStart(2, '0')}${rString}${sString}`;
    const match = derSig.match(/[\da-f]{2}/gi);
    if (!match)
        throw new Error('Invalid signature');
    return new Uint8Array(match.map((h) => parseInt(h, 16)));
}
/**
 * Convert an ASN.1 DER signature to a raw (IEEE P1363) signature.
 */
function derToP1363(sig) {
    const signature = Array.from(sig, (x) => ('00' + x.toString(16)).slice(-2)).join('');
    const rLength = parseInt(signature.substr(6, 2), 16) * 2;
    let r = signature.substr(8, rLength);
    let s = signature.substr(12 + rLength);
    r = r.length > 64 ? r.substr(-64) : r.padStart(64, '0');
    s = s.length > 64 ? s.substr(-64) : s.padStart(64, '0');
    const p1363Sig = `${r}${s}`;
    const match = p1363Sig.match(/[\da-f]{2}/gi);
    if (!match)
        throw new Error('Invalid signature');
    return new Uint8Array(match.map((h) => parseInt(h, 16)));
}

const CryptoApi = core.registerPlugin('CryptoApi', {
    web: () => Promise.resolve().then(function () { return web; }).then((m) => new m.CryptoApiWeb()),
});

const LabelECDSA = 'CryptoApiECDSA:';
const LabelECDH = 'CryptoApiECDH:';
class CryptoApiWeb extends core.WebPlugin {
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

var web = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CryptoApiWeb: CryptoApiWeb
});

exports.CRYPTO_API_AES_GCM_ALGORITHM = CRYPTO_API_AES_GCM_ALGORITHM;
exports.CRYPTO_API_ECDH_ALGORITHM = CRYPTO_API_ECDH_ALGORITHM;
exports.CRYPTO_API_ECDH_KEY_ALGORITHM = CRYPTO_API_ECDH_KEY_ALGORITHM;
exports.CRYPTO_API_ECDSA_KEY_ALGORITHM = CRYPTO_API_ECDSA_KEY_ALGORITHM;
exports.CRYPTO_API_ECDSA_SIGN_ALGORITHM = CRYPTO_API_ECDSA_SIGN_ALGORITHM;
exports.CryptoApi = CryptoApi;
exports.IV_LENGTH = IV_LENGTH;
exports.PRIVATE_KEY_FORMAT = PRIVATE_KEY_FORMAT;
exports.PUBLIC_KEY_FORMAT = PUBLIC_KEY_FORMAT;
exports.SECRET_KEY_LENGHT = SECRET_KEY_LENGHT;
exports.arrayBufferToBase64 = arrayBufferToBase64;
exports.base64ToArrayBuffer = base64ToArrayBuffer;
exports.derToP1363 = derToP1363;
exports.p1363ToDer = p1363ToDer;
//# sourceMappingURL=plugin.cjs.js.map
