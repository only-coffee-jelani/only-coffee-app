import Foundation

/// Personalized offer model
struct PersonalizedOffer: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let offerType: OfferType
    let offerValue: Double
    let imageUrl: String?
    let validFrom: Date?
    let validUntil: Date?
    let minPurchaseAmount: Double?
    let maxDiscountAmount: Double?
    let targetSegments: [String]?
    let priority: Int
    let source: OfferSource

    // Personalization context
    let personalizedFor: String? // User segment
    let confidenceScore: Double?
    let reason: String? // Why this offer was selected

    // CTA
    let ctaText: String
    let deepLink: String?

    var isValid: Bool {
        let now = Date()
        if let validFrom = validFrom, now < validFrom {
            return false
        }
        if let validUntil = validUntil, now > validUntil {
            return false
        }
        return true
    }

    var formattedOfferValue: String {
        switch offerType {
        case .percentageDiscount:
            return "\(Int(offerValue))% OFF"
        case .fixedDiscount:
            return "$\(String(format: "%.2f", offerValue)) OFF"
        case .freeItem:
            return "FREE Item"
        case .buyXGetY:
            return "Buy X Get Y"
        case .pointsBonus:
            return "\(Int(offerValue))x Points"
        }
    }

    var validityText: String {
        guard let validUntil = validUntil else {
            return "No expiration"
        }

        let calendar = Calendar.current
        let now = Date()

        if calendar.isDateInToday(validUntil) {
            return "Expires today"
        } else if calendar.isDateInTomorrow(validUntil) {
            return "Expires tomorrow"
        } else {
            let days = calendar.dateComponents([.day], from: now, to: validUntil).day ?? 0
            if days < 7 {
                return "Expires in \(days) days"
            } else {
                let formatter = DateFormatter()
                formatter.dateStyle = .short
                return "Expires \(formatter.string(from: validUntil))"
            }
        }
    }
}

enum OfferType: String, Codable {
    case percentageDiscount = "percentage_discount"
    case fixedDiscount = "fixed_discount"
    case freeItem = "free_item"
    case buyXGetY = "buy_x_get_y"
    case pointsBonus = "points_bonus"
}

enum OfferSource: String, Codable {
    case aiGenerated = "ai_generated"
    case manual = "manual"
    case geofence = "geofence"
    case bandit = "bandit"
    case trigger = "trigger"
}

/// Response from personalized offers API
struct PersonalizedOffersResponse: Codable {
    let success: Bool
    let offers: [PersonalizedOffer]
    let count: Int
    let userSegment: String?
    let churnRisk: Double?
}
