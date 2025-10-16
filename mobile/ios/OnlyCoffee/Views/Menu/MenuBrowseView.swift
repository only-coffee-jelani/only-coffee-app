import SwiftUI

struct MenuBrowseView: View {
    @State private var selectedCategory: String = "Hot Coffee"
    @State private var selectedStore: Store? = nil
    @State private var showingLocationPicker = false
    @State private var searchText: String = ""

    let categories = [
        "Hot Coffee",
        "Iced Coffee",
        "Specialty Drinks",
        "Add-Ons"
    ]

    let menuItems: [String: [MenuItemData]] = [
        "Hot Coffee": [
            MenuItemData(
                name: "Espresso",
                description: "Rich, bold shot of pure coffee perfection",
                price: 4.50,
                calories: 5,
                imageName: "espresso"
            ),
            MenuItemData(
                name: "Doppio",
                description: "Double shot of espresso for the true coffee lover",
                price: 5.50,
                calories: 10,
                imageName: "doppio"
            ),
            MenuItemData(
                name: "Americano",
                description: "Espresso with hot water, bold and smooth",
                price: 4.50,
                calories: 10,
                imageName: "americano"
            ),
            MenuItemData(
                name: "Cappuccino",
                description: "Equal parts espresso, steamed milk, and foam",
                price: 5.50,
                calories: 120,
                imageName: "cappuccino"
            ),
            MenuItemData(
                name: "Latte",
                description: "Espresso with steamed milk, creamy and smooth",
                price: 6.00,
                calories: 190,
                imageName: "latte"
            ),
            MenuItemData(
                name: "Flat White",
                description: "Microfoam perfection with a double shot of espresso",
                price: 6.00,
                calories: 170,
                imageName: "flatwhite"
            ),
            MenuItemData(
                name: "Macchiato",
                description: "Espresso marked with a dollop of foam",
                price: 5.00,
                calories: 15,
                imageName: "macchiato"
            ),
            MenuItemData(
                name: "Cortado",
                description: "Equal parts espresso and steamed milk",
                price: 5.50,
                calories: 90,
                imageName: "cortado"
            ),
            MenuItemData(
                name: "Mocha",
                description: "Espresso, steamed milk, and rich chocolate",
                price: 6.50,
                calories: 290,
                imageName: "mocha"
            ),
            MenuItemData(
                name: "Waffolino",
                description: "Our signature espresso served in a crispy waffle cone",
                price: 8.50,
                calories: 350,
                imageName: "waffolino",
                isSignature: true
            )
        ],
        "Iced Coffee": [
            MenuItemData(
                name: "Iced Espresso",
                description: "Bold espresso over ice",
                price: 4.50,
                calories: 5,
                imageName: "iced-espresso"
            ),
            MenuItemData(
                name: "Iced Americano",
                description: "Espresso and water over ice",
                price: 4.50,
                calories: 10,
                imageName: "iced-americano"
            ),
            MenuItemData(
                name: "Iced Latte",
                description: "Espresso and cold milk over ice",
                price: 6.00,
                calories: 190,
                imageName: "iced-latte"
            ),
            MenuItemData(
                name: "Iced Cappuccino",
                description: "Espresso, cold milk, and foam over ice",
                price: 5.50,
                calories: 120,
                imageName: "iced-cappuccino"
            ),
            MenuItemData(
                name: "Iced Mocha",
                description: "Espresso, milk, chocolate, and ice",
                price: 6.50,
                calories: 290,
                imageName: "iced-mocha"
            ),
            MenuItemData(
                name: "Cold Brew",
                description: "Smooth, slow-steeped coffee",
                price: 5.00,
                calories: 5,
                imageName: "cold-brew"
            ),
            MenuItemData(
                name: "Nitro Cold Brew",
                description: "Cold brew infused with nitrogen for a creamy texture",
                price: 6.00,
                calories: 5,
                imageName: "nitro-cold-brew"
            )
        ],
        "Specialty Drinks": [
            MenuItemData(
                name: "Affogato",
                description: "Espresso poured over vanilla gelato",
                price: 7.50,
                calories: 250,
                imageName: "affogato"
            ),
            MenuItemData(
                name: "Caramel Macchiato",
                description: "Vanilla, steamed milk, espresso, and caramel drizzle",
                price: 6.50,
                calories: 250,
                imageName: "caramel-macchiato"
            ),
            MenuItemData(
                name: "Vanilla Latte",
                description: "Latte with vanilla syrup",
                price: 6.50,
                calories: 250,
                imageName: "vanilla-latte"
            ),
            MenuItemData(
                name: "Hazelnut Latte",
                description: "Latte with hazelnut syrup",
                price: 6.50,
                calories: 250,
                imageName: "hazelnut-latte"
            )
        ],
        "Add-Ons": [
            MenuItemData(
                name: "Extra Shot",
                description: "Add an extra shot of espresso",
                price: 1.00,
                calories: 5,
                imageName: "extra-shot"
            ),
            MenuItemData(
                name: "Flavor Shot",
                description: "Vanilla, caramel, hazelnut, or mocha",
                price: 0.75,
                calories: 80,
                imageName: "flavor-shot"
            ),
            MenuItemData(
                name: "Oat Milk",
                description: "Substitute with oat milk",
                price: 1.00,
                calories: 120,
                imageName: "oat-milk"
            ),
            MenuItemData(
                name: "Almond Milk",
                description: "Substitute with almond milk",
                price: 1.00,
                calories: 60,
                imageName: "almond-milk"
            ),
            MenuItemData(
                name: "Whipped Cream",
                description: "Top with whipped cream",
                price: 0.50,
                calories: 50,
                imageName: "whipped-cream"
            )
        ]
    ]

    // Filtered menu items based on search
    var filteredMenuItems: [MenuItemData] {
        let items = menuItems[selectedCategory] ?? []
        if searchText.isEmpty {
            return items
        }
        return items.filter { item in
            item.name.localizedCaseInsensitiveContains(searchText) ||
            item.description.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Location Selector
            Button(action: {
                showingLocationPicker = true
            }) {
                HStack {
                    Image(systemName: "mappin.and.ellipse")
                        .foregroundColor(.brandPink)

                    if let store = selectedStore {
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
                        Text("Select a location to view menu")
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
                StoresView()
            }

            Divider()

            // Search Bar (matching Android)
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

            // Category selector
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(categories, id: \.self) { category in
                        Button(action: {
                            selectedCategory = category
                        }) {
                            Text(category)
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
                    ForEach(filteredMenuItems, id: \.name) { item in
                        MenuItemCard(item: item)
                    }

                    // Empty state when no items found
                    if filteredMenuItems.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)

                            Text(searchText.isEmpty ? "No items available" : "No items found")
                                .font(.headline)
                                .foregroundColor(.primary)

                            Text(searchText.isEmpty ? "Check back later" : "Try a different search")
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
    let item: MenuItemData

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Image placeholder
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.brandLight.opacity(0.3))
                    .frame(width: 100, height: 100)

                Image(systemName: "cup.and.saucer.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.brandPink)

                if item.isSignature {
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

                    if item.isSignature {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                            .font(.caption)
                    }
                }

                Text(item.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                HStack(spacing: 12) {
                    Text(String(format: "$%.2f", item.price))
                        .font(.headline)
                        .foregroundColor(.brandPink)

                    if let calories = item.calories {
                        Text("\(calories) cal")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top, 4)

                Button(action: {
                    // Add to cart action
                }) {
                    Text("Add to Order")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.brandPink)
                        .cornerRadius(8)
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
}

struct MenuItemData {
    let name: String
    let description: String
    let price: Double
    let calories: Int?
    let imageName: String
    var isSignature: Bool = false
}

struct MenuBrowseView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            MenuBrowseView()
        }
    }
}
