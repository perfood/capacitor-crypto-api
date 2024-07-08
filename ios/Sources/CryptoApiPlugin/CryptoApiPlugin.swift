import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(CryptoApiPlugin)
public class CryptoApiPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CryptoApiPlugin"
    public let jsName = "CryptoApi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "generateKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sign", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "decrypt", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = CryptoApi()

    @objc func generateKey(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        let algorithm = call.getString("algorithm") ?? ""

        guard let publicKey = implementation.generateKey(tag, algorithm) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "publicKey": publicKey
        ])
    }

    @objc func loadKey(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""

        guard let publicKey = implementation.loadKey(tag) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "publicKey": publicKey
        ])
    }

    @objc func sign(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        let data = call.getString("data") ?? ""

        guard let signature = implementation.sign(tag, data) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "signature": signature
        ])
    }

    @objc func decrypt(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        let foreignPublicKey = call.getString("foreignPublicKey") ?? ""
        let initVector = call.getString("initVector") ?? ""
        let encryptedData = call.getString("encryptedData") ?? ""

        guard let data = implementation.decrypt(tag, foreignPublicKey, initVector, encryptedData) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "data": data
        ])
    }
}
