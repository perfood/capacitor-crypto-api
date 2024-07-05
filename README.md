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
* [`sign(...)`](#sign)
* [`decrypt(...)`](#decrypt)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### generateKey(...)

```typescript
generateKey(options: { tag: string; algorithm: CryptoApiAlgorithm; }) => Promise<{ publicKey: string; }>
```

Generates a key-pair in the Secure Enclave (iOS) or StrongBox/TEE (Android),
tags it for alter referencing and returns the public-key only,
since the private-key is protected and can't be extracted.

| Param         | Type                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ tag: string; algorithm: <a href="#cryptoapialgorithm">CryptoApiAlgorithm</a>; }</code> |

**Returns:** <code>Promise&lt;{ publicKey: string; }&gt;</code>

**Since:** 1.0.0

--------------------


### loadKey(...)

```typescript
loadKey(options: { tag: string; }) => Promise<{ publicKey: string; }>
```

Loads the public-key from the Secure Enclave (iOS) or StrongBox/TEE (Android).

| Param         | Type                          |
| ------------- | ----------------------------- |
| **`options`** | <code>{ tag: string; }</code> |

**Returns:** <code>Promise&lt;{ publicKey: string; }&gt;</code>

**Since:** 1.0.0

--------------------


### sign(...)

```typescript
sign(options: { tag: string; data: string; }) => Promise<{ signature: string; }>
```

Signs the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
Uses the private-key associated with the tag.

Only ECDSA is supported.

| Param         | Type                                        |
| ------------- | ------------------------------------------- |
| **`options`** | <code>{ tag: string; data: string; }</code> |

**Returns:** <code>Promise&lt;{ signature: string; }&gt;</code>

**Since:** 1.0.0

--------------------


### decrypt(...)

```typescript
decrypt(options: { tag: string; foreignPublicKey: string; iv: string; encryptedData: string; }) => Promise<{ data: string; }>
```

Decrypts the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
Uses the private-key associated with the tag, the foreign public-key and the iv provided.

Only ECDH is supported.

| Param         | Type                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ |
| **`options`** | <code>{ tag: string; foreignPublicKey: string; iv: string; encryptedData: string; }</code> |

**Returns:** <code>Promise&lt;{ data: string; }&gt;</code>

**Since:** 1.0.0

--------------------


### Type Aliases


#### CryptoApiAlgorithm

<code>'ECDH' | 'ECDSA'</code>

</docgen-api>
