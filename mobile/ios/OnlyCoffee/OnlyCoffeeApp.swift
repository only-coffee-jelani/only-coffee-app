import SwiftUI

@main
struct OnlyCoffeeApp: App {
    @StateObject private var authManager = AuthenticationManager.shared
    @StateObject private var cartManager = CartManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(cartManager)
        }
    }
}

