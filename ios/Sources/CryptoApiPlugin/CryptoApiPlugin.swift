import Foundation
import Capacitor
import LocalAuthentication

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
        CAPPluginMethod(name: "getECDHTags", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sign", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "verify", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "encrypt", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "decrypt", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isBiometricsEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBiometricsStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAvailableHardware", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isDevicePasscodeSet", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = CryptoApi()
    private let biometry = BiometryApi()

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
        let type = call.getString("type") ?? ""

        let publicKey = implementation.generateKey(tag, algorithm, getAccessControlFlag(type));

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
        let tag = call.getString("tag") ?? ""
        let foreignPublicKey = call.getString("foreignPublicKey") ?? ""
        let plaintext = call.getString("plaintext") ?? ""

        guard let encrypted = implementation.encrypt(tag, foreignPublicKey, plaintext) else {
            call.resolve([:])

            return
        }

        call.resolve(encrypted)
    }

    @objc func decrypt(_ call: CAPPluginCall) {
        let tag = call.getString("tag") ?? ""
        let foreignPublicKey = call.getString("foreignPublicKey") ?? ""
        let iv = call.getString("iv") ?? ""
        let ciphertext = call.getString("ciphertext") ?? ""

        guard let plaintext = implementation.decrypt(tag, foreignPublicKey, iv, ciphertext) else {
            call.resolve([:])

            return
        }

        call.resolve([
            "plaintext": plaintext
        ])
    }

    @objc func isBiometricsEnabled(_ call: CAPPluginCall) {
        print("CryptoApiPlugin.isBiometricsEnabled")

        let type = call.getString("type") ?? ""

        let isEnabled = biometry.isBiometricsEnabled(getAuthenticationPolicy(type))

        call.resolve([
            "isEnabled": isEnabled
        ])
    }

    @objc func getBiometricsStatus(_ call: CAPPluginCall) {
        print("CryptoApiPlugin.getBiometricsStatus")

        let type = call.getString("type") ?? ""

        let status = biometry.getBiometricsStatus(getAuthenticationPolicy(type))

        call.resolve([
            "status": status.stringValue
        ])
    }

    @objc func getAvailableHardware(_ call: CAPPluginCall) {
        print("CryptoApiPlugin.getAvailableHardware")

        let hardware = biometry.getAvailableHardware()

        call.resolve([
            "hardware": hardware
        ])
    }

    @objc func isDevicePasscodeSet(_ call: CAPPluginCall) {
        print("CryptoApiPlugin.isDevicePasscodeSet")

        let isDevicePasscodeSet = biometry.isDevicePasscodeSet()

        call.resolve([
            "isDevicePasscodeSet": isDevicePasscodeSet
        ])
    }

    private func getAccessControlFlag(_ type: String) -> SecAccessControlCreateFlags {
        switch type {
            case "BIOMETRY":
                return .biometryCurrentSet

            case "BIOMETRY_OR_PASSCODE":
                return .userPresence

            default:
                return .devicePasscode
        }
    }

    private func getAuthenticationPolicy(_ type: String) -> LAPolicy {
        switch type {
            case "BIOMETRY":
                return .deviceOwnerAuthenticationWithBiometrics

            default:
                return .deviceOwnerAuthentication
        }
    }
}
