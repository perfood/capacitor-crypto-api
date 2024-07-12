# @perfood/capacitor-crypto-api

This is a capacitor plugin that provides a simple API to generate key-pairs in the Secure Enclave (iOS) or StrongBox/TEE (Android) and use them to sign and verify data.

## Limitations of the Secure Enclave (iOS)

> "Works only with NIST P-256 elliptic curve keys. These keys can only be used for creating and verifying cryptographic signatures, or for elliptic curve Diffie-Hellman key exchange (and by extension, symmetric encryption)." - [Apple Developer Documentation](https://developer.apple.com/documentation/security/certificate_key_and_trust_services/keys/protecting_keys_with_the_secure_enclave)

Since the Secure Enclave only supports the NIST P-256 elliptic curve, only ECDSA is supported. ECDH is not supported, but may be supported in the future. PRs are welcome.

## Format of the signature

Secure Enclave (iOS) and StrongBox/TEE (Android) return the signature in ASN.1 DER format. The WebCrypto API returns the signature in raw (IEEE P1363) format.

This plugin has the functions `derToP1363` and `p1363ToDer` to convert the signature from ASN.1 DER to raw (IEEE P1363) format and vice versa.

## For development

The plugin also uses the WebCrypto API to generate key-pairs in the browser and use them to sign and verify data. The key-pairs are stored in the browser's local storage.

> WebCrypto API is only available in secure contexts (https)

## Use Case

This can be used to realize a 2-factor-authentication mechanism, where the private-key is stored in the Secure Enclave (iOS) or StrongBox/TEE (Android) and the public-key is stored on the server.

The server creates a challenge and sends it to the client. The client signs the challenge with the private-key and sends the signed data back to the server.

The server can then verify the signature of the data with the public-key and be sure that the data was signed by the private-key.

There is an example in the [`example`](./example/README.md) directory.

## Install

```bash
npm install @perfood/capacitor-crypto-api
npx cap sync
```

## API

<docgen-index>

* [`generateKey(...)`](#generatekey)
* [`loadKey(...)`](#loadkey)
* [`deleteKey(...)`](#deletekey)
* [`sign(...)`](#sign)
* [`verify(...)`](#verify)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### generateKey(...)

```typescript
generateKey(options: GenerateKeyOptions) => Promise<GenerateKeyResponse>
```

Generates a key-pair in the Secure Enclave (iOS) or StrongBox/TEE (Android),
tags it for alter referencing and returns the public-key only,
since the private-key is protected and can't be extracted.

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


### Interfaces


#### GenerateKeyResponse

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`publicKey`** | <code>string</code> | The public-key in base64 format. |


#### GenerateKeyOptions

| Prop      | Type                | Description       |
| --------- | ------------------- | ----------------- |
| **`tag`** | <code>string</code> | The key-pair tag. |


#### LoadKeyResponse

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`publicKey`** | <code>string</code> | The public-key in base64 format. |


#### LoadKeyOptions

| Prop      | Type                | Description       |
| --------- | ------------------- | ----------------- |
| **`tag`** | <code>string</code> | The key-pair tag. |


#### DeleteKeyOptions

| Prop      | Type                | Description       |
| --------- | ------------------- | ----------------- |
| **`tag`** | <code>string</code> | The key-pair tag. |


#### SignResponse

| Prop            | Type                | Description                     |
| --------------- | ------------------- | ------------------------------- |
| **`signature`** | <code>string</code> | The signature in base64 format. |


#### SignOptions

| Prop       | Type                | Description       |
| ---------- | ------------------- | ----------------- |
| **`tag`**  | <code>string</code> | The key-pair tag. |
| **`data`** | <code>string</code> | The data to sign. |


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

</docgen-api>
