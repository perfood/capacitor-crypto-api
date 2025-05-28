/**
 * Convert a base64 string to an ArrayBuffer.
 */
export declare function base64ToArrayBuffer(base64: string): Uint8Array;
/**
 * Convert an ArrayBuffer to a base64 string.
 */
export declare function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string;
/**
 * Convert a raw (IEEE P1363) signature to an ASN.1 DER signature.
 */
export declare function p1363ToDer(sig: Uint8Array): Uint8Array;
/**
 * Convert an ASN.1 DER signature to a raw (IEEE P1363) signature.
 */
export declare function derToP1363(sig: Uint8Array): Uint8Array;
