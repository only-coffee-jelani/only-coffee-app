import SwiftUI

struct MenuBrowseView: View {
    @StateObject private var viewModel = MenuBrowseViewModel()
    @State private var selectedCategory: String = ""
    @State private var showingLocationPicker = false
    @State private var showStorePrompt = false
    @State private var searchText: String = ""

    var body: some View {
        NavigationStack {
            if viewModel.isLoading {
                ProgressView("Loading menu...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let errorMessage = viewModel.errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)
                    Text(errorMessage)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task { await viewModel.loadAllMenuItems() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else {
                menuContent
            }
        }
        .task {
            await viewModel.loadAllMenuItems()
            if !viewModel.categories.isEmpty {
                selectedCategory = viewModel.categories.first ?? ""
            }
        }
        .onChange(of: viewModel.isLoading) { isLoading in
            if !isLoading && !viewModel.allMenuItems.isEmpty && viewModel.selectedStore == nil && !showStorePrompt {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    showStorePrompt = true
                }
            }
        }
        .sheet(isPresented: $showStorePrompt) {
            StoresView(onStoreSelected: { store in
                viewModel.setSelectedStore(store)
            })
        }
    }

    var menuContent: some View {
        VStack(spacing: 0) {
            // Location Selector
            Button(action: {
                showingLocationPicker = true
            }) {
                HStack {
                    Image(systemName: "mappin.and.ellipse")
                        .foregroundColor(.brandPink)

                    if let store = viewModel.selectedStore {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(store.name)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.primary)
                            Text(store.address)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    } else {
                        Text(viewModel.allMenuItems.isEmpty ? "Select a location to view menu" : "All Locations")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .foregroundColor(.brandPink)
                }
                .padding()
                .background(Color.brandLight.opacity(0.1))
            }
            .sheet(isPresented: $showingLocationPicker) {
                StoresView(onStoreSelected: { store in
                    viewModel.setSelectedStore(store)
                })
            }

            Divider()

            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search menu items", text: $searchText)
                    .textFieldStyle(.plain)

                if !searchText.isEmpty {
                    Button(action: {
                        searchText = ""
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))

            Divider()

            // Main Content: Side Tabs + Infinite Scroll
            InfiniteScrollMenuView(
                viewModel: viewModel,
                selectedCategory: $selectedCategory,
                searchText: searchText
            )
        }
        .navigationTitle("Menu")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct InfiniteScrollMenuView: View {
    @ObservedObject var viewModel: MenuBrowseViewModel
    @Binding var selectedCategory: String
    let searchText: String

    var groupedItems: [(category: String, items: [MenuItem])] {
        viewModel.getAllItemsGroupedByCategory(store: viewModel.selectedStore, searchText: searchText)
    }

    var body: some View {
        HStack(spacing: 0) {
            // Left Side: Pinned Category Tabs
            ScrollView {
                VStack(spacing: 4) {
                    ForEach(viewModel.categories, id: \.self) { category in
                        CategoryTabButton(
                            category: category,
                            isSelected: selectedCategory == category
                        ) {
                            withAnimation {
                                selectedCategory = category
                            }
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            .frame(width: 80)
            .background(Color(.systemGroupedBackground))

            Divider()

            // Right Side: Infinite Scroll with Category Headers
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0, pinnedViews: [.sectionHeaders]) {
                        ForEach(groupedItems, id: \.category) { section in
                            Section(header: CategoryHeader(category: section.category)) {
                                ForEach(section.items, id: \.id) { item in
                                    NavigationLink(destination: MenuItemDetailView(menuItem: item, selectedStore: viewModel.selectedStore)) {
                                        MenuItemCard(item: item)
                                            .padding(.horizontal)
                                            .padding(.vertical, 8)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .id(section.category)
                        }

                        // Empty state
                        if groupedItems.isEmpty {
                            VStack(spacing: 16) {
                                Image(systemName: "magnifyingglass")
                                    .font(.system(size: 48))
                                    .foregroundColor(.secondary)

                                Text(searchText.isEmpty ? "No items available" : "No items found")
                                    .font(.headline)
                                    .foregroundColor(.primary)

                                Text(searchText.isEmpty ? "Try selecting a different location" : "Try a different search")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 60)
                        }
                    }
                }
                .background(Color(.systemGroupedBackground))
                .onChange(of: selectedCategory) { newCategory in
                    withAnimation {
                        proxy.scrollTo(newCategory, anchor: .top)
                    }
                }
            }
        }
    }
}

struct CategoryTabButton: View {
    let category: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(MenuItem.getCategoryDisplayName(category))
                .font(.caption2)
                .fontWeight(isSelected ? .bold : .regular)
                .foregroundColor(isSelected ? .white : .brandPink)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .padding(.horizontal, 4)
                .background(isSelected ? Color.brandPink : Color.clear)
                .cornerRadius(8)
        }
        .padding(.horizontal, 4)
    }
}

struct CategoryHeader: View {
    let category: String

    var body: some View {
        Text(MenuItem.getCategoryDisplayName(category))
            .font(.title3)
            .fontWeight(.bold)
            .foregroundColor(.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.systemGroupedBackground))
    }
}

struct MenuItemCard: View {
    let item: MenuItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Image placeholder
            ZStack {
                if let imageUrl = item.imageUrl, !imageUrl.isEmpty {
                    AsyncImage(url: URL(string: imageUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        placeholderImage
                    }
                    .frame(width: 100, height: 100)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    placeholderImage
                }

                if item.isPopular {
                    VStack {
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                                .padding(4)
                                .background(Color.white.opacity(0.9))
                                .clipShape(Circle())
                            Spacer()
                        }
                        Spacer()
                    }
                    .frame(width: 100, height: 100)
                }
            }

            // Item details
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(item.name)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    if item.isPopular {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                            .font(.caption)
                    }
                }

                if let description = item.description {
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                HStack(spacing: 12) {
                    Text(item.formattedPrice)
                        .font(.headline)
                        .foregroundColor(.brandPink)

                    if let calories = item.calories {
                        Text("\(calories) cal")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top, 4)
            }

            Spacer(minLength: 0)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    var placeholderImage: some View {
        RoundedRectangle(cornerRadius: 12)
            .fill(Color.brandLight.opacity(0.3))
            .frame(width: 100, height: 100)
            .overlay(
                Image(systemName: "cup.and.saucer.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.brandPink)
            )
    }
}

struct MenuBrowseView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            MenuBrowseView()
        }
    }
}
