import SwiftUI

struct StoreListView: View {
    let stores: [StoreWithDistance]

    var body: some View {
        List(stores) { storeWithDistance in
            NavigationLink(destination: StoreDetailView(store: storeWithDistance.store, distance: storeWithDistance.distance)) {
                StoreRowView(storeWithDistance: storeWithDistance)
            }
        }
        .listStyle(.plain)
    }
}

struct StoreRowView: View {
    let storeWithDistance: StoreWithDistance

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: storeWithDistance.store.type.icon)
                .font(.title2)
                .foregroundColor(.orange)
                .frame(width: 40)

            // Store info
            VStack(alignment: .leading, spacing: 4) {
                Text(storeWithDistance.store.name)
                    .font(.headline)

                Text(storeWithDistance.store.address)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                HStack(spacing: 8) {
                    Label(storeWithDistance.distanceText, systemImage: "location.fill")
                        .font(.caption)
                        .foregroundColor(.orange)

                    if storeWithDistance.store.acceptingOrders {
                        Label("Open", systemImage: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                    } else {
                        Label("Closed", systemImage: "xmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
                .font(.caption)
        }
        .padding(.vertical, 8)
    }
}
