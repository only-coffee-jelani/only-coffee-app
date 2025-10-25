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
    private var allCategories: [Category] = []

    func loadAllMenuItems() async {
        isLoading = true
        errorMessage = nil

        do {
            // Fetch categories from API
            allCategories = try await apiClient.request(
                endpoint: Endpoint.getCategories.path,
                method: .get,
                requiresAuth: false
            )

            // Fetch menu items
            allMenuItems = try await apiClient.request(
                endpoint: Endpoint.getAllMenuItems.path,
                method: .get,
                requiresAuth: false
            )

            // Extract unique categories from menu items
            var uniqueCategories = Set<String>()
            for item in allMenuItems {
                uniqueCategories.formUnion(item.categories)
            }

            // Filter API categories to only show those that have menu items, sorted by sortOrder
            let availableCategories = allCategories
                .filter { uniqueCategories.contains($0.name) }
                .sorted { $0.sortOrder < $1.sortOrder }

            categories = availableCategories.map { $0.name }

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

        // Filter by category - check if category is in item's categories array
        items = items.filter { $0.categories.contains(category) }

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

    func getAllItemsGroupedByCategory(store: Store?, searchText: String) -> [(category: String, items: [MenuItem])] {
        var items = allMenuItems

        // Filter by store if selected
        if let store = store {
            items = items.filter { $0.isAvailableAt(storeId: store.id) }
        }

        // Filter by search text
        if !searchText.isEmpty {
            items = items.filter { item in
                item.name.localizedCaseInsensitiveContains(searchText) ||
                (item.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Only show active and available items
        items = items.filter { $0.isActive && $0.isAvailable }

        // Sort items by sortOrder, then by name
        items.sort { item1, item2 in
            if let order1 = item1.sortOrder, let order2 = item2.sortOrder {
                if order1 != order2 {
                    return order1 < order2
                }
            }
            return item1.name < item2.name
        }

        // Group items by category in the order of categories array
        var grouped: [(category: String, items: [MenuItem])] = []
        for category in categories {
            let categoryItems = items.filter { $0.categories.contains(category) }
            if !categoryItems.isEmpty {
                grouped.append((category: category, items: categoryItems))
            }
        }

        return grouped
    }

    func itemsByCategory(_ category: String) -> [MenuItem] {
        return filteredItems.filter { $0.category == category }
    }

    func setSelectedStore(_ store: Store?) {
        selectedStore = store
    }
}
