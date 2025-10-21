import SwiftUI

struct CartView: View {
    @EnvironmentObject var cartManager: CartManager
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Group {
                if cartManager.items.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "cart")
                            .font(.system(size: 80))
                            .foregroundColor(.gray)
                        Text("Your cart is empty")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("Add items from the menu to get started")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    VStack(spacing: 0) {
                        // Cart items
                        List {
                            ForEach(Array(cartManager.items.enumerated()), id: \.offset) { index, item in
                                CartItemRow(item: item, index: index)
                            }
                            .onDelete { indexSet in
                                indexSet.forEach { cartManager.removeItem(at: $0) }
                            }

                            // Summary section
                            Section {
                                HStack {
                                    Text("Subtotal")
                                    Spacer()
                                    Text(String(format: "$%.2f", cartManager.subtotal))
                                }

                                // Show discount if coupon applied
                                if cartManager.discountAmount > 0, let coupon = cartManager.selectedCoupon {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("Coupon Discount")
                                            Text(coupon.label)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        Spacer()
                                        Text("-\(String(format: "$%.2f", cartManager.discountAmount))")
                                            .foregroundColor(.green)
                                    }
                                }

                                HStack {
                                    Text("Tax (8.75%)")
                                    Spacer()
                                    Text(String(format: "$%.2f", cartManager.tax))
                                }

                                HStack {
                                    Text("Total")
                                        .fontWeight(.bold)
                                    Spacer()
                                    Text(cartManager.formattedTotal)
                                        .fontWeight(.bold)
                                        .foregroundColor(.orange)
                                }
                            }
                        }
                        .listStyle(.insetGrouped)

                        // Checkout button
                        NavigationLink(destination: CheckoutView()) {
                            HStack {
                                Image(systemName: "creditcard.fill")
                                Text("Proceed to Checkout")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.orange)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Cart")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                if !cartManager.items.isEmpty {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(role: .destructive) {
                            cartManager.clearCart()
                        } label: {
                            Text("Clear")
                        }
                    }
                }
            }
        }
    }
}

struct CartItemRow: View {
    let item: CartItem
    let index: Int
    @EnvironmentObject var cartManager: CartManager

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.menuItem.name)
                    .font(.headline)
                Spacer()
                Text(item.formattedTotalPrice)
                    .font(.headline)
                    .foregroundColor(.orange)
            }

            // Modifiers
            if !item.selectedModifiers.isEmpty {
                ForEach(item.selectedModifiers) { modifier in
                    HStack {
                        Text("• \(modifier.optionName)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        if let price = modifier.formattedPriceAdjustment {
                            Text(price)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            // Special instructions
            if let instructions = item.specialInstructions {
                Text("Note: \(instructions)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .italic()
            }

            // Quantity controls
            HStack {
                Button(action: {
                    cartManager.updateQuantity(at: index, quantity: item.quantity - 1)
                }) {
                    Image(systemName: "minus.circle")
                        .foregroundColor(.orange)
                }

                Text("\(item.quantity)")
                    .frame(minWidth: 30)

                Button(action: {
                    cartManager.updateQuantity(at: index, quantity: item.quantity + 1)
                }) {
                    Image(systemName: "plus.circle")
                        .foregroundColor(.orange)
                }

                Spacer()

                Button(role: .destructive) {
                    cartManager.removeItem(at: index)
                } label: {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct CartView_Previews: PreviewProvider {
    static var previews: some View {
        CartView()
            .environmentObject(CartManager.shared)
    }
}
