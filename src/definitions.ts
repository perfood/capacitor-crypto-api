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

export const PRIVATE_KEY_FORMAT = 'pkcs8';

export const PUBLIC_KEY_FORMAT = 'spki';

export const CRYPTO_API_AES_GCM_ALGORITHM = 'AES-GCM';

export const CRYPTO_API_ECDH_ALGORITHM = 'ECDH';

export const SECRET_KEY_LENGHT = 256;

export const IV_LENGTH = 12;

export enum BiometryType {
  BIOMETRY = 'BIOMETRY', // biometryCurrentSet (iOS), KeyProperties.AUTH_BIOMETRIC_STRONG (android)
  BIOMETRY_OR_PASSCODE = 'BIOMETRY_OR_PASSCODE', // userPresence (iOS), KeyProperties.AUTH_BIOMETRIC_STRONG | KeyProperties.AUTH_DEVICE_CREDENTIAL (android)
  PASSCODE = 'PASSCODE', // devicePasscode (iOS), KeyProperties.AUTH_DEVICE_CREDENTIAL (android)
}

export interface GetTagsResponse {
  /**
   * The key-pair tags.
   */
  tags: string[];
}

export interface GenerateKeyOptions {
  /**
   * The key-pair tag.
   */
  tag: string;
  /**
   * The elliptic curve algorithm
   */
  algorithm: 'ecdsa' | 'ecdh';
  /**
   * secured with biometry type?
   */
  type?: BiometryType;
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
   * The elliptic curve algorithm was used to create the key.
   */
  algorithm: 'ecdsa' | 'ecdh';
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
   * The elliptic curve algorithm was used to create the key.
   */
  algorithm: 'ecdsa' | 'ecdh';
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
   * The foreign public-key in base64 format.
   */
  foreignPublicKey: string;
  /**
   * The plaintext to be encrypted.
   */
  plaintext: string;
}

export interface EncryptResponse {
  /**
   * The iv in base64 format.
   */
  iv: string;
  /**
   * The ciphertext (encrypted data) in base64 format.
   */
  ciphertext: string;
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
   * The iv in base64 format.
   */
  iv: string;
  /**
   * The ciphertext (encrypted data) in base64 format.
   */
  ciphertext: string;
}

export interface DecryptResponse {
  /**
   * The decrypted plaintext.
   */
  plaintext: string;
}

export interface BiometricsEnabledOptions {
  type: BiometryType;
}

export interface BiometricsEnabledResponse {
  isEnabled: boolean;
}

export interface BiometricsStatusOptions {
  type: BiometryType;
}

export enum BiometricsStatus {
  SUCCESS = 'SUCCESS',
  HARDWARE_UNAVAILABLE = 'HARDWARE_UNAVAILABLE',
  NONE_ENROLLED = 'NONE_ENROLLED',
  UNKNOWN = 'UNKNOWN',
}

export interface BiometricsStatusResponse {
  status: BiometricsStatus;
}

export enum BiometricsHardware {
  FINGER,
  IRIS,
  FACE,
}

export interface AvailableHardwareResponse {
  hardware: BiometricsHardware[];
}

export interface DevicePasscodeResponse {
  isDevicePasscodeSet: boolean;
}

export interface EnrollOptions {
  type: BiometryType;
}

export interface RegisterOptions {
  type: BiometryType;
}

export interface CryptoApiPlugin {
  /**
   * Returns all ECDSA key-pair tags that are available in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   */
  getECDSATags(): Promise<GetTagsResponse>;

  /**
   * Returns all ECDH key-pair tags that are available in the Secure Enclave (iOS) or StrongBox/TEE (Android).
   */
  getECDHTags(): Promise<GetTagsResponse>;

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

  /**
   *
   */
  isBiometricsEnabled(options: BiometricsEnabledOptions): Promise<BiometricsEnabledResponse>;

  /**
   *
   */
  getBiometricsStatus(options: BiometricsStatusOptions): Promise<BiometricsStatusResponse>;

  /**
   *
   */
  getAvailableHardware(): Promise<AvailableHardwareResponse>;

  /**
   *
   */
  isDevicePasscodeSet(): Promise<DevicePasscodeResponse>;

  /**
   *
   */
  enrollBiometrics(optione: EnrollOptions): Promise<void>;

  /**
   *
   */
  register(optione: RegisterOptions): Promise<void>;

  // loginWithBiometry(): Promise<void>;

  // activateBiometry(): Promise<void>;

  // isBiometryPermitted(): Promise<boolean>
}
