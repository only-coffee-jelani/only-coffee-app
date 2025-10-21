import Foundation
import UserNotifications
import UIKit

@MainActor
class PushNotificationManager: NSObject, ObservableObject {
    static let shared = PushNotificationManager()

    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published var deviceToken: String?

    private let notificationCenter = UNUserNotificationCenter.current()

    private override init() {
        super.init()
        notificationCenter.delegate = self
        checkAuthorizationStatus()
    }

    /// Check current notification authorization status
    func checkAuthorizationStatus() {
        Task {
            let settings = await notificationCenter.notificationSettings()
            authorizationStatus = settings.authorizationStatus
        }
    }

    /// Request permission for push notifications
    func requestAuthorization() async -> Bool {
        do {
            let granted = try await notificationCenter.requestAuthorization(options: [.alert, .badge, .sound])
            await MainActor.run {
                authorizationStatus = granted ? .authorized : .denied
            }

            if granted {
                await registerForPushNotifications()
            }

            return granted
        } catch {
            print("Error requesting notification authorization: \(error)")
            return false
        }
    }

    /// Register for remote push notifications
    func registerForPushNotifications() async {
        await UIApplication.shared.registerForRemoteNotifications()
    }

    /// Handle successful device token registration
    func didRegisterForRemoteNotifications(deviceToken: Data) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = tokenString

        print("📱 Device Token: \(tokenString)")

        // TODO: Send device token to backend
        Task {
            await sendDeviceTokenToBackend(tokenString)
        }
    }

    /// Handle device token registration failure
    func didFailToRegisterForRemoteNotifications(error: Error) {
        print("❌ Failed to register for remote notifications: \(error)")
    }

    /// Send device token to backend
    private func sendDeviceTokenToBackend(_ token: String) async {
        do {
            let request = RegisterDeviceTokenRequest(
                deviceToken: token,
                platform: "ios"
            )

            let _: EmptyResponse = try await APIClient.shared.request(
                endpoint: "/api/v1/notifications/register-device",
                method: .post,
                body: request,
                requiresAuth: true
            )

            print("✅ Device token registered with backend successfully")
        } catch {
            print("❌ Failed to register device token with backend: \(error)")
        }
    }

    /// Schedule a local notification (for testing or fallback)
    func scheduleLocalNotification(
        title: String,
        body: String,
        timeInterval: TimeInterval = 5,
        identifier: String = UUID().uuidString
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: timeInterval, repeats: false)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)

        notificationCenter.add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            } else {
                print("✅ Scheduled notification: \(title)")
            }
        }
    }

    /// Remove all pending notifications
    func removeAllPendingNotifications() {
        notificationCenter.removeAllPendingNotificationRequests()
    }

    /// Remove all delivered notifications
    func removeAllDeliveredNotifications() {
        notificationCenter.removeAllDeliveredNotifications()
    }

    /// Badge count management
    func setBadgeCount(_ count: Int) {
        Task {
            try? await UIApplication.shared.setAlternateIconName(nil)
            await MainActor.run {
                UIApplication.shared.applicationIconBadgeNumber = count
            }
        }
    }

    func clearBadge() {
        setBadgeCount(0)
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension PushNotificationManager: UNUserNotificationCenterDelegate {
    /// Handle notification when app is in foreground
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        print("📬 Received notification in foreground: \(notification.request.content.title)")

        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    /// Handle notification tap
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        print("👆 User tapped notification: \(userInfo)")

        // Handle deep linking based on notification data
        Task { @MainActor in
            await handleNotificationTap(userInfo: userInfo)
        }

        completionHandler()
    }

    /// Handle notification tap and deep link
    @MainActor
    private func handleNotificationTap(userInfo: [AnyHashable: Any]) {
        // Extract notification type and data
        if let notificationType = userInfo["type"] as? String {
            switch notificationType {
            case "coupon_expiring":
                // Navigate to My Coupons
                if let couponId = userInfo["couponId"] as? String {
                    print("Navigate to coupon: \(couponId)")
                    // TODO: Deep link to specific coupon
                    NotificationCenter.default.post(
                        name: .navigateToCoupon,
                        object: nil,
                        userInfo: ["couponId": couponId]
                    )
                }

            case "coupon_granted":
                // Navigate to My Coupons
                print("Navigate to My Coupons - new coupon granted")
                NotificationCenter.default.post(name: .navigateToCoupons, object: nil)

            case "order_status":
                // Navigate to Orders
                if let orderId = userInfo["orderId"] as? String {
                    print("Navigate to order: \(orderId)")
                    NotificationCenter.default.post(
                        name: .navigateToOrder,
                        object: nil,
                        userInfo: ["orderId": orderId]
                    )
                }

            default:
                print("Unknown notification type: \(notificationType)")
            }
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let navigateToCoupon = Notification.Name("navigateToCoupon")
    static let navigateToCoupons = Notification.Name("navigateToCoupons")
    static let navigateToOrder = Notification.Name("navigateToOrder")
}

// MARK: - Request Models
struct RegisterDeviceTokenRequest: Codable {
    let deviceToken: String
    let platform: String
}

struct EmptyResponse: Codable {
    let success: Bool
    let message: String?
}
