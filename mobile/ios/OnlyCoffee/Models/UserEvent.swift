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

// MARK: - AnyCodable Helper
// Helper to encode arbitrary JSON values
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode AnyCodable")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            let context = EncodingError.Context(codingPath: container.codingPath, debugDescription: "Cannot encode value")
            throw EncodingError.invalidValue(value, context)
        }
    }
}
