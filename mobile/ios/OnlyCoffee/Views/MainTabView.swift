import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var cartManager: CartManager
    @State private var selectedTab = 0  // Start on Home tab

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Logo header with profile button - Fixed at top
                BrandHeader()

                // Tab content below header
                TabView(selection: $selectedTab) {
                    // Home
                    HomeView()
                        .tabItem {
                            Label("Home", systemImage: "house.fill")
                        }
                        .tag(0)

                    // Menu
                    MenuBrowseView()
                        .tabItem {
                            Label("Menu", systemImage: "cup.and.saucer.fill")
                        }
                        .tag(1)

                    // Rewards
                    RewardsView()
                        .tabItem {
                            Label("Rewards", systemImage: "star.fill")
                        }
                        .tag(2)

                    // Orders
                    OrdersView()
                        .tabItem {
                            Label("Orders", systemImage: "list.bullet.clipboard")
                        }
                        .tag(3)

                    // Locations
                    StoresView()
                        .tabItem {
                            Label("Locations", systemImage: "map")
                        }
                        .tag(4)
                }
                .accentColor(.brandPink)
            }
            .ignoresSafeArea(edges: .top)
            .overlay(alignment: .topTrailing) {
                // Cart badge
                if cartManager.itemCount > 0 {
                    CartBadge(count: cartManager.itemCount)
                        .padding(.trailing, 60)
                        .padding(.top, 8)
                }
            }
        }
        .navigationViewStyle(.stack)
    }
}

struct CartBadge: View {
    let count: Int

    var body: some View {
        NavigationLink(destination: CartView()) {
            ZStack {
                Circle()
                    .fill(Color.brandPink)
                    .frame(width: 50, height: 50)

                Image(systemName: "cart.fill")
                    .foregroundColor(.white)
                    .font(.system(size: 20))

                if count > 0 {
                    Text("\(count)")
                        .font(.caption2.bold())
                        .foregroundColor(.white)
                        .padding(5)
                        .background(Color.red)
                        .clipShape(Circle())
                        .offset(x: 15, y: -15)
                }
            }
        }
    }
}

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
            .environmentObject(AuthenticationManager.shared)
            .environmentObject(CartManager.shared)
    }
}
