import Foundation

@MainActor
class MenuBrowseViewModel: ObservableObject {
    @Published var allMenuItems: [MenuItem] = []
    @Published var filteredItems: [MenuItem] = []
    @Published var categories: [String] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedStore: Store?

    private let apiClient = APIClient.shared

    func loadAllMenuItems() async {
        isLoading = true
        errorMessage = nil

        do {
            allMenuItems = try await apiClient.request(
                endpoint: Endpoint.getAllMenuItems.path,
                method: .get,
                requiresAuth: false
            )

            // Extract unique categories
            categories = Array(Set(allMenuItems.map { $0.category })).sorted()

            // Initial filter with no store selected shows all items
            filterItems(by: selectedStore, category: categories.first ?? "", searchText: "")

        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to load menu items"
        }

        isLoading = false
    }

    func filterItems(by store: Store?, category: String, searchText: String) {
        var items = allMenuItems

        // Filter by store if selected
        if let store = store {
            items = items.filter { $0.isAvailableAt(storeId: store.id) }
        }

        // Filter by category
        items = items.filter { $0.category == category }

        // Filter by search text
        if !searchText.isEmpty {
            items = items.filter { item in
                item.name.localizedCaseInsensitiveContains(searchText) ||
                (item.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Only show active and available items
        items = items.filter { $0.isActive && $0.isAvailable }

        // Sort by sortOrder, then by name
        items.sort { item1, item2 in
            if let order1 = item1.sortOrder, let order2 = item2.sortOrder {
                if order1 != order2 {
                    return order1 < order2
                }
            }
            return item1.name < item2.name
        }

        filteredItems = items
    }

    func itemsByCategory(_ category: String) -> [MenuItem] {
        return filteredItems.filter { $0.category == category }
    }

    func setSelectedStore(_ store: Store?) {
        selectedStore = store
    }
}
