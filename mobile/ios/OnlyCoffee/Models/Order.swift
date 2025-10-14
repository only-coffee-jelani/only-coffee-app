import Foundation

struct Order: Codable, Identifiable {
    let id: String
    let userId: String
    let storeId: String
    let store: Store?
    let orderType: OrderType
    let status: OrderStatus
    let subtotal: Double
    let tax: Double
    let total: Double
    let pickupTime: Date?
    let specialInstructions: String?
    let items: [OrderItem]?
    let createdAt: Date
    let updatedAt: Date

    var formattedTotal: String {
        String(format: "$%.2f", total)
    }

    var pickupTimeFormatted: String? {
        guard let pickupTime = pickupTime else { return nil }
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: pickupTime)
    }

    var statusColor: String {
        switch status {
        case .initiated, .slotReserved: return "gray"
        case .confirmed, .inProgress: return "blue"
        case .ready: return "green"
        case .completed: return "green"
        case .cancelled: return "red"
        }
    }
}

enum OrderType: String, Codable {
    case pickup = "pickup"
    case delivery = "delivery"

    var displayName: String {
        rawValue.capitalized
    }
}

enum OrderStatus: String, Codable {
    case initiated = "initiated"
    case slotReserved = "slot_reserved"
    case confirmed = "confirmed"
    case inProgress = "in_progress"
    case ready = "ready"
    case completed = "completed"
    case cancelled = "cancelled"

    var displayName: String {
        switch self {
        case .initiated: return "Initiated"
        case .slotReserved: return "Slot Reserved"
        case .confirmed: return "Confirmed"
        case .inProgress: return "In Progress"
        case .ready: return "Ready"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }
}

struct OrderItem: Codable, Identifiable {
    let id: String
    let orderId: String
    let menuItemId: String
    let itemName: String
    let quantity: Int
    let basePrice: Double
    let modifiersPrice: Double
    let totalPrice: Double
    let modifiers: [OrderItemModifier]?
    let specialInstructions: String?

    var formattedTotalPrice: String {
        String(format: "$%.2f", totalPrice)
    }
}

struct OrderItemModifier: Codable {
    let modifierId: String
    let modifierName: String
    let optionId: String
    let optionName: String
    let priceAdjustment: Double
}

struct CreateOrderRequest: Codable {
    let storeId: String
    let items: [CreateOrderItem]
    let orderType: OrderType
    let pickupTime: String // "ASAP" or ISO8601 date string
    let specialInstructions: String?
}

struct CreateOrderItem: Codable {
    let menuItemId: String
    let itemName: String
    let quantity: Int
    let basePrice: Double
    let modifiersPrice: Double
    let totalPrice: Double
    let modifiers: [OrderItemModifier]?
    let specialInstructions: String?
}

struct ConfirmOrderRequest: Codable {
    let paymentIntentId: String
}
