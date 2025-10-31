import Foundation
import CoreLocation

class EventTrackerService {
    static let shared = EventTrackerService()

    private var isTrackingEnabled: Bool = true

    private init() {}

    // MARK: - Privacy Controls

    /// Enable or disable event tracking (for privacy preferences)
    func setTrackingEnabled(_ enabled: Bool) {
        isTrackingEnabled = enabled
        print(isTrackingEnabled ? "✅ Event tracking enabled" : "⚠️ Event tracking disabled")
    }

    // MARK: - Track Single Event

    /// Track a single user event
    /// - Parameters:
    ///   - eventType: The type of event to track
    ///   - metadata: Optional metadata dictionary
    ///   - sessionId: Optional session ID
    ///   - location: Optional location
    ///   - storeId: Optional store ID
    func trackEvent(
        _ eventType: EventType,
        metadata: [String: Any]? = nil,
        sessionId: String? = nil,
        location: CLLocation? = nil,
        storeId: String? = nil
    ) async throws -> TrackEventResponse {
        // Respect privacy preferences - skip tracking if disabled
        guard isTrackingEnabled else {
            print("⚠️ Event tracking disabled - skipping \(eventType.rawValue) event")
            // Return a mock response to avoid breaking callers
            return TrackEventResponse(success: false, eventId: nil, message: "Tracking disabled")
        }

        let request = TrackEventRequest(
            eventType: eventType,
            metadata: metadata?.mapValues { AnyCodable($0) },
            sessionId: sessionId ?? EventTrackerManager.shared.currentSessionId,
            deviceType: "iOS",
            appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
            latitude: location?.coordinate.latitude,
            longitude: location?.coordinate.longitude,
            storeId: storeId
        )

        return try await APIClient.shared.request(
            endpoint: "/events/track",
            method: .post,
            body: request,
            requiresAuth: true
        )
    }

    // MARK: - Track Batch Events

    /// Track multiple events in a batch
    /// - Parameter events: Array of event requests
    func trackEventsBatch(_ events: [TrackEventRequest]) async throws -> BatchTrackEventResponse {
        return try await APIClient.shared.request(
            endpoint: "/events/track/batch",
            method: .post,
            body: events,
            requiresAuth: true
        )
    }

    // MARK: - Convenience Methods

    /// Track app opened event
    func trackAppOpened() async {
        do {
            _ = try await trackEvent(.appOpened)
            print("✅ Tracked app_opened event")
        } catch {
            print("❌ Failed to track app_opened event: \(error.localizedDescription)")
        }
    }

    /// Track app closed event
    func trackAppClosed() async {
        do {
            _ = try await trackEvent(.appClosed)
            print("✅ Tracked app_closed event")
        } catch {
            print("❌ Failed to track app_closed event: \(error.localizedDescription)")
        }
    }

    /// Track purchase completed
    func trackPurchaseCompleted(orderId: String, totalAmount: Double, items: [[String: Any]]) async {
        do {
            _ = try await trackEvent(
                .purchaseCompleted,
                metadata: [
                    "orderId": orderId,
                    "totalAmount": totalAmount,
                    "items": items
                ]
            )
            print("✅ Tracked purchase_completed event for order \(orderId)")
        } catch {
            print("❌ Failed to track purchase_completed event: \(error.localizedDescription)")
        }
    }

    /// Track cart abandoned
    func trackCartAbandoned(items: [[String: Any]], totalValue: Double) async {
        do {
            _ = try await trackEvent(
                .cartAbandoned,
                metadata: [
                    "items": items,
                    "totalValue": totalValue
                ]
            )
            print("✅ Tracked cart_abandoned event")
        } catch {
            print("❌ Failed to track cart_abandoned event: \(error.localizedDescription)")
        }
    }

    /// Track menu viewed
    func trackMenuViewed(category: String? = nil) async {
        do {
            let metadata = category != nil ? ["category": category!] : nil
            _ = try await trackEvent(.menuViewed, metadata: metadata)
            print("✅ Tracked menu_viewed event")
        } catch {
            print("❌ Failed to track menu_viewed event: \(error.localizedDescription)")
        }
    }

    /// Track menu item viewed
    func trackItemViewed(itemId: String, itemName: String, category: String?, price: Double) async {
        do {
            var metadata: [String: Any] = [
                "itemId": itemId,
                "itemName": itemName,
                "price": price
            ]
            if let category = category {
                metadata["category"] = category
            }
            _ = try await trackEvent(.itemViewed, metadata: metadata)
            print("✅ Tracked item_viewed event for \(itemName)")
        } catch {
            print("❌ Failed to track item_viewed event: \(error.localizedDescription)")
        }
    }

    /// Track search performed
    func trackSearchPerformed(query: String, resultCount: Int) async {
        do {
            _ = try await trackEvent(
                .searchPerformed,
                metadata: [
                    "query": query,
                    "resultCount": resultCount
                ]
            )
            print("✅ Tracked search_performed event")
        } catch {
            print("❌ Failed to track search_performed event: \(error.localizedDescription)")
        }
    }

    /// Track promotion viewed
    func trackPromotionViewed(promotionId: String, promotionType: String) async {
        do {
            _ = try await trackEvent(
                .promotionViewed,
                metadata: [
                    "promotionId": promotionId,
                    "promotionType": promotionType
                ]
            )
            print("✅ Tracked promotion_viewed event")
        } catch {
            print("❌ Failed to track promotion_viewed event: \(error.localizedDescription)")
        }
    }

    /// Track promotion clicked
    func trackPromotionClicked(promotionId: String, promotionType: String) async {
        do {
            _ = try await trackEvent(
                .promotionClicked,
                metadata: [
                    "promotionId": promotionId,
                    "promotionType": promotionType
                ]
            )
            print("✅ Tracked promotion_clicked event")
        } catch {
            print("❌ Failed to track promotion_clicked event: \(error.localizedDescription)")
        }
    }

    /// Track notification opened
    func trackNotificationOpened(notificationId: String, promotionId: String?) async {
        do {
            var metadata: [String: Any] = ["notificationId": notificationId]
            if let promotionId = promotionId {
                metadata["promotionId"] = promotionId
            }
            _ = try await trackEvent(.notificationOpened, metadata: metadata)
            print("✅ Tracked notification_opened event")
        } catch {
            print("❌ Failed to track notification_opened event: \(error.localizedDescription)")
        }
    }

    /// Track location entered (geofence)
    func trackLocationEntered(storeId: String, location: CLLocation) async {
        do {
            _ = try await trackEvent(
                .locationEntered,
                metadata: ["storeName": ""], // Can be enriched with store name
                location: location,
                storeId: storeId
            )
            print("✅ Tracked location_entered event for store \(storeId)")
        } catch {
            print("❌ Failed to track location_entered event: \(error.localizedDescription)")
        }
    }

    /// Track location exited (geofence)
    func trackLocationExited(storeId: String, location: CLLocation) async {
        do {
            _ = try await trackEvent(
                .locationExited,
                metadata: ["storeName": ""], // Can be enriched with store name
                location: location,
                storeId: storeId
            )
            print("✅ Tracked location_exited event for store \(storeId)")
        } catch {
            print("❌ Failed to track location_exited event: \(error.localizedDescription)")
        }
    }

    /// Track loyalty checked
    func trackLoyaltyChecked() async {
        do {
            _ = try await trackEvent(.loyaltyChecked)
            print("✅ Tracked loyalty_checked event")
        } catch {
            print("❌ Failed to track loyalty_checked event: \(error.localizedDescription)")
        }
    }

    /// Track reward viewed
    func trackRewardViewed(rewardId: String, rewardType: String) async {
        do {
            _ = try await trackEvent(
                .rewardViewed,
                metadata: [
                    "rewardId": rewardId,
                    "rewardType": rewardType
                ]
            )
            print("✅ Tracked reward_viewed event")
        } catch {
            print("❌ Failed to track reward_viewed event: \(error.localizedDescription)")
        }
    }

    /// Track profile updated
    func trackProfileUpdated(fields: [String]) async {
        do {
            _ = try await trackEvent(
                .profileUpdated,
                metadata: ["fields": fields]
            )
            print("✅ Tracked profile_updated event")
        } catch {
            print("❌ Failed to track profile_updated event: \(error.localizedDescription)")
        }
    }
}
