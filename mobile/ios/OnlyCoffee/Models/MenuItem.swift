import Foundation

struct MenuItem: Codable, Identifiable {
    let id: String
    let toastItemId: String?
    let storeId: String
    let name: String
    let description: String?
    let category: String
    let basePrice: Double
    let imageUrl: String?
    let isAvailable: Bool
    let modifiers: [MenuModifier]?
    let calories: Int?
    let isPopular: Bool

    var formattedPrice: String {
        String(format: "$%.2f", basePrice)
    }
}

struct MenuModifier: Codable, Identifiable {
    let id: String
    let name: String
    let options: [ModifierOption]
    let isRequired: Bool
    let maxSelections: Int?
}

struct ModifierOption: Codable, Identifiable {
    let id: String
    let name: String
    let priceAdjustment: Double

    var formattedPriceAdjustment: String? {
        guard priceAdjustment != 0 else { return nil }
        let prefix = priceAdjustment > 0 ? "+" : ""
        return "\(prefix)$\(String(format: "%.2f", priceAdjustment))"
    }
}

struct PriceCalculationRequest: Codable {
    let menuItemId: String
    let modifiers: [SelectedModifier]
}

struct SelectedModifier: Codable {
    let modifierId: String
    let optionId: String
}

struct PriceCalculationResponse: Codable {
    let basePrice: Double
    let modifiersPrice: Double
    let totalPrice: Double
}
