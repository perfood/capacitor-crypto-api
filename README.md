# @perfood/capacitor-crypto-api

Description

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
* [`decrypt(...)`](#decrypt)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

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
verify(options: VerifyOptions) => Promise<boolean>
```

Verifies the signature of the data with the foreign public-key.

Only ECDSA is supported.

| Param         | Type                                                    |
| ------------- | ------------------------------------------------------- |
| **`options`** | <code><a href="#verifyoptions">VerifyOptions</a></code> |

**Returns:** <code>Promise&lt;boolean&gt;</code>

**Since:** 1.0.0

--------------------


### decrypt(...)

```typescript
decrypt(options: DecryptOptions) => Promise<DecryptResponse>
```

Decrypts the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
Uses the private-key associated with the tag, the foreign public-key
and the initialization vector provided.

Only ECDH is supported.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#decryptoptions">DecryptOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#decryptresponse">DecryptResponse</a>&gt;</code>

**Since:** 1.0.0

--------------------


### Interfaces


#### GenerateKeyResponse

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`publicKey`** | <code>string</code> | The public-key in base64 format. |


#### GenerateKeyOptions

| Prop            | Type                                                              | Description                                                                                                          |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **`tag`**       | <code>string</code>                                               | The key-pair tag.                                                                                                    |
| **`algorithm`** | <code><a href="#cryptoapialgorithm">CryptoApiAlgorithm</a></code> | The algorithm to use for the key-pair. Only ECDH (encryption/decryption) and ECDSA (signing/verifying) is supported. |


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


#### VerifyOptions

| Prop                   | Type                | Description                              |
| ---------------------- | ------------------- | ---------------------------------------- |
| **`foreignPublicKey`** | <code>string</code> | The foreign public-key in base64 format. |
| **`data`**             | <code>string</code> | The signed data.                         |
| **`signature`**        | <code>string</code> | The signature in base64 format.          |


#### DecryptResponse

| Prop       | Type                | Description         |
| ---------- | ------------------- | ------------------- |
| **`data`** | <code>string</code> | The decrypted data. |


#### DecryptOptions

| Prop                   | Type                | Description                                 |
| ---------------------- | ------------------- | ------------------------------------------- |
| **`tag`**              | <code>string</code> | The key-pair tag.                           |
| **`foreignPublicKey`** | <code>string</code> | The foreign public-key in base64 format.    |
| **`initVector`**       | <code>string</code> | The initialization vector in base64 format. |
| **`encryptedData`**    | <code>string</code> | The encrypted data in base64 format.        |


### Type Aliases


#### CryptoApiAlgorithm

<code>'ECDH' | 'ECDSA'</code>

</docgen-api>
