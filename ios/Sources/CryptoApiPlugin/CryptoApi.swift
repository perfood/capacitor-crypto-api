import Foundation
import CryptoKit

@objc public class CryptoApi: NSObject {
    struct Constants {
        static let ECHeader = [UInt8]([
            /* sequence          */ 0x30, 0x59,
            /* |-> sequence      */ 0x30, 0x13,
            /* |---> ecPublicKey */ 0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01,
            /* |---> prime256v1  */ 0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01,
            /* |-> bit headers   */ 0x07, 0x03, 0x42, 0x00
        ])
        static let LabelECDSA = "CryptoApiECDSA"
    }

    @objc public func list() -> [String] {
        print("CryptoApi.list")

        var list = [String]()

        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrLabel as String: Constants.LabelECDSA,
            kSecAttrKeyType as String: kSecAttrKeyTypeEC,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess else {
            return list
        }

        guard let array = result as? [[String: Any]] else {
            return list
        }

        for item in array {
            guard let aTag = item[kSecAttrApplicationTag as String] as? Data else {
                continue
            }

            if let tag = String(data: aTag, encoding: .utf8) {
                list.append(tag)
            }
        }

        return list
    }

    @objc public func generateKey(_ tag: String) -> String? {
        print("CryptoApi.generateKey", tag)

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
                kSecAttrLabel as String: Constants.LabelECDSA,
                kSecAttrAccessControl as String: SecAccessControlCreateWithFlags(
                    kCFAllocatorDefault,
                    kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                    .privateKeyUsage,
                    nil)!
            ]
        ]

        var error: Unmanaged<CFError>?
        guard SecKeyCreateRandomKey(attributes as CFDictionary, &error) != nil else {
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

        guard let signature = SecKeyCreateSignature(privateKey,
                                                    .ecdsaSignatureMessageX962SHA256,
                                                    data.data(using: .utf8)! as CFData,
                                                    &error) as Data? else {
            return nil
        }

        return signature.base64EncodedString()
    }

    @objc public func verify(_ foreignPublicKeyBase64: String, _ data: String, _ signatureBase64: String) -> Bool {
        print("CryptoApi.verify", foreignPublicKeyBase64, data, signatureBase64)

        guard let foreignPublicKey = loadPublicKeyFromBase64(foreignPublicKeyBase64) else {
            return false
        }

        guard let signature = Data.init(base64Encoded: signatureBase64) else {
            return false
        }

        var error: Unmanaged<CFError>?
        guard SecKeyVerifySignature(foreignPublicKey,
                                    .ecdsaSignatureMessageX962SHA256,
                                    data.data(using: .utf8)! as CFData,
                                    signature as CFData,
                                    &error) else {
            return false
        }

        return true
    }

    @objc private func getPrivateKey(_ tag: String) -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
            kSecAttrLabel as String: Constants.LabelECDSA,
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

        var ecPublicKey = Data()
        ecPublicKey.append(Data(Constants.ECHeader))
        ecPublicKey.append(publicKeyData as Data)

        return ecPublicKey.base64EncodedString()
    }

    @objc private func loadPublicKeyFromBase64(_ publicKeyBase64: String) -> SecKey? {
        guard let secKeyData = Data.init(base64Encoded: publicKeyBase64) else {
            return nil
        }

        guard let secKeyHeaderRange = secKeyData.range(of: Data(Constants.ECHeader)) else {
            return nil
        }

        let attributes: [String: Any] = [
            kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
            kSecAttrKeyType as String: kSecAttrKeyTypeEC,
            kSecAttrKeySizeInBits as String: 256
        ]

        var error: Unmanaged<CFError>?
        guard let secKey = SecKeyCreateWithData(secKeyData.suffix(from: secKeyHeaderRange.upperBound) as CFData,
                                                attributes as CFDictionary,
                                                &error) else {
            return nil
        }

        return secKey
    }
}
