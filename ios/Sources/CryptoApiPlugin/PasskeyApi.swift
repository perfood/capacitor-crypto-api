import Foundation
import AuthenticationServices
import Capacitor
import UIKit

public class PasskeyApi: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    public struct RegisterPasskeyOptions {
        let rpId: String
        let rpName: String
        let challenge: String        // base64url or UTF-8 string
        let userId: String           // base64url or UTF-8 string
        let userName: String
        let userDisplayName: String
        let residentKey: String?     // "required" | nil
        let userVerification: String? // "required" | "preferred" | "discouraged" | nil
    }

    public struct AuthenticatePasskeyOptions {
        let rpId: String
        let challenge: String        // base64url or UTF-8 string
        let allowCredentials: [[String: String]]? // Optional list of credential IDs
        let userVerification: String? // "required" | "preferred" | "discouraged" | nil
    }

    private weak var bridge: CAPBridgeProtocol?
    private var pendingCompletion: ((Result<[String: String], Error>) -> Void)?
    private var controller: ASAuthorizationController?

    public init(bridge: CAPBridgeProtocol?) {
        self.bridge = bridge
        super.init()
    }

    public func registerPasskey(options: RegisterPasskeyOptions, completion: @escaping (Result<[String: String], Error>) -> Void) {
        guard #available(iOS 16.0, *) else {
            completion(.failure(NSError(domain: "Passkey", code: -1, userInfo: [NSLocalizedDescriptionKey: "Passkeys require iOS 16+"])))
            return
        }

        let challenge = Self.base64urlDecode(options.challenge) ?? Data(options.challenge.utf8)
        let userId = Self.base64urlDecode(options.userId) ?? Data(options.userId.utf8)

        print("🔐 Passkey Registration Starting")
        print("  rpId: \(options.rpId)")
        print("  userName: \(options.userName)")
        print("  userDisplayName: \(options.userDisplayName)")
        print("  challenge length: \(challenge.count) bytes")
        print("  userId length: \(userId.count) bytes")

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rpId)

        let request = provider.createCredentialRegistrationRequest(
            challenge: challenge,
            name: options.userName,  // Use userName, not userDisplayName here
            userID: userId
        )

        // Set user verification preference if provided
        if let uv = options.userVerification {
            switch uv {
            case "required": request.userVerificationPreference = .required
            case "discouraged": request.userVerificationPreference = .discouraged
            default: request.userVerificationPreference = .preferred
            }
        } else {
            request.userVerificationPreference = .preferred
        }

        // CRITICAL FIX: Store the completion handler BEFORE performing requests
        self.pendingCompletion = completion

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        self.controller = controller

        print("  Performing authorization request...")
        controller.performRequests()
    }

    public func authenticateWithPasskey(options: AuthenticatePasskeyOptions, completion: @escaping (Result<[String: String], Error>) -> Void) {
        guard #available(iOS 16.0, *) else {
            completion(.failure(NSError(domain: "Passkey", code: -1, userInfo: [NSLocalizedDescriptionKey: "Passkeys require iOS 16+"])))
            return
        }

        let challenge = Self.base64urlDecode(options.challenge) ?? Data(options.challenge.utf8)

        print("🔓 Passkey Authentication Starting")
        print("  rpId: \(options.rpId)")
        print("  challenge length: \(challenge.count) bytes")

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rpId)

        let request: ASAuthorizationPlatformPublicKeyCredentialAssertionRequest

        // Check if specific credentials are provided
        if let allowCredentials = options.allowCredentials, !allowCredentials.isEmpty {
            print("  Using specific credentials (count: \(allowCredentials.count))")

            // Convert credential IDs from base64url strings to Data
            let credentialIDs = allowCredentials.compactMap { dict -> Data? in
                guard let idString = dict["id"] else { return nil }
                return Self.base64urlDecode(idString)
            }

            request = provider.createCredentialAssertionRequest(challenge: challenge)
            // Note: allowedCredentials is set via the request, but iOS handles this differently
            // For specific credentials, you might need to filter on the server side
        } else {
            print("  Using discoverable credentials (resident keys)")
            // This will show all passkeys for this RP
            request = provider.createCredentialAssertionRequest(challenge: challenge)
        }

        // Set user verification preference
        if let uv = options.userVerification {
            switch uv {
            case "required": request.userVerificationPreference = .required
            case "discouraged": request.userVerificationPreference = .discouraged
            default: request.userVerificationPreference = .preferred
            }
        } else {
            request.userVerificationPreference = .preferred
        }

        // Store completion handler
        self.pendingCompletion = completion

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        self.controller = controller

        print("  Performing authentication request...")
        controller.performRequests()
    }

    // MARK: ASAuthorizationControllerPresentationContextProviding
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        print("📱 Getting presentation anchor")
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first(where: { $0.isKeyWindow }) {
            return window
        }
        return bridge?.viewController?.view.window ?? UIApplication.shared.windows.first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }

    // MARK: ASAuthorizationControllerDelegate
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        print("✅ Authorization completed successfully")

        defer {
            pendingCompletion = nil
            self.controller = nil
        }

        // Handle REGISTRATION response
        if #available(iOS 16.0, *),
           let registration = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {

            let credentialID = registration.credentialID
            let attestationObject = registration.rawAttestationObject ?? Data()
            let clientDataJSON = registration.rawClientDataJSON

            print("  Registration Success:")
            print("    credentialID length: \(credentialID.count) bytes")
            print("    attestationObject length: \(attestationObject.count) bytes")
            print("    clientDataJSON length: \(clientDataJSON.count) bytes")

            // Return base64url encoded strings (standard for WebAuthn)
            pendingCompletion?(.success([
                "id": Self.base64urlEncode(credentialID),
                "rawId": Self.base64urlEncode(credentialID),
                "attestationObject": Self.base64urlEncode(attestationObject),
                "clientDataJSON": Self.base64urlEncode(clientDataJSON),
                "type": "public-key"
            ]))
        }
        // Handle AUTHENTICATION response ⬅️ THIS WAS MISSING
        else if #available(iOS 16.0, *),
                let assertion = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {

            let credentialID = assertion.credentialID
            let rawAuthenticatorData = assertion.rawAuthenticatorData ?? Data()
            let signature = assertion.signature ?? Data()
            let clientDataJSON = assertion.rawClientDataJSON
            let userID = assertion.userID ?? Data()

            print("  Authentication Success:")
            print("    credentialID length: \(credentialID.count) bytes")
            print("    authenticatorData length: \(rawAuthenticatorData.count) bytes")
            print("    signature length: \(signature.count) bytes")
            print("    clientDataJSON length: \(clientDataJSON.count) bytes")
            print("    userID length: \(userID.count) bytes")

            // Return base64url encoded strings (standard for WebAuthn)
            pendingCompletion?(.success([
                "id": Self.base64urlEncode(credentialID),
                "rawId": Self.base64urlEncode(credentialID),
                "authenticatorData": Self.base64urlEncode(rawAuthenticatorData),
                "signature": Self.base64urlEncode(signature),
                "clientDataJSON": Self.base64urlEncode(clientDataJSON),
                "userHandle": Self.base64urlEncode(userID),
                "type": "public-key"
            ]))
        } else {
            print("❌ Unexpected credential type")
            pendingCompletion?(.failure(NSError(domain: "Passkey", code: -2, userInfo: [NSLocalizedDescriptionKey: "Unexpected credential type"])))
        }
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        print("❌ Authorization failed with error: \(error.localizedDescription)")

        defer {
            pendingCompletion = nil
            self.controller = nil
        }

        // Provide more detailed error information
        if let authError = error as? ASAuthorizationError {
            switch authError.code {
            case .canceled:
                print("  User canceled the request")
            case .failed:
                print("  Authorization failed")
            case .invalidResponse:
                print("  Invalid response from authenticator")
            case .notHandled:
                print("  Request not handled")
            case .unknown:
                print("  Unknown error")
            @unknown default:
                print("  Unhandled error case")
            }
        }

        pendingCompletion?(.failure(error))
    }

    // MARK: Helpers
    private static func base64urlDecode(_ input: String) -> Data? {
        var s = input.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let pad = s.count % 4
        if pad > 0 { s += String(repeating: "=", count: 4 - pad) }
        return Data(base64Encoded: s)
    }

    private static func base64urlEncode(_ data: Data) -> String {
        return data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
