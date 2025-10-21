import UIKit
import CoreImage.CIFilterBuiltins

class QRCodeGenerator {
    static let shared = QRCodeGenerator()

    private let context = CIContext()
    private let filter = CIFilter.qrCodeGenerator()

    private init() {}

    /// Generate a QR code UIImage from a string
    /// - Parameters:
    ///   - string: The string to encode
    ///   - size: The size of the generated QR code image
    /// - Returns: A UIImage containing the QR code, or nil if generation failed
    func generate(from string: String, size: CGSize = CGSize(width: 300, height: 300)) -> UIImage? {
        guard let data = string.data(using: .utf8) else {
            return nil
        }

        filter.message = data
        filter.correctionLevel = "M" // Medium error correction (15%)

        guard let outputImage = filter.outputImage else {
            return nil
        }

        // Scale the QR code to the desired size
        let scaleX = size.width / outputImage.extent.width
        let scaleY = size.height / outputImage.extent.height
        let transformedImage = outputImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))

        // Convert to UIImage
        guard let cgImage = context.createCGImage(transformedImage, from: transformedImage.extent) else {
            return nil
        }

        return UIImage(cgImage: cgImage)
    }

    /// Generate a QR code for a coupon
    /// - Parameters:
    ///   - coupon: The coupon to generate a QR code for
    ///   - size: The size of the generated QR code image
    /// - Returns: A UIImage containing the QR code
    func generateCouponQRCode(for coupon: Coupon, size: CGSize = CGSize(width: 300, height: 300)) -> UIImage? {
        // Create a JSON payload with coupon information for in-store scanning
        let payload: [String: Any] = [
            "type": "coupon",
            "couponId": coupon.id,
            "userId": coupon.userId ?? "",
            "code": coupon.label,
            "value": coupon.displayValue,
            "expiresAt": ISO8601DateFormatter().string(from: coupon.expiresAt)
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload, options: []),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return nil
        }

        return generate(from: jsonString, size: size)
    }
}
