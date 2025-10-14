import Foundation

@MainActor
class CartManager: ObservableObject {
    static let shared = CartManager()

    @Published var items: [CartItem] = []
    @Published var selectedStore: Store?

    private init() {}

    var subtotal: Double {
        items.reduce(0) { $0 + $1.totalPrice }
    }

    var tax: Double {
        subtotal * 0.0875 // 8.75% California tax
    }

    var total: Double {
        subtotal + tax
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
    }

    func setStore(_ store: Store) {
        // If changing stores, clear cart
        if let currentStore = selectedStore, currentStore.id != store.id {
            clearCart()
        }
        selectedStore = store
    }
}
