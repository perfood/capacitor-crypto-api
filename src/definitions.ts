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
  }): Promise<{ publicKey: string }>;

  /**
   * Loads the public-key from the Secure Enclave (iOS) or StrongBox/TEE (Android).
   *
   * @since 1.0.0
   */
  loadKey(options: { tag: string }): Promise<{ publicKey: string }>;

  /**
   * Signs the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   * Uses the private-key associated with the tag.
   * 
   * Only ECDSA is supported.
   *
   * @since 1.0.0
   */
  sign(options: {
    tag: string;
    data: string;
  }): Promise<{ signature: string }>;

  /**
   * Decrypts the data in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   * Uses the private-key associated with the tag, the foreign public-key and the iv provided.
   * 
   * Only ECDH is supported.
   *
   * @since 1.0.0
   */
  decrypt(options: {
    tag: string;
    foreignPublicKey: string;
    iv: string;
    encryptedData: string;
  }): Promise<{ data: string }>;
}
