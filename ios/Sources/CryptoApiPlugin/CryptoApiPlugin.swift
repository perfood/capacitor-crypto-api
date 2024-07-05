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
        call.resolve([
            "publicKey": implementation.generateKey(tag, algorithm)
        ])
    }

    @objc func loadKey(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        call.resolve([
            "publicKey": implementation.loadKey(tag)
        ])
    }

    @objc func sign(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        let data = call.getString("tag") ?? ""
        call.resolve([
            "signature": implementation.sign(tag, data)
        ])
    }

    @objc func decrypt(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        let foreignPublicKey = call.getString("foreignPublicKey") ?? ""
        let initVector = call.getString("initVector") ?? ""
        let encryptedData = call.getString("encryptedData") ?? ""
        call.resolve([
            "data": implementation.decrypt(tag, foreignPublicKey, initVector, encryptedData)
        ])
    }
}
