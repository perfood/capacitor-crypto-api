# @perfood/capacitor-crypto-api

This capacitor plugin provides a unified cryptographic API for secure key management and cryptographic operations using platform-specific secure hardware:

- iOS: Secure Enclave
- Android: StrongBox / TEE
- Web (development): WebCrypto API

It supports generating and storing elliptic curve key pairs and using them for:

- ECDSA: signing and verifying data
- ECDH: key agreement (e.g. for symmetric encryption)

## Secure Hardware & Cryptographic Capabilities

### iOS – Secure Enclave

> "Works only with NIST P-256 elliptic curve keys. These keys can only be used for creating and verifying cryptographic signatures, or for elliptic curve Diffie-Hellman key exchange (and by extension, symmetric encryption)." - [Apple Developer Documentation](https://developer.apple.com/documentation/security/certificate_key_and_trust_services/keys/protecting_keys_with_the_secure_enclave)

On iOS, the Secure Enclave imposes the following constraints:
- Only NIST P-256 elliptic curve keys are supported
- Supports ECDSA and ECDH
- Private keys never leave the Secure Enclave
- Keys can optionally be protected by biometrics

### Android – StrongBox / TEE

On Android, the plugin uses StrongBox when available and falls back to the Trusted Execution Environment (TEE).

- Supports ECDSA and ECDH
- Hardware-backed key storage
- Behavior depends on device manufacturer and Android version
- Keys can optionally be protected by biometrics

## Format of the signature

Secure Enclave (iOS) and StrongBox/TEE (Android) return the signature in ASN.1 DER format. The WebCrypto API returns the signature in raw (IEEE P1363) format.

This plugin has the functions `derToP1363` and `p1363ToDer` to convert the signature from ASN.1 DER to raw (IEEE P1363) format and vice versa.

## For development

For development and testing in the browser:

- Uses the WebCrypto API
- Key pairs are stored in the browser's localStorage
- Supports ECDSA and ECDH

> WebCrypto API is only available in secure contexts (https)

## Use Cases

### Two-Factor / Cryptographic Authentication (ECDSA)

This plugin can be used to implement a strong cryptographic authentication mechanism.

1. The client generates an ECDSA key pair in secure hardware
2. The public key is registered on the server
3. The server sends a cryptographic challenge
4. The client signs the challenge using the private key and sends the signed data back to the server
5. The server verifies the signature using the stored public key

Because the private key never leaves secure hardware, this provides strong protection against key exfiltration. If the keys are protected by biometrics, the native biometrics dialog box is displayed.
There is an example in the [`example`](./example/README.md) directory.

### Secure Key Exchange & Encryption (ECDH)

The plugin supports Elliptic Curve Diffie-Hellman (ECDH) to securely derive shared secrets.

Typical workflow:

1. Client and server each have an ECDH key pair
2. The public keys are exchanged
3. Both sides derive the same shared secret using ECDH
4. The derived secret is used as a symmetric key (e.g. AES)
5. Data can now be securely:
- Encrypted on one side
- Decrypted on the other side

Supported use cases:
- End-to-end encrypted communication
- Secure storage encryption

Private keys remain protected in Secure Enclave (iOS) or StrongBox/TEE (Android).

### Passkey (WebAuthn / FIDO2)

The plugin supports Passkeys for passwordless authentication using native platform dialogs.

#### Registration

A passkey can be created after a successful login, ensuring account ownership.

1. Client requests registration options from the backend (WebAuthn PublicKeyCredentialCreationOptions)
2. Backend returns challenge and relying party information
3. Client calls registerPasskey(...)
4. Native passkey dialog is shown (Face ID / Touch ID / Biometrics)
5. Client returns assertion to backend
6. Backend verifies the attestation
7. On success: credentialId and publicKey can be stored in the user database

#### Authentication

1. Client requests authentication options from backend
2. Backend sends challenge
3. Client calls authenticateWithPasskey(...)
4. Native authentication dialog is shown
5. Client returns assertion to backend
6. Backend verifies the signature using the stored public key

## Install

```bash
npm install @perfood/capacitor-crypto-api
npx cap sync
```

## API

<docgen-index>

* [`getECDSATags()`](#getecdsatags)
* [`getECDHTags()`](#getecdhtags)
* [`generateKey(...)`](#generatekey)
* [`loadKey(...)`](#loadkey)
* [`deleteKey(...)`](#deletekey)
* [`sign(...)`](#sign)
* [`verify(...)`](#verify)
* [`encrypt(...)`](#encrypt)
* [`decrypt(...)`](#decrypt)
* [`isBiometricsEnabled(...)`](#isbiometricsenabled)
* [`getBiometricsStatus(...)`](#getbiometricsstatus)
* [`getAvailableHardware()`](#getavailablehardware)
* [`isDevicePasscodeSet()`](#isdevicepasscodeset)
* [`hasSecureHardware()`](#hassecurehardware)
* [`registerPasskey(...)`](#registerpasskey)
* [`authenticateWithPasskey(...)`](#authenticatewithpasskey)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### getECDSATags()

```typescript
getECDSATags() => Promise<GetTagsResponse>
```

Returns all ECDSA key-pair tags that are available in the Secure Enclave (iOS) or StrongBox/TEE (Android).

**Returns:** <code>Promise&lt;<a href="#gettagsresponse">GetTagsResponse</a>&gt;</code>

--------------------


### getECDHTags()

```typescript
getECDHTags() => Promise<GetTagsResponse>
```

Returns all ECDH key-pair tags that are available in the Secure Enclave (iOS) or StrongBox/TEE (Android).

**Returns:** <code>Promise&lt;<a href="#gettagsresponse">GetTagsResponse</a>&gt;</code>

--------------------


### generateKey(...)

```typescript
generateKey(options: GenerateKeyOptions) => Promise<GenerateKeyResponse>
```

Generates a key-pair in the Secure Enclave (iOS) or StrongBox/TEE (Android),
tags it for alter referencing and returns the public-key only,
since the private-key is protected and can't be extracted.
Possibility to secure private key with biometry.

| Param         | Type                                                              |
| ------------- | ----------------------------------------------------------------- |
| **`options`** | <code><a href="#generatekeyoptions">GenerateKeyOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#generatekeyresponse">GenerateKeyResponse</a>&gt;</code>

**Since:** 1.0.0

--------------------


### loadKey(...)

```typescript
loadKey(options: LoadKeyOptions) => Promise<LoadKeyResponse>
```

Loads the public-key from the Secure Enclave (iOS) or StrongBox/TEE (Android).

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#loadkeyoptions">LoadKeyOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#loadkeyresponse">LoadKeyResponse</a>&gt;</code>

**Since:** 1.0.0

--------------------


### deleteKey(...)

```typescript
deleteKey(options: DeleteKeyOptions) => Promise<void>
```

Deletes the key-pair from the Secure Enclave (iOS) or StrongBox/TEE (Android).

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#deletekeyoptions">DeleteKeyOptions</a></code> |

**Since:** 1.0.0

--------------------


### sign(...)

```typescript
sign(options: SignOptions) => Promise<SignResponse>
```

Signs the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
Uses the private-key associated with the tag.

Only ECDSA is supported.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code><a href="#signoptions">SignOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#signresponse">SignResponse</a>&gt;</code>

**Since:** 1.0.0

--------------------


### verify(...)

```typescript
verify(options: VerifyOptions) => Promise<VerifyResponse>
```

Verifies the signature of the data with the foreign public-key.

Only ECDSA is supported.

| Param         | Type                                                    |
| ------------- | ------------------------------------------------------- |
| **`options`** | <code><a href="#verifyoptions">VerifyOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#verifyresponse">VerifyResponse</a>&gt;</code>

**Since:** 1.0.0

--------------------


### encrypt(...)

```typescript
encrypt(options: EncryptOptions) => Promise<EncryptResponse>
```

Encrypt data with AES-GCM.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#encryptoptions">EncryptOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#encryptresponse">EncryptResponse</a>&gt;</code>

--------------------


### decrypt(...)

```typescript
decrypt(options: DecryptOptions) => Promise<DecryptResponse>
```

Decrypt data with AES-GCM.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#decryptoptions">DecryptOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#decryptresponse">DecryptResponse</a>&gt;</code>

--------------------


### isBiometricsEnabled(...)

```typescript
isBiometricsEnabled(options: BiometricsEnabledOptions) => Promise<BiometricsEnabledResponse>
```

Is biometry enabled on the device?

| Param         | Type                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| **`options`** | <code><a href="#biometricsenabledoptions">BiometricsEnabledOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#biometricsenabledresponse">BiometricsEnabledResponse</a>&gt;</code>

--------------------


### getBiometricsStatus(...)

```typescript
getBiometricsStatus(options: BiometricsStatusOptions) => Promise<BiometricsStatusResponse>
```

Get the status of biometry on the device.

| Param         | Type                                                                        |
| ------------- | --------------------------------------------------------------------------- |
| **`options`** | <code><a href="#biometricsstatusoptions">BiometricsStatusOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#biometricsstatusresponse">BiometricsStatusResponse</a>&gt;</code>

--------------------


### getAvailableHardware()

```typescript
getAvailableHardware() => Promise<AvailableHardwareResponse>
```

Get the list of available biometry hardware on the device.

**Returns:** <code>Promise&lt;<a href="#availablehardwareresponse">AvailableHardwareResponse</a>&gt;</code>

--------------------


### isDevicePasscodeSet()

```typescript
isDevicePasscodeSet() => Promise<DevicePasscodeResponse>
```

Is the device passcode set on the device?

**Returns:** <code>Promise&lt;<a href="#devicepasscoderesponse">DevicePasscodeResponse</a>&gt;</code>

--------------------


### hasSecureHardware()

```typescript
hasSecureHardware() => Promise<SecureHardwareResponse>
```

Does the device have secure hardware like StrongBox?

**Returns:** <code>Promise&lt;<a href="#securehardwareresponse">SecureHardwareResponse</a>&gt;</code>

--------------------


### registerPasskey(...)

```typescript
registerPasskey(options: RegisterPasskeyOptions) => Promise<RegisterPasskeyResult>
```

| Param         | Type                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| **`options`** | <code><a href="#registerpasskeyoptions">RegisterPasskeyOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#registerpasskeyresult">RegisterPasskeyResult</a>&gt;</code>

--------------------


### authenticateWithPasskey(...)

```typescript
authenticateWithPasskey(options: AuthenticateWithPasskeyOptions) => Promise<AuthenticateWithPasskeyResult>
```

| Param         | Type                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#authenticatewithpasskeyoptions">AuthenticateWithPasskeyOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#authenticatewithpasskeyresult">AuthenticateWithPasskeyResult</a>&gt;</code>

--------------------


### Interfaces


#### GetTagsResponse

| Prop       | Type                  | Description        |
| ---------- | --------------------- | ------------------ |
| **`tags`** | <code>string[]</code> | The key-pair tags. |


#### GenerateKeyResponse

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`publicKey`** | <code>string</code> | The public-key in base64 format. |


#### GenerateKeyOptions

| Prop            | Type                                                  | Description                                             |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| **`tag`**       | <code>string</code>                                   | The key-pair tag.                                       |
| **`algorithm`** | <code>'ecdsa' \| 'ecdh'</code>                        | The elliptic curve algorithm                            |
| **`type`**      | <code><a href="#biometrytype">BiometryType</a></code> | Biometry type if key is possibly secured with biometry. |


#### LoadKeyResponse

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`publicKey`** | <code>string</code> | The public-key in base64 format. |


#### LoadKeyOptions

| Prop            | Type                           | Description                                              |
| --------------- | ------------------------------ | -------------------------------------------------------- |
| **`tag`**       | <code>string</code>            | The key-pair tag.                                        |
| **`algorithm`** | <code>'ecdsa' \| 'ecdh'</code> | The elliptic curve algorithm was used to create the key. |


#### DeleteKeyOptions

| Prop            | Type                           | Description                                              |
| --------------- | ------------------------------ | -------------------------------------------------------- |
| **`tag`**       | <code>string</code>            | The key-pair tag.                                        |
| **`algorithm`** | <code>'ecdsa' \| 'ecdh'</code> | The elliptic curve algorithm was used to create the key. |


#### SignResponse

| Prop            | Type                | Description                     |
| --------------- | ------------------- | ------------------------------- |
| **`signature`** | <code>string</code> | The signature in base64 format. |


#### SignOptions

| Prop       | Type                                                  | Description                                             |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------- |
| **`tag`**  | <code>string</code>                                   | The key-pair tag.                                       |
| **`data`** | <code>string</code>                                   | The data to sign.                                       |
| **`type`** | <code><a href="#biometrytype">BiometryType</a></code> | Biometry type if key is possibly secured with biometry. |


#### VerifyResponse

| Prop           | Type                 | Description                        |
| -------------- | -------------------- | ---------------------------------- |
| **`verified`** | <code>boolean</code> | Whether the signature is verified. |


#### VerifyOptions

| Prop                   | Type                | Description                              |
| ---------------------- | ------------------- | ---------------------------------------- |
| **`foreignPublicKey`** | <code>string</code> | The foreign public-key in base64 format. |
| **`data`**             | <code>string</code> | The signed data.                         |
| **`signature`**        | <code>string</code> | The signature in base64 format.          |


#### EncryptResponse

| Prop             | Type                | Description                                       |
| ---------------- | ------------------- | ------------------------------------------------- |
| **`iv`**         | <code>string</code> | The iv in base64 format.                          |
| **`ciphertext`** | <code>string</code> | The ciphertext (encrypted data) in base64 format. |


#### EncryptOptions

| Prop                   | Type                                                  | Description                                             |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| **`tag`**              | <code>string</code>                                   | The key-pair tag.                                       |
| **`foreignPublicKey`** | <code>string</code>                                   | The foreign public-key in base64 format.                |
| **`plaintext`**        | <code>string</code>                                   | The plaintext to be encrypted.                          |
| **`type`**             | <code><a href="#biometrytype">BiometryType</a></code> | Biometry type if key is possibly secured with biometry. |


#### DecryptResponse

| Prop            | Type                | Description              |
| --------------- | ------------------- | ------------------------ |
| **`plaintext`** | <code>string</code> | The decrypted plaintext. |


#### DecryptOptions

| Prop                   | Type                                                  | Description                                             |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| **`tag`**              | <code>string</code>                                   | The key-pair tag.                                       |
| **`foreignPublicKey`** | <code>string</code>                                   | The foreign public-key in base64 format.                |
| **`iv`**               | <code>string</code>                                   | The iv in base64 format.                                |
| **`ciphertext`**       | <code>string</code>                                   | The ciphertext (encrypted data) in base64 format.       |
| **`type`**             | <code><a href="#biometrytype">BiometryType</a></code> | Biometry type if key is possibly secured with biometry. |


#### BiometricsEnabledResponse

| Prop            | Type                 | Description                  |
| --------------- | -------------------- | ---------------------------- |
| **`isEnabled`** | <code>boolean</code> | Whether biometry is enabled. |


#### BiometricsEnabledOptions

| Prop       | Type                                                  | Description                                            |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------ |
| **`type`** | <code><a href="#biometrytype">BiometryType</a></code> | The biometry type whose availability is to be checked. |


#### BiometricsStatusResponse

| Prop         | Type                                                          | Description                       |
| ------------ | ------------------------------------------------------------- | --------------------------------- |
| **`status`** | <code><a href="#biometricsstatus">BiometricsStatus</a></code> | Status of biometry on the device. |


#### BiometricsStatusOptions

| Prop       | Type                                                  | Description                                            |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------ |
| **`type`** | <code><a href="#biometrytype">BiometryType</a></code> | The biometry type whose availability is to be checked. |


#### AvailableHardwareResponse

| Prop           | Type                              | Description                          |
| -------------- | --------------------------------- | ------------------------------------ |
| **`hardware`** | <code>BiometricsHardware[]</code> | List of available biometry hardware. |


#### DevicePasscodeResponse

| Prop                      | Type                 | Description                     |
| ------------------------- | -------------------- | ------------------------------- |
| **`isDevicePasscodeSet`** | <code>boolean</code> | Whether device passcode is set. |


#### SecureHardwareResponse

| Prop                    | Type                 | Description                             |
| ----------------------- | -------------------- | --------------------------------------- |
| **`hasSecureHardware`** | <code>boolean</code> | Whether the device has secure hardware. |


#### RegisterPasskeyResult

| Prop                          | Type                                                                |
| ----------------------------- | ------------------------------------------------------------------- |
| **`id`**                      | <code>string</code>                                                 |
| **`rawId`**                   | <code>string</code>                                                 |
| **`type`**                    | <code>string</code>                                                 |
| **`response`**                | <code>{ attestationObject: string; clientDataJSON: string; }</code> |
| **`authenticatorAttachment`** | <code>string</code>                                                 |


#### RegisterPasskeyOptions

| Prop                         | Type                                                                     |
| ---------------------------- | ------------------------------------------------------------------------ |
| **`challenge`**              | <code>string</code>                                                      |
| **`rp`**                     | <code>{ id: string; name: string; }</code>                               |
| **`user`**                   | <code>{ id: string; name: string; displayName: string; }</code>          |
| **`pubKeyCredParams`**       | <code>PublicKeyCredentialParameters[]</code>                             |
| **`authenticatorSelection`** | <code>{ residentKey: 'required'; userVerification: 'preferred'; }</code> |
| **`extensions`**             | <code>{ credProps: boolean; }</code>                                     |


#### PublicKeyCredentialParameters

| Prop       | Type                      |
| ---------- | ------------------------- |
| **`type`** | <code>'public-key'</code> |
| **`alg`**  | <code>-7</code>           |


#### AuthenticateWithPasskeyResult

| Prop                          | Type                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **`id`**                      | <code>string</code>                                                                                         |
| **`rawId`**                   | <code>string</code>                                                                                         |
| **`type`**                    | <code>string</code>                                                                                         |
| **`response`**                | <code>{ authenticatorData: string; clientDataJSON: string; signature: string; userHandle?: string; }</code> |
| **`authenticatorAttachment`** | <code>string</code>                                                                                         |


#### AuthenticateWithPasskeyOptions

| Prop                   | Type                      |
| ---------------------- | ------------------------- |
| **`challenge`**        | <code>string</code>       |
| **`rpId`**             | <code>string</code>       |
| **`allowCredentials`** | <code>Credential[]</code> |
| **`userVerification`** | <code>'required'</code>   |


#### Credential

| Prop       | Type                      |
| ---------- | ------------------------- |
| **`type`** | <code>'public-key'</code> |
| **`id`**   | <code>string</code>       |


### Type Aliases


#### BiometryType

<code>'BIOMETRY' | 'BIOMETRY_OR_PASSCODE' | 'PASSCODE'</code>


#### BiometricsStatus

<code>'SUCCESS' | 'HARDWARE_UNAVAILABLE' | 'NONE_ENROLLED' | 'UNKNOWN'</code>


#### BiometricsHardware

<code>'FINGER' | 'IRIS' | 'FACE'</code>

</docgen-api>
