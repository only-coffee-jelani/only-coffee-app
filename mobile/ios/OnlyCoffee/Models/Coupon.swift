import Foundation

// MARK: - Coupon Type Enum
enum CouponType: String, Codable {
    case percentOff = "percent_off"
    case fixedPrice = "fixed_price"
    case fixedAmount = "fixed_amount"
    case freeItem = "free_item"
}

// MARK: - Coupon Status Enum
enum CouponStatus: String, Codable {
    case active = "active"
    case redeemed = "redeemed"
    case expired = "expired"
    case cancelled = "cancelled"
}

// MARK: - Coupon Model
struct Coupon: Codable, Identifiable {
    let id: String
    let userId: String
    let promoCodeId: String?
    let type: CouponType
    let label: String
    let description: String?
    let valueCents: Int?
    let percentOff: Int?
    let priceOverrideCents: Int?
    let eligibleItems: EligibleItems?
    let channels: String
    let expiresAt: Date
    let redeemedAt: Date?
    let redeemedOrderId: String?
    let status: CouponStatus
    let source: String
    let metadata: [String: AnyCodable]?
    let createdAt: Date

    // MARK: - Eligible Items
    struct EligibleItems: Codable {
        let exclude: [String]?
        let include: [String]?
    }

    // MARK: - Computed Properties
    var isActive: Bool {
        status == .active && !isExpired
    }

    var isExpired: Bool {
        Date() >= expiresAt
    }

    var isExpiringSoon: Bool {
        guard isActive else { return false }
        let hoursUntilExpiry = Calendar.current.dateComponents([.hour], from: Date(), to: expiresAt).hour ?? 0
        return hoursUntilExpiry <= 24
    }

    var displayValue: String {
        switch type {
        case .percentOff:
            return "\(percentOff ?? 0)% OFF"
        case .fixedPrice:
            let price = Double(priceOverrideCents ?? 0) / 100.0
            return String(format: "$%.2f", price)
        case .fixedAmount:
            let amount = Double(valueCents ?? 0) / 100.0
            return String(format: "$%.2f OFF", amount)
        case .freeItem:
            return "FREE"
        }
    }

    var expiryText: String {
        let calendar = Calendar.current
        let now = Date()

        if isExpired {
            return "Expired"
        }

        let components = calendar.dateComponents([.day, .hour], from: now, to: expiresAt)

        if let days = components.day, days > 0 {
            return "Expires in \(days) day\(days == 1 ? "" : "s")"
        } else if let hours = components.hour, hours > 0 {
            return "Expires in \(hours) hour\(hours == 1 ? "" : "s")"
        } else {
            return "Expires soon"
        }
    }

    var channelText: String {
        switch channels {
        case "app_only":
            return "App Only"
        case "in_store":
            return "In-Store Only"
        default:
            return "App or In-Store"
        }
    }

    var formattedExpiryDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, h:mm a"
        formatter.timeZone = TimeZone(identifier: "America/Chicago")
        return "Expires \(formatter.string(from: expiresAt))"
    }
}

// MARK: - AnyCodable Helper
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }
}

// MARK: - API Response Models
struct CouponsResponse: Codable {
    let success: Bool
    let data: CouponsData

    struct CouponsData: Codable {
        let active: [Coupon]
        let expired: [Coupon]
        let redeemed: [Coupon]
        let all: [Coupon]
    }
}

struct RedeemPromoCodeResponse: Codable {
    let success: Bool
    let message: String
    let data: [Coupon]?
}

struct CouponResponse: Codable {
    let success: Bool
    let data: Coupon
}
