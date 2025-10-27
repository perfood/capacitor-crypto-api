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
        CAPPluginMethod(name: "isDevicePasscodeSet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hasSecureHardware", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "registerPasskey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticateWithPasskey", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = CryptoApi()
    private let biometry = BiometryApi()
    private var passkey: PasskeyApi!

    override public func load() {
        super.load()
        self.passkey = PasskeyApi(bridge: self.bridge)
    }

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

        let publicKey = implementation.generateKey(tag, algorithm, type)

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

        do {
            let signature = try implementation.sign(tag, data)

            call.resolve([
                "signature": signature
            ])
        } catch let nsError as NSError {
            if nsError.domain == LAError.errorDomain {
                switch LAError.Code(rawValue: nsError.code) {
                case .userCancel:
                    call.reject("user_cancelled", "Benutzer hat abgebrochen.")
                case .biometryLockout:
                    call.reject("lockout", "Biometrie gesperrt.")
                default:
                    call.reject("signing_failed", nsError.localizedDescription)
                }
            } else {
                call.reject("signing_failed", nsError.localizedDescription)
            }
        } catch {
            call.reject("signing_failed", error.localizedDescription)
        }

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
            "status": status
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

    @objc func hasSecureHardware(_ call: CAPPluginCall) {
        print("CryptoApiPlugin.hasSecureHardware")

        call.resolve([
            "hasSecureHardware": true // hardware is always secure on iOS devices
        ])
    }

    @objc func registerPasskey(_ call: CAPPluginCall) {
        guard let rp = call.getObject("rp"),
              let rpId = rp["id"] as? String,
              let rpName = rp["name"] as? String,
              let user = call.getObject("user"),
              let userId = user["id"] as? String,
              let userName = user["name"] as? String,
              let userDisplayName = user["displayName"] as? String,
              let challenge = call.getString("challenge")
        else {
            call.reject("invalid_arguments", "Missing rp.id, rp.name, user.id, user.name, user.displayName or challenge")
            return
        }

        let authSel = call.getObject("authenticatorSelection")
        let residentKey = authSel?["residentKey"] as? String // "required" | nil
        let userVerification = authSel?["userVerification"] as? String // "required" | "preferred" | "discouraged" | nil

        let options = PasskeyApi.RegisterPasskeyOptions(
            rpId: rpId,
            rpName: rpName,
            challenge: challenge,
            userId: userId,
            userName: userName,
            userDisplayName: userDisplayName,
            residentKey: residentKey,
            userVerification: userVerification
        )

        passkey.registerPasskey(options: options) { result in
            switch result {
            case .success(let payload):
                call.resolve(payload)
            case .failure(let error):
                call.reject("registration_failed", error.localizedDescription)
            }
        }
    }

    @objc func authenticateWithPasskey(_ call: CAPPluginCall) {
        guard let rpId = call.getString("rpId"),
              let challenge = call.getString("challenge") else {
            call.reject("Missing required parameters")
            return
        }

        let allowCredentials = call.getArray("allowCredentials")?.compactMap { item -> [String: String]? in
            guard let dict = item as? [String: Any],
                  let id = dict["id"] as? String else { return nil }
            return ["id": id]
        }

        let options = PasskeyApi.AuthenticatePasskeyOptions(
            rpId: rpId,
            challenge: challenge,
            allowCredentials: allowCredentials,
            userVerification: call.getString("userVerification")
        )

        passkey.authenticateWithPasskey(options: options) { result in
            switch result {
            case .success(let response):
                call.resolve(response)
            case .failure(let error):
                call.reject("Authentication failed", "\(error.localizedDescription)")
            }
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
