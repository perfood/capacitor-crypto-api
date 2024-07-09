import Foundation
import CryptoKit

@objc public class CryptoApi: NSObject {
    @objc public func generateKey(_ tag: String, _ algorithm: String) -> String? {
        print("CryptoApi.generateKey", tag, algorithm)

        let publicKeyFound = loadKey(tag)
        if publicKeyFound != nil {
            return publicKeyFound
        }

        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeEC,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
                kSecAttrAccessControl as String: SecAccessControlCreateWithFlags(
                    kCFAllocatorDefault,
                    kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                    .privateKeyUsage,
                    nil)!
            ]
        ]

        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            return nil
        }

        return getPublicKeyBase64(tag)
    }

    @objc public func loadKey(_ tag: String) -> String? {
        print("CryptoApi.loadKey", tag)

        return getPublicKeyBase64(tag)
    }

    @objc public func deleteKey(_ tag: String) {
        print("CryptoApi.loadKey", tag)

        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
            kSecAttrKeyType as String: kSecAttrKeyTypeEC
        ]

        SecItemDelete(query as CFDictionary)
    }

    @objc public func sign(_ tag: String, _ data: String) -> String? {
        print("CryptoApi.sign", tag, data)

        guard let privateKey = getPrivateKey(tag) else {
            return nil
        }

        var error: Unmanaged<CFError>?

        if #available(iOS 17.0, *) {
            guard let signature = SecKeyCreateSignature(privateKey,
                                                        .ecdsaSignatureMessageRFC4754SHA256,
                                                        data.data(using: .utf8)!  as CFData,
                                                        &error) as Data? else {
                return nil
            }

            return signature.base64EncodedString()
        }

        return nil
    }

    @objc public func decrypt(
        _ tag: String,
        _ foreignPublicKey: String,
        _ initVector: String,
        _ encryptedData: String
    ) -> String? {
        print("CryptoApi.decrypt", tag, foreignPublicKey, initVector, encryptedData)
        return tag
    }

    @objc private func getPrivateKey(_ tag: String) -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
            kSecAttrKeyType as String: kSecAttrKeyTypeEC,
            kSecReturnRef as String: true
        ]

        var privateKey: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &privateKey)
        guard status == errSecSuccess else {
            return nil
        }

        return privateKey as! SecKey
    }

    @objc private func getPublicKeyBase64(_ tag: String) -> String? {
        guard let privateKey = getPrivateKey(tag) else {
            return nil
        }

        guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
            return nil
        }

        var error: Unmanaged<CFError>?
        guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) else {
            return nil
        }

        let ecHeader: [UInt8] = [
            /* sequence          */ 0x30, 0x59,
            /* |-> sequence      */ 0x30, 0x13,
            /* |---> ecPublicKey */ 0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01,
            /* |---> prime256v1  */ 0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01,
            /* |-> bit headers   */ 0x07, 0x03, 0x42, 0x00
        ]

        var ecPublicKey = Data()
        ecPublicKey.append(Data(ecHeader))
        ecPublicKey.append(publicKeyData as Data)

        return ecPublicKey.base64EncodedString()
    }
}
