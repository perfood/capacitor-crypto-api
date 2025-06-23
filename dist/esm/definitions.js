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
export var BiometricsStatus;
(function (BiometricsStatus) {
    BiometricsStatus["SUCCESS"] = "SUCCESS";
    BiometricsStatus["HARDWARE_UNAVAILABLE"] = "HARDWARE_UNAVAILABLE";
    BiometricsStatus["NONE_ENROLLED"] = "NONE_ENROLLED";
    BiometricsStatus["UNKNOWN"] = "UNKNOWN";
})(BiometricsStatus || (BiometricsStatus = {}));
export var BiometricsHardware;
(function (BiometricsHardware) {
    BiometricsHardware[BiometricsHardware["FINGER"] = 0] = "FINGER";
    BiometricsHardware[BiometricsHardware["IRIS"] = 1] = "IRIS";
    BiometricsHardware[BiometricsHardware["FACE"] = 2] = "FACE";
})(BiometricsHardware || (BiometricsHardware = {}));
//# sourceMappingURL=definitions.js.map