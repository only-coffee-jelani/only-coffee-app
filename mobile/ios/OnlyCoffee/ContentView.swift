import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var launchPromotion: Promotion?
    @State private var hasCheckedForPromotion = false

    var body: some View {
        // Always show main app - login is optional until user needs to checkout
        MainTabView()
            .fullScreenCover(item: $launchPromotion) { promotion in
                LaunchModalView(
                    promotion: promotion,
                    onDismiss: {
                        launchPromotion = nil
                    },
                    onNavigateToMenuItem: { menuItemId in
                        launchPromotion = nil
                        // TODO: Navigate to menu item
                        print("Navigate to menu item: \(menuItemId)")
                    }
                )
            }
            .task {
                if !hasCheckedForPromotion {
                    hasCheckedForPromotion = true
                    await fetchLaunchPromotion()
                }
            }
    }

    private func fetchLaunchPromotion() async {
        print("📱 Fetching launch promotion...")
        do {
            let promotion: Promotion = try await APIClient.shared.request(
                endpoint: Endpoint.getActiveLaunchModal.path,
                requiresAuth: false
            )

            print("✅ Promotion fetched: \(promotion.title)")
            print("🖼️ Image URL: \(promotion.imageUrl)")

            await MainActor.run {
                self.launchPromotion = promotion
                print("🎯 Modal should now be visible")
            }
        } catch {
            print("❌ Failed to fetch launch promotion: \(error)")
            // Silently fail - no promotion to show
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AuthenticationManager.shared)
            .environmentObject(CartManager.shared)
    }
}
