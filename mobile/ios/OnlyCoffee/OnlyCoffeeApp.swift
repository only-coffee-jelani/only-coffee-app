import SwiftUI

@main
struct OnlyCoffeeApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @StateObject private var authManager = AuthenticationManager.shared
    @StateObject private var cartManager = CartManager.shared
    @StateObject private var pushNotificationManager = PushNotificationManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(cartManager)
                .environmentObject(pushNotificationManager)
        }
    }
}

