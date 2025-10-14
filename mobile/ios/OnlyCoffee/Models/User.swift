import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let phone: String?
    let role: UserRole
    let loyaltyPoints: Int
    let loyaltyTier: LoyaltyTier
    let stripeCustomerId: String?
    let createdAt: Date
    let updatedAt: Date

    var fullName: String {
        "\(firstName) \(lastName)"
    }
}

enum UserRole: String, Codable {
    case customer = "customer"
    case admin = "admin"
}

enum LoyaltyTier: String, Codable, CaseIterable {
    case silver = "silver"
    case gold = "gold"
    case platinum = "platinum"

    var displayName: String {
        rawValue.capitalized
    }

    var pointsRequired: Int {
        switch self {
        case .silver: return 0
        case .gold: return 1000
        case .platinum: return 5000
        }
    }

    var color: String {
        switch self {
        case .silver: return "gray"
        case .gold: return "yellow"
        case .platinum: return "blue"
        }
    }
}

struct LoyaltyInfo: Codable {
    let points: Int
    let tier: LoyaltyTier
    let nextTierPoints: Int?
}
