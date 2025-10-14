// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "OnlyCoffee",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "OnlyCoffee",
            targets: ["OnlyCoffee"]
        )
    ],
    dependencies: [
        // Stripe SDK for payment processing
        .package(url: "https://github.com/stripe/stripe-ios", from: "23.0.0"),
    ],
    targets: [
        .target(
            name: "OnlyCoffee",
            dependencies: [
                .product(name: "StripePaymentSheet", package: "stripe-ios"),
            ],
            path: "OnlyCoffee"
        )
    ]
)
