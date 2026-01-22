import Foundation
import AuthenticationServices
import Capacitor
import UIKit

public class PasskeyApi: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    // MARK: - Public Option Types
    public struct RegisterPasskeyOptions {
        /// Relying Party ID (domain)
        public let rpId: String
        /// Relying Party display name
        public let rpName: String
        /// Challenge string (base64url or UTF-8)
        public let challenge: String
        /// User ID (base64url or UTF-8)
        public let userId: String
        public let userName: String
        public let userDisplayName: String
        /// "required" or nil
        public let residentKey: String?
        /// "required" | "preferred" | "discouraged" | nil
        public let userVerification: String?

        public init(rpId: String, rpName: String, challenge: String, userId: String, userName: String, userDisplayName: String, residentKey: String?, userVerification: String?) {
            self.rpId = rpId
            self.rpName = rpName
            self.challenge = challenge
            self.userId = userId
            self.userName = userName
            self.userDisplayName = userDisplayName
            self.residentKey = residentKey
            self.userVerification = userVerification
        }
    }

    public struct AuthenticatePasskeyOptions {
        public let rpId: String
        public let challenge: String
        /// Optional list of credential IDs (each is a dictionary that may contain "id")
        public let allowCredentials: [[String: String]]?
        /// "required" | "preferred" | "discouraged" | nil
        public let userVerification: String?

        public init(rpId: String, challenge: String, allowCredentials: [[String: String]]?, userVerification: String?) {
            self.rpId = rpId
            self.challenge = challenge
            self.allowCredentials = allowCredentials
            self.userVerification = userVerification
        }
    }

    // MARK: - Private Properties
    private weak var bridge: CAPBridgeProtocol?
    private var pendingCompletion: ((Result<[String: Any], Error>) -> Void)?
    private var controller: ASAuthorizationController?

    // MARK: - Initialization
    public init(bridge: CAPBridgeProtocol?) {
        self.bridge = bridge
        super.init()
    }

    // MARK: - Public API

    /// Register a platform passkey (WebAuthn / PublicKeyCredential creation).
    /// Note: uses iOS 16+ APIs internally; on older iOS it will return an error via completion.
    public func registerPasskey(options: RegisterPasskeyOptions, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        // quick availability check and early return
        guard #available(iOS 16.0, *) else {
            completion(.failure(PasskeyError.unsupported))
            return
        }

        // Decode challenge & userId (accept base64url or raw UTF-8)
        let challenge = Data(base64url: options.challenge) ?? Data(options.challenge.utf8)
        let userId = Data(base64url: options.userId) ?? Data(options.userId.utf8)

        print("🔐 Passkey Registration Starting")
        print("  rpId: \(options.rpId)")
        print("  userName: \(options.userName)")
        print("  userDisplayName: \(options.userDisplayName)")
        print("  challenge length: \(challenge.count) bytes")
        print("  userId length: \(userId.count) bytes")

        // All iOS 16+ symbol usages are inside this block
        if #available(iOS 16.0, *) {
            let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rpId)

            let request = provider.createCredentialRegistrationRequest(
                challenge: challenge,
                name: options.userName, // name is the user name
                userID: userId
            )

            // Set user verification preference, default to .preferred
            if let uv = options.userVerification {
                switch uv {
                case "required": request.userVerificationPreference = .required
                case "discouraged": request.userVerificationPreference = .discouraged
                default: request.userVerificationPreference = .preferred
                }
            } else {
                request.userVerificationPreference = .preferred
            }

            // Store completion BEFORE performing request (important)
            self.pendingCompletion = completion

            // Create and perform controller
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.controller = controller

            print("  Performing authorization request...")
            controller.performRequests()
        } else {
            // unreachable because of earlier guard, but keep for clarity
            completion(.failure(PasskeyError.unsupported))
        }
    }

    /// Authenticate with an existing passkey (assertion).
    /// Note: uses iOS 16+ APIs internally; on older iOS it will return an error via completion.
    public func authenticateWithPasskey(options: AuthenticatePasskeyOptions, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard #available(iOS 16.0, *) else {
            completion(.failure(PasskeyError.unsupported))
            return
        }

        let challenge = Data(base64url: options.challenge) ?? Data(options.challenge.utf8)

        print("🔓 Passkey Authentication Starting")
        print("  rpId: \(options.rpId)")
        print("  challenge length: \(challenge.count) bytes")

        if #available(iOS 16.0, *) {
            let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rpId)

            // Create assertion request (will be used for both discoverable and non-discoverable flows)
            let request = provider.createCredentialAssertionRequest(challenge: challenge)

            // If allowCredentials provided, attempt to decode and log them (iOS handles allowed credentials differently)
            if let allowCredentials = options.allowCredentials, !allowCredentials.isEmpty {
                print("  Using specific credentials (count: \(allowCredentials.count))")
                // Convert credential IDs from base64url strings to Data (we don't attach them directly to request since platform API manages this)
                _ = allowCredentials.compactMap { dict -> Data? in
                    guard let idString = dict["id"] else { return nil }
                    return Data(base64url: idString)
                }
            } else {
                print("  Using discoverable credentials (resident keys)")
            }

            // Set user verification preference, default to .preferred
            if let uv = options.userVerification {
                switch uv {
                case "required": request.userVerificationPreference = .required
                case "discouraged": request.userVerificationPreference = .discouraged
                default: request.userVerificationPreference = .preferred
                }
            } else {
                request.userVerificationPreference = .preferred
            }

            // Store completion and perform
            self.pendingCompletion = completion
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.controller = controller

            print("  Performing authentication request...")
            controller.performRequests()
        } else {
            completion(.failure(PasskeyError.unsupported))
        }
    }

    // MARK: - ASAuthorizationControllerPresentationContextProviding
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        print("📱 Getting presentation anchor")
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first(where: { $0.isKeyWindow }) {
            return window
        }
        return bridge?.viewController?.view.window ?? UIApplication.shared.windows.first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }

    // MARK: - ASAuthorizationControllerDelegate
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        print("✅ Authorization completed successfully")

        defer {
            pendingCompletion = nil
            self.controller = nil
        }

        // Registration response (iOS 16+)
        if #available(iOS 16.0, *),
           let registration = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {

            let credentialID = registration.credentialID
            let attestationObject = registration.rawAttestationObject ?? Data()
            let clientDataJSON = registration.rawClientDataJSON

            print("  Registration Success:")
            print("    credentialID length: \(credentialID.count) bytes")
            print("    attestationObject length: \(attestationObject.count) bytes")
            print("    clientDataJSON length: \(clientDataJSON.count) bytes")

            pendingCompletion?(.success([
                "id": credentialID.base64urlEncodedString(),
                "rawId": credentialID.base64urlEncodedString(),
                "type": "public-key",
                "authenticatorAttachment": "platform",
                "response": [
                    "attestationObject": attestationObject.base64urlEncodedString(),
                    "clientDataJSON": clientDataJSON.base64urlEncodedString()
                ]
            ]))
            return
        }

        // Authentication response (iOS 16+)
        if #available(iOS 16.0, *),
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

            pendingCompletion?(.success([
                "id": credentialID.base64urlEncodedString(),
                "rawId": credentialID.base64urlEncodedString(),
                "response": [
                    "authenticatorData": rawAuthenticatorData.base64urlEncodedString(),
                    "signature": signature.base64urlEncodedString(),
                    "clientDataJSON": clientDataJSON.base64urlEncodedString(),
                    "userHandle": userID.base64urlEncodedString()
                ],
                "authenticatorAttachment": "platform",
                "type": "public-key"
            ]))
            return
        }

        print("❌ Unexpected credential type")
        pendingCompletion?(.failure(PasskeyError.unexpectedCredential))
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        print("❌ Authorization failed with error: \(error.localizedDescription)")

        defer {
            pendingCompletion = nil
            self.controller = nil
        }

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

        pendingCompletion?(.failure(PasskeyError.authorizationFailed(error)))
    }

    // MARK: - Error Definitions
    enum PasskeyError: LocalizedError {
        case unsupported
        case unexpectedCredential
        case authorizationFailed(Error)

        var errorDescription: String? {
            switch self {
            case .unsupported:
                return "Passkeys require iOS 16+"
            case .unexpectedCredential:
                return "Unexpected credential type"
            case .authorizationFailed(let error):
                return "Authorization failed: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Base64URL Utilities
private extension Data {
    /// Initialize `Data` from a base64url string (RFC 4648 §5).
    init?(base64url string: String) {
        var s = string.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let pad = s.count % 4
        if pad > 0 { s += String(repeating: "=", count: 4 - pad) }
        self.init(base64Encoded: s)
    }

    /// Return base64url-encoded string (no padding).
    func base64urlEncodedString() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
