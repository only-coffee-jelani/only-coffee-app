import SwiftUI

struct CheckoutView: View {
    @EnvironmentObject var cartManager: CartManager
    @StateObject private var viewModel = CheckoutViewModel()
    @State private var pickupTime = "ASAP"
    @State private var specialInstructions = ""
    @State private var showingCouponSelector = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Store info
                if let store = cartManager.selectedStore {
                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Pickup Location")
                                .font(.headline)
                            Text(store.name)
                                .font(.body)
                            Text(store.fullAddress)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                }

                // Pickup time
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Pickup Time")
                            .font(.headline)

                        Picker("Pickup Time", selection: $pickupTime) {
                            Text("ASAP (10-15 min)").tag("ASAP")
                            Text("Later").tag("LATER")
                        }
                        .pickerStyle(.segmented)

                        if pickupTime == "LATER" {
                            Text("Custom time selection coming soon")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // Coupon section
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Coupon")
                            .font(.headline)

                        Button(action: {
                            showingCouponSelector = true
                        }) {
                            HStack {
                                Image(systemName: "ticket.fill")
                                    .foregroundColor(.orange)

                                if let coupon = cartManager.selectedCoupon {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(coupon.displayValue)
                                            .font(.subheadline)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.primary)
                                        Text(coupon.label)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                } else {
                                    Text("Add a coupon")
                                        .foregroundColor(.primary)
                                }

                                Spacer()

                                if cartManager.selectedCoupon != nil {
                                    Text("-\(String(format: "$%.2f", cartManager.discountAmount))")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.green)
                                }

                                Image(systemName: "chevron.right")
                                    .foregroundColor(.gray)
                                    .font(.caption)
                            }
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                }

                // Special instructions
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Special Instructions")
                            .font(.headline)

                        TextField("Any special requests for your order?", text: $specialInstructions, axis: .vertical)
                            .lineLimit(3...5)
                            .textFieldStyle(.roundedBorder)
                    }
                }

                // Order summary
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Order Summary")
                            .font(.headline)

                        ForEach(cartManager.items) { item in
                            HStack {
                                Text("\(item.quantity)x \(item.menuItem.name)")
                                Spacer()
                                Text(item.formattedTotalPrice)
                            }
                            .font(.subheadline)
                        }

                        Divider()

                        HStack {
                            Text("Subtotal")
                            Spacer()
                            Text(String(format: "$%.2f", cartManager.subtotal))
                        }

                        // Show discount if coupon applied
                        if cartManager.discountAmount > 0 {
                            HStack {
                                Text("Discount")
                                Spacer()
                                Text("-\(String(format: "$%.2f", cartManager.discountAmount))")
                                    .foregroundColor(.green)
                            }
                        }

                        HStack {
                            Text("Tax")
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
                        .font(.title3)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                }

                // Place order button
                Button(action: {
                    Task {
                        await viewModel.placeOrder(
                            cartManager: cartManager,
                            pickupTime: pickupTime,
                            specialInstructions: specialInstructions.isEmpty ? nil : specialInstructions
                        )
                    }
                }) {
                    HStack {
                        if viewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Place Order")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(viewModel.isLoading)

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding()
                }
            }
            .padding()
        }
        .navigationTitle("Checkout")
        .sheet(isPresented: $showingCouponSelector) {
            CouponSelectorView()
                .environmentObject(cartManager)
        }
        .alert("Order Placed!", isPresented: $viewModel.showingSuccess) {
            Button("OK") {
                cartManager.clearCart()
            }
        } message: {
            Text("Your order has been placed successfully!")
        }
    }
}

@MainActor
class CheckoutViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showingSuccess = false

    private let apiClient = APIClient.shared

    func placeOrder(cartManager: CartManager, pickupTime: String, specialInstructions: String?) async {
        guard let store = cartManager.selectedStore else {
            errorMessage = "No store selected"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            // Create order request
            let orderItems = cartManager.items.map { $0.toCreateOrderItem() }
            let request = CreateOrderRequest(
                storeId: store.id,
                items: orderItems,
                orderType: .pickup,
                pickupTime: pickupTime,
                specialInstructions: specialInstructions,
                couponId: cartManager.selectedCoupon?.id
            )

            let _: Order = try await apiClient.request(
                endpoint: Endpoint.createOrder.path,
                method: .post,
                body: request,
                requiresAuth: true
            )

            showingSuccess = true

        } catch let error as APIError {
            errorMessage = error.errorDescription
            // If coupon error, suggest removing it
            if let desc = error.errorDescription, desc.contains("coupon") || desc.contains("Coupon") {
                errorMessage = "\(desc)\n\nTry removing the coupon and placing the order again."
            }
        } catch {
            errorMessage = "Failed to place order"
        }

        isLoading = false
    }
}
