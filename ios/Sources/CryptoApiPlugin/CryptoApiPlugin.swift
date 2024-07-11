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
        CAPPluginMethod(name: "deleteKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sign", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "verify", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = CryptoApi()

    @objc func generateKey(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""

        guard let publicKey = implementation.generateKey(tag) else {
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

    @objc func deleteKey(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""

        implementation.deleteKey(tag)

        call.resolve()
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

    @objc func verify(_ call: CAPPluginCall) {
        let foreignPublicKey = call.getString("foreignPublicKey") ?? ""
        let data = call.getString("data") ?? ""
        let signature = call.getString("signature") ?? ""

        let verified = implementation.verify(foreignPublicKey, data, signature)

        call.resolve([
            "verified": verified
        ])
    }
}
