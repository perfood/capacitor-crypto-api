export type CryptoApiAlgorithm = 'ECDH' | 'ECDSA';

export interface CryptoApiPlugin {
  /**
   * Generates a key-pair in the Secure Enclave (iOS) or StrongBox/TEE (Android),
   * tags it for alter referencing and returns the public-key only,
   * since the private-key is protected and can't be extracted.
   *
   * @since 1.0.0
   */
  generateKey(options: {
    /**
     * The key-pair tag.
     */
    tag: string;
    /**
     * The algorithm to use for the key-pair.
     * Only ECDH (encryption/decryption) and ECDSA (signing/verifying) is supported.
     */
    algorithm: CryptoApiAlgorithm;
  }): Promise<{
    /**
     * The public-key in base64 format.
     */
    publicKey: string;
  }>;

  /**
   * Loads the public-key from the Secure Enclave (iOS) or StrongBox/TEE (Android).
   *
   * @since 1.0.0
   */
  loadKey(options: {
    /**
     * The key-pair tag.
     */
    tag: string;
  }): Promise<{
    /**
     * The public-key in base64 format.
     */
    publicKey: string;
  }>;

  /**
   * Signs the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   * Uses the private-key associated with the tag.
   *
   * Only ECDSA is supported.
   *
   * @since 1.0.0
   */
  sign(options: {
    /**
     * The key-pair tag.
     */
    tag: string;
    /**
     * The data to sign in base64 format.
     */
    data: string;
  }): Promise<{
    /**
     * The signature in base64 format.
     */
    signature: string;
  }>;

  /**
   * Decrypts the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   * Uses the private-key associated with the tag, the foreign public-key
   * and the initialization vector provided.
   *
   * Only ECDH is supported.
   *
   * @since 1.0.0
   */
  decrypt(options: {
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
  }): Promise<{
    /**
     * The decrypted data in base64 format.
     */
    data: string;
  }>;
}
