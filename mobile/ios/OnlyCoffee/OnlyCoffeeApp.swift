import SwiftUI

@main
struct OnlyCoffeeApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @StateObject private var authManager = AuthenticationManager.shared
    @StateObject private var cartManager = CartManager.shared
    @StateObject private var pushNotificationManager = PushNotificationManager.shared
    @StateObject private var geofencingManager = GeofencingManager.shared
    @StateObject private var privacyManager = PrivacyManager.shared

    var body: some Scene {
        WindowGroup { 
            ContentView()
                .environmentObject(authManager)
                .environmentObject(cartManager)
                .environmentObject(pushNotificationManager)
                .environmentObject(geofencingManager)
                .environmentObject(privacyManager)
                .task {
                    // Request ATT permission after app launch (iOS 14.5+)
                    if #available(iOS 14.5, *) {
                        // Delay to show permission after user sees app content
                        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
                        await privacyManager.requestTrackingAuthorization()
                    }
                }
        }
    }
}

