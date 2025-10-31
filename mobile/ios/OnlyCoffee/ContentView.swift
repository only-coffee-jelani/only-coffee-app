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
        print("📱 Fetching splash screen...")
        do {
            let promotion: Promotion = try await APIClient.shared.request(
                endpoint: "/splash-screen/current",
                requiresAuth: false
            )

            print("✅ Splash screen fetched: \(promotion.title)")
            print("🖼️ Image URL: \(promotion.imageUrl)")

            await MainActor.run {
                self.launchPromotion = promotion
                print("🎯 Modal should now be visible")
            }
        } catch let error as APIError {
            if case .decodingError = error {
                // Empty response = no active splash screen (expired or not configured)
                print("ℹ️ No active splash screen available")
            } else {
                print("❌ Failed to fetch splash screen: \(error.localizedDescription)")
            }
            // Silently fail - no splash screen to show
        } catch {
            print("❌ Failed to fetch splash screen: \(error.localizedDescription)")
            // Silently fail - no splash screen to show
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
