// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PerfoodCapacitorCryptoApi",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "PerfoodCapacitorCryptoApi",
            targets: ["CryptoApiPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "CryptoApiPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/CryptoApiPlugin"),
        .testTarget(
            name: "CryptoApiPluginTests",
            dependencies: ["CryptoApiPlugin"],
            path: "ios/Tests/CryptoApiPluginTests")
    ]
)
