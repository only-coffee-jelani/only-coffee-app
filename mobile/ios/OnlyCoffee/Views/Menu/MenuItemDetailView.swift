import SwiftUI

struct MenuItemDetailView: View {
    let menuItem: MenuItem
    @EnvironmentObject var cartManager: CartManager
    @Environment(\.dismiss) var dismiss

    @State private var quantity = 1
    @State private var selectedModifiers: [SelectedCartModifier] = []
    @State private var specialInstructions = ""
    @State private var showingAddedToCart = false

    var totalPrice: Double {
        let modifiersPrice = selectedModifiers.reduce(0) { $0 + $1.priceAdjustment }
        return (menuItem.basePrice + modifiersPrice) * Double(quantity)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Item image placeholder
                Rectangle()
                    .fill(LinearGradient(
                        colors: [Color.orange.opacity(0.3), Color.brown.opacity(0.2)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(height: 250)
                    .overlay(
                        Image(systemName: "cup.and.saucer.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.orange)
                    )

                VStack(alignment: .leading, spacing: 16) {
                    // Name and price
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(menuItem.name)
                                .font(.title.bold())

                            if let description = menuItem.description {
                                Text(description)
                                    .font(.body)
                                    .foregroundColor(.secondary)
                            }
                        }
                        Spacer()
                        Text(menuItem.formattedPrice)
                            .font(.title2.bold())
                            .foregroundColor(.orange)
                    }

                    if let calories = menuItem.calories {
                        Text("\(calories) calories")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    // Modifiers
                    if let modifiers = menuItem.modifiers, !modifiers.isEmpty {
                        Divider()

                        ForEach(modifiers) { modifier in
                            ModifierSection(
                                modifier: modifier,
                                selectedModifiers: $selectedModifiers
                            )
                        }
                    }

                    // Special instructions
                    Divider()

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Special Instructions")
                            .font(.headline)

                        TextField("Any special requests?", text: $specialInstructions, axis: .vertical)
                            .lineLimit(3...6)
                            .textFieldStyle(.roundedBorder)
                    }

                    // Quantity
                    HStack {
                        Text("Quantity")
                            .font(.headline)

                        Spacer()

                        HStack(spacing: 16) {
                            Button(action: {
                                if quantity > 1 {
                                    quantity -= 1
                                }
                            }) {
                                Image(systemName: "minus.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(quantity > 1 ? .orange : .gray)
                            }
                            .disabled(quantity <= 1)

                            Text("\(quantity)")
                                .font(.title3.bold())
                                .frame(minWidth: 30)

                            Button(action: {
                                quantity += 1
                            }) {
                                Image(systemName: "plus.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(.orange)
                            }
                        }
                    }

                    // Add to cart button
                    Button(action: {
                        let cartItem = CartItem(
                            menuItem: menuItem,
                            quantity: quantity,
                            selectedModifiers: selectedModifiers,
                            specialInstructions: specialInstructions.isEmpty ? nil : specialInstructions
                        )
                        cartManager.addItem(cartItem)
                        showingAddedToCart = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            dismiss()
                        }
                    }) {
                        HStack {
                            Image(systemName: "cart.fill.badge.plus")
                            Text("Add to Cart - \(String(format: "$%.2f", totalPrice))")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert("Added to Cart!", isPresented: $showingAddedToCart) {
            Button("OK", role: .cancel) {}
        }
    }
}

struct ModifierSection: View {
    let modifier: MenuModifier
    @Binding var selectedModifiers: [SelectedCartModifier]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(modifier.name)
                    .font(.headline)
                if modifier.isRequired {
                    Text("Required")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            ForEach(modifier.options) { option in
                Button(action: {
                    toggleOption(option)
                }) {
                    HStack {
                        Image(systemName: isSelected(option) ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(isSelected(option) ? .orange : .gray)

                        Text(option.name)
                            .foregroundColor(.primary)

                        Spacer()

                        if let priceText = option.formattedPriceAdjustment {
                            Text(priceText)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func isSelected(_ option: ModifierOption) -> Bool {
        selectedModifiers.contains { $0.optionId == option.id }
    }

    private func toggleOption(_ option: ModifierOption) {
        if let index = selectedModifiers.firstIndex(where: { $0.optionId == option.id }) {
            selectedModifiers.remove(at: index)
        } else {
            // If single selection, remove other options from same modifier
            if modifier.maxSelections == 1 {
                selectedModifiers.removeAll { $0.modifierId == modifier.id }
            }

            let cartModifier = SelectedCartModifier(
                modifierId: modifier.id,
                modifierName: modifier.name,
                optionId: option.id,
                optionName: option.name,
                priceAdjustment: option.priceAdjustment
            )
            selectedModifiers.append(cartModifier)
        }
    }
}
