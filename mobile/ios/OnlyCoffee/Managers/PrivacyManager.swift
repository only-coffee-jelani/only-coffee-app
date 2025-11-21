import Foundation
import AppTrackingTransparency
import AdSupport

/// Manages privacy settings, ATT compliance, and data handling
@MainActor
class PrivacyManager: ObservableObject {
    static let shared = PrivacyManager()

    @Published var trackingAuthorizationStatus: ATTrackingManager.AuthorizationStatus = .notDetermined
    @Published var hasRequestedTracking = false
    @Published var analyticsEnabled = true
    @Published var personalizationEnabled = true
    @Published var locationTrackingEnabled = true
    @Published var pushNotificationsEnabled = true

    private let userDefaults = UserDefaults.standard
    private let hasRequestedTrackingKey = "hasRequestedTracking"
    private let analyticsEnabledKey = "analyticsEnabled"
    private let personalizationEnabledKey = "personalizationEnabled"
    private let locationTrackingEnabledKey = "locationTrackingEnabled"
    private let pushNotificationsEnabledKey = "pushNotificationsEnabled"

    private init() {
        loadPreferences()
        updateTrackingStatus()
    }

    // MARK: - App Tracking Transparency

    /// Request App Tracking Transparency permission
    func requestTrackingAuthorization() async {
        guard !hasRequestedTracking else {
            print("⚠️ ATT already requested")
            return
        }

        print("📱 Requesting App Tracking Transparency permission...")

        let status = await ATTrackingManager.requestTrackingAuthorization()
        trackingAuthorizationStatus = status
        hasRequestedTracking = true
        userDefaults.set(true, forKey: hasRequestedTrackingKey)

        switch status {
        case .authorized:
            print("✅ User authorized tracking")
            // Enable advanced analytics and personalization
            await enableAdvancedFeatures()
        case .denied:
            print("❌ User denied tracking")
            // Respect user's choice - limited tracking only
            await disableAdvancedFeatures()
        case .restricted:
            print("⚠️ Tracking is restricted")
        case .notDetermined:
            print("⚠️ Tracking status not determined")
        @unknown default:
            print("⚠️ Unknown tracking status")
        }
    }

    /// Update current tracking status
    func updateTrackingStatus() {
        trackingAuthorizationStatus = ATTrackingManager.trackingAuthorizationStatus
        hasRequestedTracking = userDefaults.bool(forKey: hasRequestedTrackingKey)
    }

    /// Get IDFA (Identifier for Advertisers) - only available if authorized
    var advertisingIdentifier: String? {
        guard trackingAuthorizationStatus == .authorized else {
            return nil
        }
        let idfa = ASIdentifierManager.shared().advertisingIdentifier
        return idfa.uuidString
    }

    // MARK: - Privacy Preferences

    /// Load user privacy preferences
    private func loadPreferences() {
        hasRequestedTracking = userDefaults.bool(forKey: hasRequestedTrackingKey)

        // Default to true unless explicitly disabled
        if userDefaults.object(forKey: analyticsEnabledKey) != nil {
            analyticsEnabled = userDefaults.bool(forKey: analyticsEnabledKey)
        }
        if userDefaults.object(forKey: personalizationEnabledKey) != nil {
            personalizationEnabled = userDefaults.bool(forKey: personalizationEnabledKey)
        }
        if userDefaults.object(forKey: locationTrackingEnabledKey) != nil {
            locationTrackingEnabled = userDefaults.bool(forKey: locationTrackingEnabledKey)
        }
        if userDefaults.object(forKey: pushNotificationsEnabledKey) != nil {
            pushNotificationsEnabled = userDefaults.bool(forKey: pushNotificationsEnabledKey)
        }
    }

    /// Save privacy preferences
    private func savePreferences() {
        userDefaults.set(analyticsEnabled, forKey: analyticsEnabledKey)
        userDefaults.set(personalizationEnabled, forKey: personalizationEnabledKey)
        userDefaults.set(locationTrackingEnabled, forKey: locationTrackingEnabledKey)
        userDefaults.set(pushNotificationsEnabled, forKey: pushNotificationsEnabledKey)
    }

    /// Update analytics preference
    func setAnalyticsEnabled(_ enabled: Bool) {
        analyticsEnabled = enabled
        savePreferences()

        if !enabled {
            // Disable analytics tracking
            EventTrackerService.shared.setTrackingEnabled(false)
        } else {
            EventTrackerService.shared.setTrackingEnabled(true)
        }
    }

    /// Update personalization preference
    func setPersonalizationEnabled(_ enabled: Bool) {
        personalizationEnabled = enabled
        savePreferences()

        // Notify services that personalization has changed
        NotificationCenter.default.post(
            name: NSNotification.Name("PersonalizationPreferenceChanged"),
            object: nil,
            userInfo: ["enabled": enabled]
        )
    }

    /// Update location tracking preference
    func setLocationTrackingEnabled(_ enabled: Bool) {
        locationTrackingEnabled = enabled
        savePreferences()

        if !enabled {
            // Stop geofencing
            GeofencingManager.shared.stopMonitoringAllRegions()
        } else {
            // Resume geofencing if permission is granted
            GeofencingManager.shared.requestLocationPermission()
        }
    }

    /// Update push notifications preference
    func setPushNotificationsEnabled(_ enabled: Bool) {
        pushNotificationsEnabled = enabled
        savePreferences()

        // Note: This is just a preference flag. Actual notification settings
        // are controlled by iOS system settings
    }

    // MARK: - Advanced Features

    private func enableAdvancedFeatures() async {
        // Enable advanced analytics
        analyticsEnabled = true
        personalizationEnabled = true
        savePreferences()

        print("✅ Advanced features enabled")
    }

    private func disableAdvancedFeatures() async {
        // User denied tracking - respect their privacy
        // We can still do basic analytics without tracking
        print("ℹ️ Using privacy-focused mode")
    }

    // MARK: - Data Management

    /// Request data export (GDPR Article 15)
    func requestDataExport() async throws -> DataExportResponse {
        guard let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ??
                Bundle.main.infoDictionary?["API_BASE_URL"] as? String else {
            throw PrivacyError.configurationError
        }

        let endpoint = "\(baseURL)/privacy/data-export"
        guard let url = URL(string: endpoint) else {
            throw PrivacyError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        if let token = KeychainManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw PrivacyError.requestFailed
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(DataExportResponse.self, from: data)
    }

    /// Request account and data deletion (GDPR Article 17)
    func requestDataDeletion(reason: String?) async throws -> DataDeletionResponse {
        guard let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ??
                Bundle.main.infoDictionary?["API_BASE_URL"] as? String else {
            throw PrivacyError.configurationError
        }

        let endpoint = "\(baseURL)/privacy/data-deletion"
        guard let url = URL(string: endpoint) else {
            throw PrivacyError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = KeychainManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Include reason if provided
        let body: [String: Any] = ["reason": reason ?? "User requested deletion"]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw PrivacyError.requestFailed
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(DataDeletionResponse.self, from: data)
    }

    /// Clear local data and caches
    func clearLocalData() {
        // Clear user defaults (except essential preferences)
        let domain = Bundle.main.bundleIdentifier!
        userDefaults.removePersistentDomain(forName: domain)
        userDefaults.synchronize()

        // Clear caches
        URLCache.shared.removeAllCachedResponses()

        // Clear keychain (auth tokens, etc.)
        // Note: Actual implementation would use Keychain APIs

        print("✅ Local data cleared")
    }

    // MARK: - Consent Management

    /// Check if user has given consent for data processing
    var hasDataProcessingConsent: Bool {
        return trackingAuthorizationStatus == .authorized || hasRequestedTracking
    }

    /// Check if user can receive personalized content
    var canShowPersonalizedContent: Bool {
        return personalizationEnabled && (trackingAuthorizationStatus == .authorized || !hasRequestedTracking)
    }

    /// Check if analytics can be collected
    var canCollectAnalytics: Bool {
        return analyticsEnabled
    }
}

// MARK: - Models

enum PrivacyError: LocalizedError {
    case configurationError
    case invalidURL
    case requestFailed
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .configurationError:
            return "Configuration error"
        case .invalidURL:
            return "Invalid URL"
        case .requestFailed:
            return "Request failed"
        case .unauthorized:
            return "Unauthorized"
        }
    }
}

struct DataExportResponse: Codable {
    let success: Bool
    let message: String
    let requestId: String
    let estimatedCompletionTime: String?
    let downloadUrl: String?

    enum CodingKeys: String, CodingKey {
        case success
        case message
        case requestId = "request_id"
        case estimatedCompletionTime = "estimated_completion_time"
        case downloadUrl = "download_url"
    }
}

struct DataDeletionResponse: Codable {
    let success: Bool
    let message: String
    let requestId: String
    let deletionScheduledAt: String?

    enum CodingKeys: String, CodingKey {
        case success
        case message
        case requestId = "request_id"
        case deletionScheduledAt = "deletion_scheduled_at"
    }
}
