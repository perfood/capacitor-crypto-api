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
        static let LabelECDH = "CryptoApiECDH"
    }

    @objc public func getTags(_ algorithm: String) -> [String] {
        print("CryptoApi.getTags", algorithm)

        var list = [String]()

        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrLabel as String: getLabel(algorithm),
            kSecAttrKeyType as String: kSecAttrKeyTypeEC,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let array = result as? [[String: Any]] else {
            return list
        }

        for item in array {
            if let aTag = item[kSecAttrApplicationTag as String] as? Data,
               let tag = String(data: aTag, encoding: .utf8) {
                list.append(tag)
            }
        }

        return list
    }

    @objc public func generateKey(_ tag: String, _ algorithm: String) -> String? {
        print("CryptoApi.generateKey", tag, algorithm)

        let publicKeyFound = loadKey(tag, algorithm)
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
                kSecAttrLabel as String: getLabel(algorithm),
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

        return getPublicKeyBase64(tag, algorithm)
    }

    @objc public func loadKey(_ tag: String, _ algorithm: String) -> String? {
        print("CryptoApi.loadKey", tag, algorithm)

        return getPublicKeyBase64(tag, algorithm)
    }

    @objc public func deleteKey(_ tag: String, _ algorithm: String) {
        print("CryptoApi.deleteKey", tag, algorithm)

        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
            kSecAttrLabel as String: getLabel(algorithm),
            kSecAttrKeyType as String: kSecAttrKeyTypeEC
        ]
        SecItemDelete(query as CFDictionary)
    }

    @objc public func sign(_ tag: String, _ data: String) -> String? {
        print("CryptoApi.sign", tag, data)

        guard let privateKey = getPrivateKey(tag, "ecdsa") else {
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

        guard let foreignPublicKey = loadPublicKeyFromBase64(foreignPublicKeyBase64),
              let signature = Data(base64Encoded: signatureBase64) else {
            return false
        }

        var error: Unmanaged<CFError>?
        return SecKeyVerifySignature(foreignPublicKey,
                                     .ecdsaSignatureMessageX962SHA256,
                                     data.data(using: .utf8)! as CFData,
                                     signature as CFData,
                                     &error)
    }

    @objc public func encrypt(_ tag: String, _ foreignPublicKey: String, _ plaintext: String) -> [String: String]? {
        print("CryptoApi.encrypt", tag, foreignPublicKey, plaintext)

        guard let symmetricKey = deriveSecret(tag, foreignPublicKey),
              let plaintextData = plaintext.data(using: .utf8) else {
            return nil
        }

        do {
            let iv = AES.GCM.Nonce()
            let sealedBox = try AES.GCM.seal(plaintextData, using: symmetricKey, nonce: iv)

            let resultDict: [String: String] = [
                "iv": Data(iv).base64EncodedString(),
                "ciphertext": (sealedBox.ciphertext + sealedBox.tag).base64EncodedString()
            ]

            return resultDict
        } catch {
            print("CryptoApi.encrypt failed:", error)
            return nil
        }
    }

    @objc public func decrypt(_ tag: String, _ foreignPublicKey: String, _ iv: String, _ ciphertext: String) -> String? {
        print("CryptoApi.decrypt", tag, foreignPublicKey, iv, ciphertext)

        guard let ivData = Data(base64Encoded: iv),
              let combinedData = Data(base64Encoded: ciphertext),
              let symmetricKey = deriveSecret(tag, foreignPublicKey),
              let nonce = try? AES.GCM.Nonce(data: ivData) else {
            return nil
        }

        let tagLength = 16
        guard combinedData.count > tagLength else {
            return nil
        }

        let ciphertext = combinedData.prefix(combinedData.count - tagLength)
        let tag = combinedData.suffix(tagLength)

        do {
            let sealedBox = try AES.GCM.SealedBox(nonce: nonce, ciphertext: ciphertext, tag: tag)
            let decryptedData = try AES.GCM.open(sealedBox, using: symmetricKey)
            return String(data: decryptedData, encoding: .utf8)
        } catch {
            print("CryptoApi.decrypt failed:", error)
            return nil
        }
    }

    private func deriveSecret(_ tag: String, _ foreignPublicKey: String) -> SymmetricKey? {
        guard let secPrivateKey = getPrivateKey(tag, "ecdh"),
              let secPublicKey =  loadPublicKeyFromBase64(foreignPublicKey) else {
            return nil
        }

        var keyExchangeError: Unmanaged<CFError>?

        guard let derivedData = SecKeyCopyKeyExchangeResult(
                secPrivateKey,
                SecKeyAlgorithm.ecdhKeyExchangeStandardX963SHA256,
                secPublicKey,
                [SecKeyKeyExchangeParameter.requestedSize.rawValue as String: 32] as CFDictionary,
                &keyExchangeError)
        else {
            return nil
        }

        return SymmetricKey(data: derivedData as Data)
    }

    private func getPrivateKey(_ tag: String, _ algorithm: String) -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
            kSecAttrLabel as String: getLabel(algorithm),
            kSecAttrKeyType as String: kSecAttrKeyTypeEC,
            kSecReturnRef as String: true
        ]

        var privateKey: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &privateKey)
        guard status == errSecSuccess else {
            return nil
        }

        return (privateKey as! SecKey)
    }

    private func getPublicKeyBase64(_ tag: String, _ algorithm: String) -> String? {
        guard let publicKeyData = getPublicKeyData(tag, algorithm) else {
            return nil
        }

        var ecPublicKey = Data(Constants.ECHeader)
        ecPublicKey.append(publicKeyData)

        return ecPublicKey.base64EncodedString()
    }

    private func getPublicKeyData(_ tag: String, _ algorithm: String) -> Data? {
        guard let privateKey = getPrivateKey(tag, algorithm),
              let publicKey = SecKeyCopyPublicKey(privateKey),
              let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
            return nil
        }

        return publicKeyData
    }

    private func loadPublicKeyFromBase64(_ publicKeyBase64: String) -> SecKey? {
        guard let secKeyData = Data(base64Encoded: publicKeyBase64),
              let secKeyHeaderRange = secKeyData.range(of: Data(Constants.ECHeader)) else {
            return nil
        }

        let publicKeyData = secKeyData.suffix(from: secKeyHeaderRange.upperBound)

        let attributes: [String: Any] = [
            kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
            kSecAttrKeyType as String: kSecAttrKeyTypeEC,
            kSecAttrKeySizeInBits as String: 256
        ]

        return SecKeyCreateWithData(publicKeyData as CFData, attributes as CFDictionary, nil)
    }

    private func getLabel(_ algorithm: String) -> String {
        return algorithm.lowercased() == "ecdsa" ? Constants.LabelECDSA : Constants.LabelECDH
    }
}
