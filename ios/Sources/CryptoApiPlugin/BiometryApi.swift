import Foundation
import LocalAuthentication

@objc public enum BiometricsStatus: Int {
    case SUCCESS
    case HARDWARE_UNAVAILABLE
    case NONE_ENROLLED
    case UNKNOWN

    public var stringValue: String {
        switch self {
            case .SUCCESS:
                return "SUCCESS"
            case .HARDWARE_UNAVAILABLE:
                return "HARDWARE_UNAVAILABLE"
            case .NONE_ENROLLED:
                return "NONE_ENROLLED"
            case .UNKNOWN:
                return "UNKNOWN"
        }
    }
}

@objc public class BiometryApi: NSObject {
     struct Constants {
        static let FINGER = "FINGER"
        static let FACE = "FACE"
    }

    @objc public func isBiometricsEnabled(_ policy: LAPolicy) -> Bool {
        print("BiometryApi.isBiometricsEnabled", policy)
        return getBiometricsStatus(policy) == .SUCCESS
    }

    @objc public func getBiometricsStatus(_ policy: LAPolicy) -> BiometricsStatus {
        print("BiometryApi.getBiometricsStatus", policy)

        let context = LAContext()
        var error: NSError?

        if context.canEvaluatePolicy(policy, error: &error) {
            return .SUCCESS
        }

        if let laError = error {
            switch laError.code {
                case LAError.biometryNotAvailable.rawValue:
                    return .HARDWARE_UNAVAILABLE
                case LAError.biometryNotEnrolled.rawValue:
                    return .NONE_ENROLLED

                default:
                    return .UNKNOWN
            }
        }

        return .UNKNOWN
    }

    @objc public func getAvailableHardware() -> [String] {
        print("BiometryApi.getAvailableHardware")

        let context = LAContext()
        var error: NSError?

        switch context.biometryType {
            case .faceID:
                return [Constants.FACE]
            case .touchID:
                return [Constants.FINGER]
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
