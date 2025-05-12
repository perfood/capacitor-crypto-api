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
        CAPPluginMethod(name: "getECDSATags", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sign", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "verify", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = CryptoApi()

    @objc func getECDSATags(_ call: CAPPluginCall) {
        let tags = implementation.getTags("ecdsa")

        call.resolve([
            "tags": tags
        ])
    }

    @objc func getECDHTags(_ call: CAPPluginCall) {
        let tags = implementation.getTags("ecdh")

        call.resolve([
            "tags": tags
        ])
    }

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
        let algorithm = call.getString("algorithm") ?? ""

        guard let publicKey = implementation.loadKey(tag, algorithm) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "publicKey": publicKey
        ])
    }

    @objc func deleteKey(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        let algorithm = call.getString("algorithm") ?? ""

        implementation.deleteKey(tag, algorithm)

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

    @objc func encrypt(_ call: CAPPluginCall) {
        let data = call.getString("data") ?? ""
        let tag = call.getString("tag") ?? ""

        guard let encrypted = implementation.encrypt(data, tag) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "encrypted": encrypted
        ])
    }

    @objc func decrypt(_ call: CAPPluginCall) {
        let data = call.getString("data") ?? ""
        let tag = call.getString("tag") ?? ""

        guard let decrypted = implementation.decrypt(data, tag) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "decrypted": decrypted
        ])
    }
}
