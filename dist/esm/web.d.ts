import { WebPlugin } from '@capacitor/core';
import type { AuthenticateWithPasskeyOptions, AuthenticateWithPasskeyResult, AvailableHardwareResponse, BiometricsEnabledOptions, BiometricsEnabledResponse, BiometricsStatusOptions, BiometricsStatusResponse, CryptoApiPlugin, DecryptOptions, DecryptResponse, DeleteKeyOptions, DevicePasscodeResponse, EncryptOptions, EncryptResponse, GenerateKeyOptions, GenerateKeyResponse, GetTagsResponse, LoadKeyOptions, LoadKeyResponse, RegisterPasskeyOptions, RegisterPasskeyResult, SecureHardwareResponse, SignOptions, SignResponse, VerifyOptions, VerifyResponse } from './definitions';
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
    isBiometricsEnabled(options: BiometricsEnabledOptions): Promise<BiometricsEnabledResponse>;
    getBiometricsStatus(options: BiometricsStatusOptions): Promise<BiometricsStatusResponse>;
    getAvailableHardware(): Promise<AvailableHardwareResponse>;
    isDevicePasscodeSet(): Promise<DevicePasscodeResponse>;
    hasSecureHardware(): Promise<SecureHardwareResponse>;
    registerPasskey(options: RegisterPasskeyOptions): Promise<RegisterPasskeyResult>;
    authenticateWithPasskey(options: AuthenticateWithPasskeyOptions): Promise<AuthenticateWithPasskeyResult>;
    private importKey;
    private deriveKey;
    private getLabel;
    private bufferToBase64url;
}
