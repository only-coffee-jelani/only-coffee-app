import Foundation
import CoreLocation

// MARK: - Event Type Enum
enum EventType: String, Codable {
    case appOpened = "app_opened"
    case appClosed = "app_closed"
    case purchaseCompleted = "purchase_completed"
    case cartAbandoned = "cart_abandoned"
    case menuViewed = "menu_viewed"
    case itemViewed = "item_viewed"
    case searchPerformed = "search_performed"
    case filterApplied = "filter_applied"
    case notificationOpened = "notification_opened"
    case notificationDismissed = "notification_dismissed"
    case promotionViewed = "promotion_viewed"
    case promotionClicked = "promotion_clicked"
    case promotionRedeemed = "promotion_redeemed"
    case locationEntered = "location_entered"
    case locationExited = "location_exited"
    case geofenceTriggered = "geofence_triggered"
    case profileUpdated = "profile_updated"
    case preferenceChanged = "preference_changed"
    case loyaltyChecked = "loyalty_checked"
    case rewardViewed = "reward_viewed"
}

// MARK: - Track Event Request
struct TrackEventRequest: Codable {
    let eventType: EventType
    let metadata: [String: AnyCodable]?
    let sessionId: String?
    let deviceType: String?
    let appVersion: String?
    let latitude: Double?
    let longitude: Double?
    let storeId: String?
}

// MARK: - Track Event Response
struct TrackEventResponse: Codable {
    let success: Bool
    let event: EventData?

    struct EventData: Codable {
        let id: String
        let type: EventType
        let timestamp: Date
    }
}

// MARK: - Batch Track Events Response
struct BatchTrackEventResponse: Codable {
    let success: Bool
    let count: Int
    let events: [EventData]

    struct EventData: Codable {
        let id: String
        let type: EventType
        let timestamp: Date
    }
}
