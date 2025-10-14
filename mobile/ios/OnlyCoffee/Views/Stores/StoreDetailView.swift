import SwiftUI

struct StoreDetailView: View {
    let store: Store
    let distance: Double
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var cartManager: CartManager

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header image placeholder
                Rectangle()
                    .fill(LinearGradient(
                        colors: [Color.orange.opacity(0.6), Color.brown.opacity(0.4)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(height: 200)
                    .overlay(
                        VStack {
                            Image(systemName: "cup.and.saucer.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.white)
                            Text(store.name)
                                .font(.title.bold())
                                .foregroundColor(.white)
                        }
                    )

                VStack(alignment: .leading, spacing: 16) {
                    // Status
                    HStack {
                        if store.acceptingOrders {
                            Label("Open & Accepting Orders", systemImage: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        } else {
                            Label("Currently Closed", systemImage: "xmark.circle.fill")
                                .foregroundColor(.red)
                        }
                        Spacer()
                        Label(String(format: "%.1f mi", distance), systemImage: "location.fill")
                            .foregroundColor(.orange)
                    }
                    .font(.subheadline)

                    Divider()

                    // Address
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Address", systemImage: "mappin.circle.fill")
                            .font(.headline)
                            .foregroundColor(.orange)

                        Text(store.fullAddress)
                            .font(.body)
                            .foregroundColor(.primary)
                    }

                    // Hours
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Hours", systemImage: "clock.fill")
                            .font(.headline)
                            .foregroundColor(.orange)

                        Text("\(store.openingTime) - \(store.closingTime)")
                            .font(.body)
                            .foregroundColor(.primary)
                    }

                    // Phone
                    if let phone = store.phone {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("Phone", systemImage: "phone.fill")
                                .font(.headline)
                                .foregroundColor(.orange)

                            Text(phone)
                                .font(.body)
                                .foregroundColor(.primary)
                        }
                    }

                    Divider()

                    // Browse menu button
                    NavigationLink(destination: MenuView(store: store)) {
                        HStack {
                            Image(systemName: "list.bullet")
                            Text("Browse Menu")
                                .fontWeight(.semibold)
                            Spacer()
                            Image(systemName: "chevron.right")
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!store.acceptingOrders)
                    .opacity(store.acceptingOrders ? 1.0 : 0.6)
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            cartManager.setStore(store)
        }
    }
}
