import SwiftUI

struct MenuView: View {
    let store: Store
    @StateObject private var viewModel: MenuViewModel

    init(store: Store) {
        self.store = store
        _viewModel = StateObject(wrappedValue: MenuViewModel(storeId: store.id))
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView("Loading menu...")
            } else if let errorMessage = viewModel.errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)
                    Text(errorMessage)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task { await viewModel.loadMenu() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else {
                List {
                    ForEach(viewModel.categories, id: \.self) { category in
                        Section(header: Text(category).font(.headline)) {
                            ForEach(viewModel.itemsByCategory[category] ?? []) { item in
                                NavigationLink(destination: MenuItemDetailView(menuItem: item)) {
                                    MenuItemRow(item: item)
                                }
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Menu")
        .task {
            await viewModel.loadMenu()
        }
    }
}

struct MenuItemRow: View {
    let item: MenuItem

    var body: some View {
        HStack(spacing: 12) {
            // Placeholder image
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.orange.opacity(0.2))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: "cup.and.saucer.fill")
                        .foregroundColor(.orange)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.headline)

                if let description = item.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                HStack {
                    Text(item.formattedPrice)
                        .font(.subheadline.bold())
                        .foregroundColor(.orange)

                    if item.isPopular {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                            .font(.caption)
                    }

                    if let calories = item.calories {
                        Text("\(calories) cal")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Spacer()

            if !item.isAvailable {
                Text("Unavailable")
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
        .padding(.vertical, 4)
        .opacity(item.isAvailable ? 1.0 : 0.5)
    }
}

@MainActor
class MenuViewModel: ObservableObject {
    @Published var menuItems: [MenuItem] = []
    @Published var categories: [String] = []
    @Published var itemsByCategory: [String: [MenuItem]] = [:]
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let storeId: String
    private let apiClient = APIClient.shared

    init(storeId: String) {
        self.storeId = storeId
    }

    func loadMenu() async {
        isLoading = true
        errorMessage = nil

        do {
            menuItems = try await apiClient.request(
                endpoint: Endpoint.getMenu(storeId: storeId).path,
                method: .get,
                requiresAuth: true
            )

            // Group by category
            let grouped = Dictionary(grouping: menuItems) { $0.category }
            itemsByCategory = grouped
            categories = grouped.keys.sorted()

        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to load menu"
        }

        isLoading = false
    }
}
