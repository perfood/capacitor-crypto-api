import { WebPlugin } from '@capacitor/core';
import type { CryptoApiPlugin, DecryptOptions, DecryptResponse, DeleteKeyOptions, EncryptOptions, EncryptResponse, GenerateKeyOptions, GenerateKeyResponse, GetTagsResponse, LoadKeyOptions, LoadKeyResponse, SignOptions, SignResponse, VerifyOptions, VerifyResponse } from './definitions';
export declare class CryptoApiWeb extends WebPlugin implements CryptoApiPlugin {
    getECDSATags(): Promise<GetTagsResponse>;
    getECDHTags(): Promise<GetTagsResponse>;
    generateKey(options: GenerateKeyOptions): Promise<GenerateKeyResponse>;
    loadKey(options: LoadKeyOptions): Promise<LoadKeyResponse>;
    deleteKey(options: DeleteKeyOptions): Promise<void>;
    sign(options: SignOptions): Promise<SignResponse>;
    verify(options: VerifyOptions): Promise<VerifyResponse>;
    encrypt(options: EncryptOptions): Promise<EncryptResponse>;
    decrypt(options: DecryptOptions): Promise<DecryptResponse>;
    private importKey;
    private deriveKey;
    private getLabel;
}
