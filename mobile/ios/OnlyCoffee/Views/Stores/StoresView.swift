import SwiftUI
import MapKit

struct StoresView: View {
    @StateObject private var viewModel = StoresViewModel()
    @State private var showingMap = true
    @Environment(\.dismiss) var dismiss

    // Optional callback for selection mode
    var onStoreSelected: ((Store) -> Void)?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Toggle between map and list
                Picker("View", selection: $showingMap) {
                    Text("Map").tag(true)
                    Text("List").tag(false)
                }
                .pickerStyle(.segmented)
                .padding()

                if viewModel.isLoading {
                    ProgressView("Finding nearby stores...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage = viewModel.errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.orange)
                        Text(errorMessage)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                        Button("Retry") {
                            Task {
                                await viewModel.loadNearbyStores()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    if showingMap {
                        StoreMapView(stores: viewModel.stores, selectedStore: $viewModel.selectedStore)
                            .ignoresSafeArea(edges: .bottom)
                    } else {
                        // Add "All Locations" option when in selection mode
                        if onStoreSelected != nil {
                            List {
                                // "All Locations" button
                                Button(action: {
                                    onStoreSelected?(nil as Store? ?? Store(
                                        id: "all",
                                        name: "All Locations",
                                        type: .store,
                                        address: "",
                                        city: "",
                                        state: "",
                                        zipCode: "",
                                        latitude: 0,
                                        longitude: 0,
                                        phone: nil,
                                        isActive: true,
                                        acceptingOrders: true,
                                        capacity: 0,
                                        openingTime: "",
                                        closingTime: ""
                                    ))
                                    dismiss()
                                }) {
                                    HStack(spacing: 12) {
                                        Image(systemName: "mappin.and.ellipse")
                                            .font(.title2)
                                            .foregroundColor(.brandPink)
                                            .frame(width: 40)

                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("All Locations")
                                                .font(.headline)
                                                .foregroundColor(.primary)
                                            Text("Show menu items from all stores")
                                                .font(.subheadline)
                                                .foregroundColor(.secondary)
                                        }

                                        Spacer()
                                    }
                                    .padding(.vertical, 8)
                                }

                                Section(header: Text("Nearby Stores")) {
                                    ForEach(viewModel.stores) { storeWithDistance in
                                        Button(action: {
                                            onStoreSelected?(storeWithDistance.store)
                                            dismiss()
                                        }) {
                                            StoreRowView(storeWithDistance: storeWithDistance)
                                        }
                                    }
                                }
                            }
                            .listStyle(.insetGrouped)
                        } else {
                            StoreListView(stores: viewModel.stores)
                        }
                    }
                }
            }
            .navigationTitle(onStoreSelected != nil ? "Select Location" : "Coffee Stores")
            .task {
                await viewModel.loadNearbyStores()
            }
            .sheet(item: $viewModel.selectedStore) { storeWithDistance in
                StoreDetailView(store: storeWithDistance.store, distance: storeWithDistance.distance)
            }
        }
    }
}

struct StoresView_Previews: PreviewProvider {
    static var previews: some View {
        StoresView()
            .environmentObject(CartManager.shared)
    }
}
