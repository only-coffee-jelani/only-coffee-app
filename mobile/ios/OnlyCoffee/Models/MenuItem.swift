import Foundation

struct MenuItem: Codable, Identifiable {
    let id: String
    let toastItemId: String?
    let storeIds: [String]
    let name: String
    let description: String?
    let category: String
    let categories: [String] // New multi-category field
    let basePrice: Double
    let imageUrl: String?
    let isAvailable: Bool
    let isActive: Bool
    let modifiers: [MenuModifier]?
    let calories: Int?
    let isPopular: Bool
    let allergens: [String]?
    let nutritionalInfo: [String: AnyCodable]?
    let preparationTime: Int?
    let sortOrder: Int?
    let createdAt: Date?
    let updatedAt: Date?

    // Coding keys for backwards compatibility with old API responses
    enum CodingKeys: String, CodingKey {
        case id, toastItemId, storeIds, name, description, category, categories, basePrice
        case imageUrl, isAvailable, isActive, calories, isPopular
        case allergens, nutritionalInfo, preparationTime, sortOrder, createdAt, updatedAt
        case modifiers = "availableModifiers"  // Backend uses "availableModifiers"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        toastItemId = try container.decodeIfPresent(String.self, forKey: .toastItemId)

        // Support both storeIds (array) and old storeId (single value)
        if let storeIds = try? container.decode([String].self, forKey: .storeIds) {
            self.storeIds = storeIds
        } else {
            self.storeIds = []
        }

        name = try container.decode(String.self, forKey: .name)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        category = try container.decode(String.self, forKey: .category)

        // Support both categories array and fallback to single category
        if let categoriesArray = try? container.decode([String].self, forKey: .categories), !categoriesArray.isEmpty {
            categories = categoriesArray
        } else {
            categories = [category]
        }

        // Backend returns basePrice as String, convert to Double
        if let priceString = try? container.decode(String.self, forKey: .basePrice) {
            basePrice = Double(priceString) ?? 0.0
        } else {
            basePrice = try container.decode(Double.self, forKey: .basePrice)
        }

        imageUrl = try container.decodeIfPresent(String.self, forKey: .imageUrl)
        isAvailable = try container.decodeIfPresent(Bool.self, forKey: .isAvailable) ?? true
        isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive) ?? true
        modifiers = try container.decodeIfPresent([MenuModifier].self, forKey: .modifiers)
        calories = try container.decodeIfPresent(Int.self, forKey: .calories)
        isPopular = try container.decodeIfPresent(Bool.self, forKey: .isPopular) ?? false
        allergens = try container.decodeIfPresent([String].self, forKey: .allergens)
        nutritionalInfo = try container.decodeIfPresent([String: AnyCodable].self, forKey: .nutritionalInfo)
        preparationTime = try container.decodeIfPresent(Int.self, forKey: .preparationTime)
        sortOrder = try container.decodeIfPresent(Int.self, forKey: .sortOrder)

        // Handle ISO8601 date strings
        let dateFormatter = ISO8601DateFormatter()
        if let createdAtString = try? container.decode(String.self, forKey: .createdAt) {
            createdAt = dateFormatter.date(from: createdAtString)
        } else {
            createdAt = try? container.decodeIfPresent(Date.self, forKey: .createdAt)
        }

        if let updatedAtString = try? container.decode(String.self, forKey: .updatedAt) {
            updatedAt = dateFormatter.date(from: updatedAtString)
        } else {
            updatedAt = try? container.decodeIfPresent(Date.self, forKey: .updatedAt)
        }
    }

    var formattedPrice: String {
        String(format: "$%.2f", basePrice)
    }

    var categoryDisplayName: String {
        MenuItem.getCategoryDisplayName(category)
    }

    static func getCategoryDisplayName(_ category: String) -> String {
        let displayNames: [String: String] = [
            "best_sellers": "Best Sellers",
            "seasonal_specials": "Seasonal Specials",
            "signature": "Signature",
            "hot_coffee": "Hot Coffee",
            "iced_coffee": "Iced Coffee",
            "cold_brew": "Cold Brew",
            "other_drinks": "Other Drinks",
            "chocolate": "Other Drinks", // Legacy support - map to Other Drinks
            "ice_cream": "Ice Cream",
            "add_ons": "Add Ons"
        ]
        return displayNames[category] ?? category.replacingOccurrences(of: "_", with: " ").capitalized
    }

    func isAvailableAt(storeId: String) -> Bool {
        return storeIds.contains(storeId)
    }

    var allergensList: String {
        guard let allergens = allergens, !allergens.isEmpty else {
            return "None"
        }
        return allergens.joined(separator: ", ")
    }

    var nutritionalText: String? {
        guard let nutritionalInfo = nutritionalInfo, !nutritionalInfo.isEmpty else {
            return nil
        }
        return nutritionalInfo.map { "\($0.key): \($0.value.value)" }.joined(separator: ", ")
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(toastItemId, forKey: .toastItemId)
        try container.encode(storeIds, forKey: .storeIds)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encode(category, forKey: .category)
        try container.encode(categories, forKey: .categories)
        try container.encode(basePrice, forKey: .basePrice)
        try container.encodeIfPresent(imageUrl, forKey: .imageUrl)
        try container.encode(isAvailable, forKey: .isAvailable)
        try container.encode(isActive, forKey: .isActive)
        try container.encodeIfPresent(modifiers, forKey: .modifiers)
        try container.encodeIfPresent(calories, forKey: .calories)
        try container.encode(isPopular, forKey: .isPopular)
        try container.encodeIfPresent(allergens, forKey: .allergens)
        try container.encodeIfPresent(nutritionalInfo, forKey: .nutritionalInfo)
        try container.encodeIfPresent(preparationTime, forKey: .preparationTime)
        try container.encodeIfPresent(sortOrder, forKey: .sortOrder)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
        try container.encodeIfPresent(updatedAt, forKey: .updatedAt)
    }
}

struct MenuModifier: Codable, Identifiable {
    let id: String
    let name: String
    let type: String?
    let options: [ModifierOption]
    let required: Bool
    let maxSelections: Int?

    // Coding keys for backwards compatibility
    enum CodingKeys: String, CodingKey {
        case id, name, type, options, required, maxSelections
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        type = try container.decodeIfPresent(String.self, forKey: .type)
        options = try container.decode([ModifierOption].self, forKey: .options)
        required = try container.decodeIfPresent(Bool.self, forKey: .required) ?? false
        maxSelections = try container.decodeIfPresent(Int.self, forKey: .maxSelections)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(type, forKey: .type)
        try container.encode(options, forKey: .options)
        try container.encode(required, forKey: .required)
        try container.encodeIfPresent(maxSelections, forKey: .maxSelections)
    }
}

struct ModifierOption: Codable, Identifiable {
    let id: String
    let value: String
    let price: Double

    // Coding keys for backwards compatibility
    enum CodingKeys: String, CodingKey {
        case id, value, price
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // Generate ID from value if not provided
        if let id = try? container.decode(String.self, forKey: .id) {
            self.id = id
        } else {
            _ = try container.decode(String.self, forKey: .value)
            self.id = UUID().uuidString
        }
        value = try container.decode(String.self, forKey: .value)
        price = try container.decode(Double.self, forKey: .price)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(value, forKey: .value)
        try container.encode(price, forKey: .price)
    }

    var formattedPriceAdjustment: String? {
        guard price != 0 else { return nil }
        let prefix = price > 0 ? "+" : ""
        return "\(prefix)$\(String(format: "%.2f", price))"
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
