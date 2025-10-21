import Foundation

// MARK: - User Tier Enum
enum UserTier: String, Codable {
    case bronze = "bronze"
    case silver = "silver"
    case gold = "gold"
    case platinum = "platinum"
    case black = "black"

    var displayName: String {
        rawValue.capitalized
    }

    var color: String {
        switch self {
        case .bronze: return "bronze"
        case .silver: return "gray"
        case .gold: return "yellow"
        case .platinum: return "blue"
        case .black: return "black"
        }
    }
}

// MARK: - User Streak Model
struct UserStreak: Codable, Identifiable {
    let id: String
    let userId: String
    let consecutiveDays: Int
    let currentStreak: Int
    let longestStreak: Int
    let lastVisitDate: Date?
    let firstQualifyingPurchaseDate: Date?
    let streakStartDate: Date?
    let monthlyPoints: Int
    let tierXP: Int
    let monthlyVisits: Int
    let annualSpend: Double
    let sevenDayStreakCount: Int
    let lastMonthlyReset: Date?
    let createdAt: Date
    let updatedAt: Date
}

// MARK: - Streak Visit Model
struct StreakVisit: Codable, Identifiable {
    let id: String
    let userId: String
    let orderId: String
    let visitDate: Date
    let orderAmount: Double
    let isMorningRush: Bool
    let pointsEarned: Int
    let xpEarned: Int
    let basePoints: Int
    let baseXP: Int
    let multiplier: Int
    let streakDayAtVisit: Int
    let createdAt: Date

    var multiplierText: String {
        isMorningRush ? "2x MORNING RUSH" : "1x"
    }
}

// MARK: - Streak Saver Token Status
enum TokenStatus: String, Codable {
    case available = "available"
    case used = "used"
    case expired = "expired"
}

// MARK: - Streak Saver Token Model
struct StreakSaverToken: Codable, Identifiable {
    let id: String
    let userId: String
    let status: TokenStatus
    let grantedAt: Date
    let usedAt: Date?
    let appliedToDate: Date?
    let expiresAt: Date?
    let metadata: [String: AnyCodable]?
    let createdAt: Date

    var isAvailable: Bool {
        status == .available && !isExpired
    }

    var isExpired: Bool {
        guard let expiresAt = expiresAt else { return false }
        return Date() >= expiresAt
    }

    var expiryText: String {
        guard let expiresAt = expiresAt else { return "No expiry" }

        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        formatter.timeZone = TimeZone(identifier: "America/Chicago")
        return "Expires \(formatter.string(from: expiresAt))"
    }
}

// MARK: - Streak Reward Model
struct StreakReward: Codable, Identifiable {
    let id: String
    let streakDay: Int
    let rewardType: String
    let couponType: CouponType
    let label: String
    let description: String?
    let valueCents: Int?
    let maxValueCents: Int?
    let expiryDays: Int
    let channels: String
    let eligibleItems: [String: AnyCodable]?
    let isActive: Bool
    let displayOrder: Int
    let metadata: [String: AnyCodable]?
    let createdAt: Date
    let updatedAt: Date

    var displayValue: String {
        switch couponType {
        case .percentOff:
            return "\(valueCents ?? 0)% OFF"
        case .fixedAmount:
            let amount = Double(valueCents ?? 0) / 100.0
            return String(format: "$%.2f OFF", amount)
        case .freeItem:
            if let maxValue = maxValueCents {
                let max = Double(maxValue) / 100.0
                return String(format: "FREE (up to $%.2f)", max)
            }
            return "FREE"
        case .fixedPrice:
            let price = Double(valueCents ?? 0) / 100.0
            return String(format: "$%.2f", price)
        }
    }
}

// MARK: - Tier Progress Model
struct TierProgress: Codable {
    let currentTier: UserTier
    let nextTier: UserTier?
    let progress: Progress
    let meetsRequirements: Bool

    struct Progress: Codable {
        let monthlyVisits: Metric
        let tierXP: Metric
        let sevenDayStreaks: Metric
        let annualSpend: Metric

        struct Metric: Codable {
            let current: Int
            let required: Int

            var percentage: Double {
                guard required > 0 else { return 0 }
                return min(Double(current) / Double(required), 1.0)
            }
        }
    }
}

// MARK: - Tier Perk Model
struct TierPerk: Codable, Identifiable {
    let id: String
    let tier: UserTier
    let perkType: String
    let perkName: String
    let description: String
    let isActive: Bool
    let displayOrder: Int
    let configuration: [String: AnyCodable]?
    let iconName: String?
    let metadata: [String: AnyCodable]?
    let createdAt: Date
    let updatedAt: Date
}

// MARK: - Next Milestone Model
struct NextMilestone: Codable {
    let nextMilestone: Int?
    let daysUntilMilestone: Int?
    let reward: StreakReward?
}

// MARK: - Anniversary Badge Enum
enum AnniversaryBadge: String, Codable {
    case year1 = "year_1_anniversary"
    case year2 = "year_2_anniversary"
    case year3 = "year_3_anniversary"
    case year5 = "year_5_anniversary"
    case year10 = "year_10_anniversary"
}

// MARK: - Anniversary Reward Model
struct AnniversaryReward: Codable, Identifiable {
    let id: String
    let userId: String
    let anniversaryYear: Int
    let anniversaryDate: Date
    let isGranted: Bool
    let grantedAt: Date?
    let couponId: String?
    let badgeAwarded: AnniversaryBadge?
    let isRedeemed: Bool
    let redeemedAt: Date?
    let customMessage: String?
    let metadata: [String: AnyCodable]?
    let createdAt: Date
}

// MARK: - Next Anniversary Model
struct NextAnniversary: Codable {
    let nextAnniversaryYear: Int?
    let nextAnniversaryDate: Date?
    let daysUntilAnniversary: Int?
    let badge: AnniversaryBadge?
}

// MARK: - Loyalty Dashboard Model
struct LoyaltyDashboard: Codable {
    let streak: StreakInfo
    let tier: TierProgress
    let nextMilestone: NextMilestone
    let streakSaverTokens: Int
    let nextAnniversary: NextAnniversary
    let perks: [TierPerk]

    struct StreakInfo: Codable {
        let consecutiveDays: Int
        let longestStreak: Int
        let monthlyPoints: Int
        let tierXP: Int
        let monthlyVisits: Int
    }
}

// MARK: - API Response Models
struct StreakResponse: Codable {
    let success: Bool
    let data: UserStreak
}

struct VisitsResponse: Codable {
    let success: Bool
    let data: [StreakVisit]
}

struct TokensResponse: Codable {
    let success: Bool
    let data: [StreakSaverToken]
}

struct TokenCountResponse: Codable {
    let success: Bool
    let data: TokenCount

    struct TokenCount: Codable {
        let count: Int
    }
}

struct RewardsResponse: Codable {
    let success: Bool
    let data: [StreakReward]
}

struct NextMilestoneResponse: Codable {
    let success: Bool
    let data: NextMilestone
}

struct TierProgressResponse: Codable {
    let success: Bool
    let data: TierProgress
}

struct TierPerksResponse: Codable {
    let success: Bool
    let data: [TierPerk]
}

struct AnniversariesResponse: Codable {
    let success: Bool
    let data: [AnniversaryReward]
}

struct NextAnniversaryResponse: Codable {
    let success: Bool
    let data: NextAnniversary
}

struct DashboardResponse: Codable {
    let success: Bool
    let data: LoyaltyDashboard
}

struct UseTokenResponse: Codable {
    let success: Bool
    let message: String
    let data: StreakSaverToken?
}

struct VisitedTodayResponse: Codable {
    let success: Bool
    let data: VisitedToday

    struct VisitedToday: Codable {
        let visited: Bool
    }
}
