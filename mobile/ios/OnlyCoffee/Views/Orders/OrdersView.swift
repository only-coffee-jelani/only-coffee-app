import SwiftUI

struct OrdersView: View {
    @StateObject private var viewModel = OrdersViewModel()
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        NavigationView {
            Group {
                if let user = authManager.currentUser {
                    // User is logged in - show orders
                    if viewModel.isLoading {
                        ProgressView("Loading orders...")
                    } else if viewModel.orders.isEmpty {
                        VStack(spacing: 20) {
                            Image(systemName: "list.bullet.clipboard")
                                .font(.system(size: 80))
                                .foregroundColor(.gray)
                            Text("No orders yet")
                                .font(.title2)
                                .foregroundColor(.secondary)
                            Text("Place your first order to see it here")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    } else {
                        List(viewModel.orders) { order in
                            NavigationLink(destination: OrderDetailView(order: order)) {
                                OrderRow(order: order)
                            }
                        }
                        .listStyle(.insetGrouped)
                    }
                } else {
                    // Not logged in - show sign in prompt
                    VStack(spacing: 20) {
                        Spacer()

                        Image(systemName: "list.bullet.clipboard.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.brandPink)

                        VStack(spacing: 8) {
                            Text("Sign In to View Orders")
                                .font(.title2.bold())
                            Text("Access your order history and track your purchases")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }

                        NavigationLink(destination: LoginView()) {
                            Text("Sign In")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.brandPink)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                        .padding(.horizontal, 40)

                        Spacer()
                    }
                }
            }
            .navigationTitle("Orders")
            .task {
                if authManager.currentUser != nil {
                    await viewModel.loadOrders()
                }
            }
            .refreshable {
                if authManager.currentUser != nil {
                    await viewModel.loadOrders()
                }
            }
        }
    }
}

struct OrderRow: View {
    let order: Order

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(order.store?.name ?? "Store")
                    .font(.headline)
                Spacer()
                Text(order.status.displayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(order.statusColor).opacity(0.2))
                    .foregroundColor(Color(order.statusColor))
                    .cornerRadius(8)
            }

            if let pickupTime = order.pickupTimeFormatted {
                Text("Pickup: \(pickupTime)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            HStack {
                Text(order.formattedTotal)
                    .font(.headline)
                    .foregroundColor(.orange)
                Spacer()
                if let items = order.items {
                    Text("\(items.count) items")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct OrderDetailView: View {
    let order: Order

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Status
                HStack {
                    Text(order.status.displayName)
                        .font(.title2.bold())
                    Spacer()
                }
                .padding()
                .background(Color(order.statusColor).opacity(0.1))
                .cornerRadius(12)

                // Items
                VStack(alignment: .leading, spacing: 12) {
                    Text("Order Items")
                        .font(.headline)

                    if let items = order.items {
                        ForEach(items) { item in
                            HStack {
                                Text("\(item.quantity)x \(item.itemName)")
                                Spacer()
                                Text(item.formattedTotalPrice)
                            }
                        }
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(12)

                // Summary
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Subtotal")
                        Spacer()
                        Text(String(format: "$%.2f", order.subtotal))
                    }
                    HStack {
                        Text("Tax")
                        Spacer()
                        Text(String(format: "$%.2f", order.tax))
                    }
                    Divider()
                    HStack {
                        Text("Total")
                            .fontWeight(.bold)
                        Spacer()
                        Text(order.formattedTotal)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(12)
            }
            .padding()
        }
        .navigationTitle("Order Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

@MainActor
class OrdersViewModel: ObservableObject {
    @Published var orders: [Order] = []
    @Published var isLoading = false

    private let apiClient = APIClient.shared

    func loadOrders() async {
        isLoading = true

        do {
            orders = try await apiClient.request(
                endpoint: Endpoint.getOrders.path,
                method: .get,
                requiresAuth: true
            )
        } catch {
            print("Failed to load orders: \(error)")
        }

        isLoading = false
    }
}
