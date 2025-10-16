import Foundation

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
    let displayDuration: Int // in seconds
    let sortOrder: Int
    let createdAt: Date
    let updatedAt: Date
}
