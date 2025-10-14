import Foundation

struct CartItem: Identifiable {
    let id = UUID()
    let menuItem: MenuItem
    var quantity: Int
    var selectedModifiers: [SelectedCartModifier]
    var specialInstructions: String?

    var totalPrice: Double {
        let modifiersPrice = selectedModifiers.reduce(0) { $0 + $1.priceAdjustment }
        return (menuItem.basePrice + modifiersPrice) * Double(quantity)
    }

    var formattedTotalPrice: String {
        String(format: "$%.2f", totalPrice)
    }

    func toCreateOrderItem() -> CreateOrderItem {
        let modifiersPrice = selectedModifiers.reduce(0) { $0 + $1.priceAdjustment }
        let itemTotal = menuItem.basePrice + modifiersPrice

        let orderModifiers = selectedModifiers.map { modifier in
            OrderItemModifier(
                modifierId: modifier.modifierId,
                modifierName: modifier.modifierName,
                optionId: modifier.optionId,
                optionName: modifier.optionName,
                priceAdjustment: modifier.priceAdjustment
            )
        }

        return CreateOrderItem(
            menuItemId: menuItem.id,
            itemName: menuItem.name,
            quantity: quantity,
            basePrice: menuItem.basePrice,
            modifiersPrice: modifiersPrice,
            totalPrice: itemTotal,
            modifiers: orderModifiers.isEmpty ? nil : orderModifiers,
            specialInstructions: specialInstructions
        )
    }
}

struct SelectedCartModifier: Identifiable {
    let id = UUID()
    let modifierId: String
    let modifierName: String
    let optionId: String
    let optionName: String
    let priceAdjustment: Double

    var formattedPriceAdjustment: String? {
        guard priceAdjustment != 0 else { return nil }
        let prefix = priceAdjustment > 0 ? "+" : ""
        return "\(prefix)$\(String(format: "%.2f", priceAdjustment))"
    }
}
