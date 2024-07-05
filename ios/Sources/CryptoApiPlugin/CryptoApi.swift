import Foundation

@objc public class CryptoApi: NSObject {
    @objc public func generateKey(_ tag: String, _ algorithm: String) -> String {
        print(tag)
        print(algorithm)
        return tag
    }

    @objc public func loadKey(_ tag: String) -> String {
        print(tag)
        return tag
    }

    @objc public func sign(_ tag: String, _ data: String) -> String {
        print(tag)
        print(data)
        return tag
    }

    @objc public func decrypt(
        _ tag: String,
        _ foreignPublicKey: String,
        _ initVector: String,
        _ encryptedData: String
    ) -> String {
        print(tag)
        print(foreignPublicKey)
        print(initVector)
        print(encryptedData)
        return tag
    }
}
