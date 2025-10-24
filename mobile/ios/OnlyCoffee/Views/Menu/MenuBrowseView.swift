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
                // Default to best_sellers if available, otherwise use first category
                selectedCategory = viewModel.categories.contains("best_sellers") ? "best_sellers" : (viewModel.categories.first ?? "")
                viewModel.filterItems(by: nil, category: selectedCategory, searchText: "")
            }
        }
        .onChange(of: viewModel.isLoading) { isLoading in
            // Show store prompt after menu data loads successfully
            if !isLoading && !viewModel.allMenuItems.isEmpty && viewModel.selectedStore == nil && !showStorePrompt {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    showStorePrompt = true
                }
            }
        }
        .sheet(isPresented: $showStorePrompt) {
            StoresView(onStoreSelected: { store in
                viewModel.setSelectedStore(store)
                viewModel.filterItems(by: store, category: selectedCategory, searchText: searchText)
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
                    viewModel.filterItems(by: store, category: selectedCategory, searchText: searchText)
                })
            }

            Divider()

            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search menu items", text: $searchText)
                    .textFieldStyle(.plain)
                    .onChange(of: searchText) { _ in
                        viewModel.filterItems(by: viewModel.selectedStore, category: selectedCategory, searchText: searchText)
                    }

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

            // Category selector
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(viewModel.categories, id: \.self) { category in
                        Button(action: {
                            selectedCategory = category
                            viewModel.filterItems(by: viewModel.selectedStore, category: category, searchText: searchText)
                        }) {
                            Text(MenuItem.getCategoryDisplayName(category))
                                .font(.subheadline)
                                .fontWeight(selectedCategory == category ? .bold : .regular)
                                .foregroundColor(selectedCategory == category ? .white : .brandPink)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(selectedCategory == category ? Color.brandPink : Color.brandLight.opacity(0.2))
                                .cornerRadius(20)
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 12)
            }
            .background(Color(.systemBackground))

            Divider()

            // Menu items
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.filteredItems, id: \.id) { item in
                        NavigationLink(destination: MenuItemDetailView(menuItem: item, selectedStore: viewModel.selectedStore)) {
                            MenuItemCard(item: item)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }

                    // Empty state when no items found
                    if viewModel.filteredItems.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)

                            Text(searchText.isEmpty ? "No items available" : "No items found")
                                .font(.headline)
                                .foregroundColor(.primary)

                            Text(searchText.isEmpty ? "Try selecting a different location or category" : "Try a different search")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 60)
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
        }
        .navigationTitle("Menu")
        .navigationBarTitleDisplayMode(.inline)
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
