import Foundation

let jsonString = """
{
    "id": "1f844241-3890-4330-9bca-2d2a3ab972bd",
    "title": "Fall Special: Waffolino",
    "description": "Try our signature Waffolino - a perfect blend of espresso and waffle flavors",
    "promotionType": "launch_modal",
    "imageUrl": "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/waffolino-launch.jpg",
    "targetMenuItemId": null,
    "targetUrl": null,
    "startDate": "2025-10-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "isActive": true,
    "displayDuration": 3,
    "sortOrder": 0,
    "createdAt": "2025-10-15T20:45:13.726Z",
    "updatedAt": "2025-10-15T20:45:13.726Z"
}
"""

enum PromotionType: String, Codable {
    case launchModal = "launch_modal"
    case banner = "banner"
    case card = "card"
}

struct Promotion: Codable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let promotionType: PromotionType
    let imageUrl: String
    let targetMenuItemId: String?
    let targetUrl: String?
    let startDate: Date
    let endDate: Date
    let isActive: Bool
    let displayDuration: Int
    let sortOrder: Int
    let createdAt: Date
    let updatedAt: Date
}

let decoder = JSONDecoder()
let formatter = ISO8601DateFormatter()
formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

decoder.dateDecodingStrategy = .custom({ decoder in
    let container = try decoder.singleValueContainer()
    let dateString = try container.decode(String.self)

    // Try with fractional seconds first
    if let date = formatter.date(from: dateString) {
        return date
    }

    // Fallback to without fractional seconds
    formatter.formatOptions = [.withInternetDateTime]
    if let date = formatter.date(from: dateString) {
        return date
    }

    throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
})

decoder.keyDecodingStrategy = .convertFromSnakeCase

do {
    let data = jsonString.data(using: .utf8)!
    let promotion = try decoder.decode(Promotion.self, from: data)
    print("✅ Successfully decoded promotion:")
    print("   Title: \(promotion.title)")
    print("   Type: \(promotion.promotionType)")
    print("   Duration: \(promotion.displayDuration)s")
} catch {
    print("❌ Decoding error: \(error)")
}
