export type CryptoApiAlgorithm = 'ECDH' | 'ECDSA';

export interface GenerateKeyOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * The algorithm to use for the key-pair.
   * Only ECDH (encryption/decryption) and ECDSA (signing/verifying) is supported.
   */
  algorithm: CryptoApiAlgorithm;
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

export interface DecryptOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * The foreign public-key in base64 format.
   */
  foreignPublicKey: string;
  /**
   * The initialization vector in base64 format.
   */
  initVector: string;
  /**
   * The encrypted data in base64 format.
   */
  encryptedData: string;
}

export interface DecryptResponse {
  /**
   * The decrypted data.
   */
  data?: string;
}

export interface CryptoApiPlugin {
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
  verify(options: VerifyOptions): Promise<boolean>;

  /**
   * Decrypts the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   * Uses the private-key associated with the tag, the foreign public-key
   * and the initialization vector provided.
   *
   * Only ECDH is supported.
   *
   * @since 1.0.0
   */
  decrypt(options: DecryptOptions): Promise<DecryptResponse>;
}
