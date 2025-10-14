@objc public class PasskeyApi: NSObject {
    @objc public func registerPasskey() -> [String: String] {
        print("PasskeyApi.registerPasskey")
        let resultDict: [String: String] = [
            // "iv": Data(iv).base64EncodedString(),
            // "ciphertext": (sealedBox.ciphertext + sealedBox.tag).base64EncodedString()
        ]

        return resultDict
    }

    @objc public func authenticateWithPasskey() -> [String: String] {
        print("PasskeyApi.authenticateWithPasskey")
        let resultDict: [String: String] = [
            // "iv": Data(iv).base64EncodedString(),
            // "ciphertext": (sealedBox.ciphertext + sealedBox.tag).base64EncodedString()
        ]

        return resultDict
    }
}
