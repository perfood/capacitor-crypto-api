import Foundation
import LocalAuthentication

@objc public class BiometryApi: NSObject {
    struct Constants {
        static let HARDWARE_FINGER = "FINGER"
        static let HARDWARE_FACE = "FACE"

        static let STATUS_SUCCESS = "SUCCESS"
        static let STATUS_HARDWARE_UNAVAILABLE = "HARDWARE_UNAVAILABLE"
        static let STATUS_NONE_ENROLLED = "NONE_ENROLLED"
        static let STATUS_UNKNOWN = "UNKNOWN"
    }

    @objc public func isBiometricsEnabled(_ policy: LAPolicy) -> Bool {
        print("BiometryApi.isBiometricsEnabled", policy)
        return getBiometricsStatus(policy) == Constants.STATUS_SUCCESS
    }

    @objc public func getBiometricsStatus(_ policy: LAPolicy) -> String {
        print("BiometryApi.getBiometricsStatus", policy)

        let context = LAContext()
        var error: NSError?

        if context.canEvaluatePolicy(policy, error: &error) {
            return Constants.STATUS_SUCCESS
        }

        if let laError = error {
            switch laError.code {
            case LAError.biometryNotAvailable.rawValue:
                return Constants.STATUS_HARDWARE_UNAVAILABLE
            case LAError.biometryNotEnrolled.rawValue:
                return Constants.STATUS_NONE_ENROLLED

            default:
                return Constants.STATUS_UNKNOWN
            }
        }

        return Constants.STATUS_UNKNOWN
    }

    @objc public func getAvailableHardware() -> [String] {
        print("BiometryApi.getAvailableHardware")

        let context = LAContext()
        var error: NSError?

        switch context.biometryType {
        case .faceID:
            return [Constants.HARDWARE_FACE]
        case .touchID:
            return [Constants.HARDWARE_FINGER]
        default:
            return []
        }
    }

    @objc public func isDevicePasscodeSet() -> Bool {
        print("BiometryApi.isDevicePasscodeSet")

        let context = LAContext()
        var error: NSError?

        return context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
    }

}
