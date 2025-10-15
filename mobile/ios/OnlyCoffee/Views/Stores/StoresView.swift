import SwiftUI
import MapKit

struct StoresView: View {
    @StateObject private var viewModel = StoresViewModel()
    @State private var showingMap = true

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
                        StoreListView(stores: viewModel.stores)
                    }
                }
            }
            .navigationTitle("Locations")
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
