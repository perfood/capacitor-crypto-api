/**
 * ECDSA key algorithm.
 */
export const CRYPTO_API_ECDSA_KEY_ALGORITHM = {
  name: 'ECDSA',
  namedCurve: 'P-256',
};
/**
 * ECDSA sign algorithm.
 */
export const CRYPTO_API_ECDSA_SIGN_ALGORITHM = {
  name: 'ECDSA',
  hash: { name: 'SHA-256' },
};

/**
 * ECDH key algorithm.
 */
export const CRYPTO_API_ECDH_KEY_ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};


export const PRIVATE_KEY_FORMAT = "pkcs8";

export const PUBLIC_KEY_FORMAT = "spki";

export const CRYPTO_API_AES_GCM_ALGORITHM = "AES-GCM";

export const CRYPTO_API_ECDH_ALGORITHM = "ECDH";

export const SECRET_KEY_LENGHT = 256;

export const IV_LENGTH = 12;

export interface ListResponse {
  /**
   * The key-pair tags.
   */
  list: string[];
}

export interface GenerateKeyOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * The elliptic curve algorithm
   */
  algorithm: "ecdsa" | "ecdh";
}

export interface GenerateKeyResponse {
  /**
   * The public-key in base64 format.
   */
  publicKey?: string;
}

export interface LoadKeyOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * Key label.
   */
  label: string;
}

export interface LoadKeyResponse {
  /**
   * The public-key in base64 format.
   */
  publicKey?: string;
}

export interface DeleteKeyOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * Key label.
   */
  label: string;
}

export interface SignOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * The data to sign.
   */
  data: string;
}
export interface SignResponse {
  /**
   * The signature in base64 format.
   */
  signature?: string;
}

export interface VerifyOptions {
  /**
   * The foreign public-key in base64 format.
   */
  foreignPublicKey: string;
  /**
   * The signed data.
   */
  data: string;
  /**
   * The signature in base64 format.
   */
  signature: string;
}

export interface VerifyResponse {
  /**
   * Whether the signature is verified.
   */
  verified: boolean;
}

export interface EncryptOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * The data to be encrypted.
   */
  data: string;
}

export interface EncryptResponse {
  /**
   * JSON string which includes iv and encrypted data.
   */
  encrypted: string;
}

export interface DecryptOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * The encrypted data to be decrypted.
   */
  data: string;
}

export interface DecryptResponse {
  /**
   * Decrypted data.
   */
  decrypted: string;
}


export interface CryptoApiPlugin {
  /**
   * Returns all key-pair tags that are available in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   */
  list(): Promise<ListResponse>;

  /**
   * Generates a key-pair in the Secure Enclave (iOS) or StrongBox/TEE (Android),
   * tags it for alter referencing and returns the public-key only,
   * since the private-key is protected and can't be extracted.
   *
   * @since 1.0.0
   */
  generateKey(options: GenerateKeyOptions): Promise<GenerateKeyResponse>;

  /**
   * Loads the public-key from the Secure Enclave (iOS) or StrongBox/TEE (Android).
   *
   * @since 1.0.0
   */
  loadKey(options: LoadKeyOptions): Promise<LoadKeyResponse>;

  /**
   * Deletes the key-pair from the Secure Enclave (iOS) or StrongBox/TEE (Android).
   *
   * @since 1.0.0
   */
  deleteKey(options: DeleteKeyOptions): Promise<void>;

  /**
   * Signs the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   * Uses the private-key associated with the tag.
   *
   * Only ECDSA is supported.
   *
   * @since 1.0.0
   */
  sign(options: SignOptions): Promise<SignResponse>;

  /**
   * Verifies the signature of the data with the foreign public-key.
   *
   * Only ECDSA is supported.
   *
   * @since 1.0.0
   */
  verify(options: VerifyOptions): Promise<VerifyResponse>;

  /**
   * Encrypt data with AES-GCM.
   */
  encrypt(options: EncryptOptions): Promise<EncryptResponse>;
  
  /**
   * Decrypt data with AES-GCM.
   */
  decrypt(options: DecryptOptions): Promise<DecryptResponse>;
}
