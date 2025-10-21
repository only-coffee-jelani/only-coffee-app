import Foundation

@MainActor
class CartManager: ObservableObject {
    static let shared = CartManager()

    @Published var items: [CartItem] = []
    @Published var selectedStore: Store?
    @Published var selectedCoupon: Coupon?
    @Published var discountAmount: Double = 0.0

    private init() {}

    var subtotal: Double {
        items.reduce(0) { $0 + $1.totalPrice }
    }

    var taxableAmount: Double {
        max(0, subtotal - discountAmount)
    }

    var tax: Double {
        taxableAmount * 0.0875 // 8.75% California tax
    }

    var total: Double {
        taxableAmount + tax
    }

    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    var formattedTotal: String {
        String(format: "$%.2f", total)
    }

    // MARK: - Cart Operations
    func addItem(_ item: CartItem) {
        // Check if same item with same modifiers exists
        if let index = items.firstIndex(where: { existingItem in
            existingItem.menuItem.id == item.menuItem.id &&
            existingItem.selectedModifiers.map { $0.optionId } == item.selectedModifiers.map { $0.optionId }
        }) {
            // Increment quantity
            items[index].quantity += item.quantity
        } else {
            // Add new item
            items.append(item)
        }
    }

    func removeItem(at index: Int) {
        items.remove(at: index)
    }

    func updateQuantity(at index: Int, quantity: Int) {
        guard quantity > 0 else {
            removeItem(at: index)
            return
        }
        items[index].quantity = quantity
    }

    func clearCart() {
        items.removeAll()
        selectedStore = nil
        selectedCoupon = nil
        discountAmount = 0.0
    }

    func setStore(_ store: Store) {
        // If changing stores, clear cart
        if let currentStore = selectedStore, currentStore.id != store.id {
            clearCart()
        }
        selectedStore = store
    }

    // MARK: - Coupon Operations
    func applyCoupon(_ coupon: Coupon) {
        selectedCoupon = coupon
        calculateDiscount()
    }

    func removeCoupon() {
        selectedCoupon = nil
        discountAmount = 0.0
    }

    private func calculateDiscount() {
        guard let coupon = selectedCoupon else {
            discountAmount = 0.0
            return
        }

        // Calculate discount based on coupon type
        switch coupon.type {
        case .percentOff:
            if let percentOff = coupon.percentOff {
                discountAmount = subtotal * (Double(percentOff) / 100.0)
            }
        case .fixedPrice:
            if let priceOverrideCents = coupon.priceOverrideCents, !items.isEmpty {
                let fixedPrice = Double(priceOverrideCents) / 100.0
                let firstItemPrice = items[0].totalPrice * Double(items[0].quantity)
                discountAmount = max(0, firstItemPrice - fixedPrice)
            }
        case .fixedAmount:
            if let valueCents = coupon.valueCents {
                let fixedAmount = Double(valueCents) / 100.0
                discountAmount = min(fixedAmount, subtotal)
            }
        case .freeItem:
            if !items.isEmpty {
                discountAmount = items[0].totalPrice * Double(items[0].quantity)
            }
        }

        // Ensure discount doesn't exceed subtotal
        discountAmount = min(discountAmount, subtotal)
    }
}
