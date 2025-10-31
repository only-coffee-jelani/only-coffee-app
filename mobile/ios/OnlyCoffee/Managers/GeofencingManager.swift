import Foundation
import CoreLocation
import UserNotifications

/// Manager for handling geofencing and location-based triggers
class GeofencingManager: NSObject, ObservableObject {
    static let shared = GeofencingManager()

    // MARK: - Properties

    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var monitoredRegions: Set<CLCircularRegion> = []
    @Published var isGeofencingEnabled: Bool = false

    private let locationManager = CLLocationManager()
    private let userDefaults = UserDefaults.standard
    private let geofencingEnabledKey = "GeofencingEnabled"
    private let monitoredStoresKey = "MonitoredStoreIds"

    // Constants
    private let defaultGeofenceRadius: CLLocationDistance = 200 // 200 meters (~0.12 miles)
    private let maxMonitoredRegions = 20 // iOS limit is 20 regions

    // Event tracking
    private var lastEntryEvents: [String: Date] = [:] // storeId -> timestamp
    private let minEventInterval: TimeInterval = 300 // 5 minutes between events for same store

    // MARK: - Initialization

    override private init() {
        super.init()

        locationManager.delegate = self
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.desiredAccuracy = kCLLocationAccuracyBest

        // Restore geofencing state
        isGeofencingEnabled = userDefaults.bool(forKey: geofencingEnabledKey)
        authorizationStatus = locationManager.authorizationStatus

        // Restore monitored regions
        restoreMonitoredRegions()

        print("📍 GeofencingManager initialized - Status: \(authorizationStatus.description)")
    }

    // MARK: - Public Methods

    /// Request location permissions
    func requestLocationPermission() {
        let status = locationManager.authorizationStatus

        switch status {
        case .notDetermined:
            // First time - request always authorization (required for geofencing)
            locationManager.requestAlwaysAuthorization()
        case .authorizedWhenInUse:
            // Upgrade to always authorization
            locationManager.requestAlwaysAuthorization()
        case .denied, .restricted:
            print("⚠️ Location permission denied/restricted")
            // Show alert to user to enable in settings
            postLocationPermissionDeniedNotification()
        case .authorizedAlways:
            print("✅ Location permission: Always authorized")
            enableGeofencing()
        @unknown default:
            break
        }
    }

    /// Enable geofencing
    func enableGeofencing() {
        guard locationManager.authorizationStatus == .authorizedAlways else {
            print("⚠️ Cannot enable geofencing without always authorization")
            requestLocationPermission()
            return
        }

        isGeofencingEnabled = true
        userDefaults.set(true, forKey: geofencingEnabledKey)

        // Start monitoring
        locationManager.startUpdatingLocation()

        print("✅ Geofencing enabled")
    }

    /// Disable geofencing
    func disableGeofencing() {
        isGeofencingEnabled = false
        userDefaults.set(false, forKey: geofencingEnabledKey)

        // Stop monitoring all regions
        stopMonitoringAllRegions()
        locationManager.stopUpdatingLocation()

        print("🛑 Geofencing disabled")
    }

    /// Setup geofences for stores
    func setupGeofences(for stores: [Store]) {
        guard isGeofencingEnabled else {
            print("⚠️ Geofencing not enabled")
            return
        }

        // Stop monitoring existing regions
        stopMonitoringAllRegions()

        // Sort stores by distance if we have current location
        var sortedStores = stores.filter { $0.isActive }

        if let currentLocation = locationManager.location {
            sortedStores = sortedStores.sorted { store1, store2 in
                let distance1 = currentLocation.distance(from: CLLocation(
                    latitude: store1.latitude,
                    longitude: store1.longitude
                ))
                let distance2 = currentLocation.distance(from: CLLocation(
                    latitude: store2.latitude,
                    longitude: store2.longitude
                ))
                return distance1 < distance2
            }
        }

        // Monitor up to maxMonitoredRegions nearest stores
        let storesToMonitor = Array(sortedStores.prefix(maxMonitoredRegions))

        for store in storesToMonitor {
            startMonitoring(store: store)
        }

        // Save monitored store IDs
        let monitoredStoreIds = storesToMonitor.map { $0.id }
        userDefaults.set(monitoredStoreIds, forKey: monitoredStoresKey)

        print("📍 Setup geofences for \(storesToMonitor.count) stores")
    }

    /// Start monitoring a specific store
    private func startMonitoring(store: Store) {
        let coordinate = CLLocationCoordinate2D(
            latitude: store.latitude,
            longitude: store.longitude
        )

        // Create circular region
        let region = CLCircularRegion(
            center: coordinate,
            radius: defaultGeofenceRadius,
            identifier: store.id
        )

        // Configure region
        region.notifyOnEntry = true
        region.notifyOnExit = true

        // Start monitoring
        locationManager.startMonitoring(for: region)
        monitoredRegions.insert(region)

        print("📍 Started monitoring geofence for: \(store.name) (radius: \(defaultGeofenceRadius)m)")
    }

    /// Stop monitoring all regions
    private func stopMonitoringAllRegions() {
        for region in locationManager.monitoredRegions {
            locationManager.stopMonitoring(for: region)
        }
        monitoredRegions.removeAll()
        print("🛑 Stopped monitoring all geofences")
    }

    /// Restore monitored regions from UserDefaults
    private func restoreMonitoredRegions() {
        guard isGeofencingEnabled else { return }

        // Note: Regions are automatically restored by iOS
        // We just update our local state
        for region in locationManager.monitoredRegions {
            if let circularRegion = region as? CLCircularRegion {
                monitoredRegions.insert(circularRegion)
            }
        }

        print("📍 Restored \(monitoredRegions.count) monitored regions")
    }

    // MARK: - Event Handling

    /// Handle geofence entry
    private func handleGeofenceEntry(storeId: String) {
        // Check if we've already fired an event recently for this store
        if let lastEntry = lastEntryEvents[storeId],
           Date().timeIntervalSince(lastEntry) < minEventInterval {
            print("⏭️ Skipping duplicate entry event for store \(storeId)")
            return
        }

        print("📍 Entered geofence for store: \(storeId)")

        // Update last entry time
        lastEntryEvents[storeId] = Date()

        // Track event
        Task {
            if let location = locationManager.location {
                await EventTrackerService.shared.trackLocationEntered(storeId: storeId, location: location)
            }
        }

        // Evaluate triggers on backend
        Task {
            await evaluateTriggers(storeId: storeId, eventType: "geofence_entry")
        }

        // Request notification permission if needed
        requestNotificationPermission()
    }

    /// Handle geofence exit
    private func handleGeofenceExit(storeId: String) {
        print("📍 Exited geofence for store: \(storeId)")

        // Track event
        Task {
            if let location = locationManager.location {
                await EventTrackerService.shared.trackLocationExited(storeId: storeId, location: location)
            }
        }
    }

    /// Evaluate triggers on backend
    private func evaluateTriggers(storeId: String, eventType: String) async {
        guard let userId = AuthenticationManager.shared.currentUser?.id else {
            print("⚠️ No authenticated user for trigger evaluation")
            return
        }

        do {
            // Call backend API to evaluate triggers
            guard let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? Bundle.main.infoDictionary?["API_BASE_URL"] as? String else {
                print("⚠️ API_BASE_URL not configured")
                return
            }
            let endpoint = "\(baseURL)/triggers/evaluate"
            guard let url = URL(string: endpoint) else {
                print("⚠️ Invalid URL: \(endpoint)")
                return
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            // Add auth token
            if let token = AuthenticationManager.shared.authToken {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            // Body with context
            let context: [String: Any] = [
                "eventType": eventType,
                "storeId": storeId,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]
            request.httpBody = try? JSONSerialization.data(withJSONObject: context)

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
            }

            if httpResponse.statusCode == 200 {
                // Parse trigger results
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let results = json["results"] as? [[String: Any]] {
                    print("✅ Evaluated \(results.count) triggers")

                    // Check for triggered promotions
                    for result in results {
                        if let triggered = result["triggered"] as? Bool,
                           triggered,
                           let promotionId = result["promotionId"] as? String {
                            // Show notification for triggered promotion
                            await showPromotionNotification(promotionId: promotionId)
                        }
                    }
                }
            } else {
                print("⚠️ Trigger evaluation failed: \(httpResponse.statusCode)")
            }
        } catch {
            print("❌ Error evaluating triggers: \(error.localizedDescription)")
        }
    }

    /// Show local notification for triggered promotion
    private func showPromotionNotification(promotionId: String) async {
        let content = UNMutableNotificationContent()
        content.title = "Special Offer Nearby!"
        content.body = "You're near a store - tap to see your personalized offer!"
        content.sound = .default
        content.userInfo = ["promotionId": promotionId, "type": "geofence_promotion"]

        // Immediate delivery
        let request = UNNotificationRequest(
            identifier: "geofence_\(promotionId)_\(UUID().uuidString)",
            content: content,
            trigger: nil
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
            print("📬 Geofence promotion notification sent")
        } catch {
            print("❌ Failed to send notification: \(error.localizedDescription)")
        }
    }

    /// Request notification permission
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("✅ Notification permission granted")
            } else if let error = error {
                print("❌ Notification permission error: \(error.localizedDescription)")
            }
        }
    }

    /// Post notification when location permission is denied
    private func postLocationPermissionDeniedNotification() {
        NotificationCenter.default.post(
            name: NSNotification.Name("LocationPermissionDenied"),
            object: nil
        )
    }

    // MARK: - Diagnostics

    /// Get geofencing status info
    func getStatus() -> String {
        var status = "Geofencing Status:\n"
        status += "- Enabled: \(isGeofencingEnabled)\n"
        status += "- Authorization: \(authorizationStatus.description)\n"
        status += "- Monitored Regions: \(monitoredRegions.count)\n"
        status += "- Location Updates: \(locationManager.location != nil ? "Active" : "Inactive")\n"
        return status
    }
}

// MARK: - CLLocationManagerDelegate

extension GeofencingManager: CLLocationManagerDelegate {

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let newStatus = manager.authorizationStatus
        authorizationStatus = newStatus

        print("📍 Location authorization changed: \(newStatus.description)")

        switch newStatus {
        case .authorizedAlways:
            if isGeofencingEnabled {
                enableGeofencing()
            }
        case .authorizedWhenInUse:
            // Prompt to upgrade to always
            print("⚠️ Geofencing requires 'Always' authorization")
        case .denied, .restricted:
            disableGeofencing()
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        guard isGeofencingEnabled else { return }

        print("📍 Entered region: \(region.identifier)")
        handleGeofenceEntry(storeId: region.identifier)
    }

    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        guard isGeofencingEnabled else { return }

        print("📍 Exited region: \(region.identifier)")
        handleGeofenceExit(storeId: region.identifier)
    }

    func locationManager(_ manager: CLLocationManager, didStartMonitoringFor region: CLRegion) {
        print("✅ Started monitoring region: \(region.identifier)")
    }

    func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        if let region = region {
            print("❌ Monitoring failed for region \(region.identifier): \(error.localizedDescription)")
        } else {
            print("❌ Monitoring failed: \(error.localizedDescription)")
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        print("📍 Location updated: \(location.coordinate.latitude), \(location.coordinate.longitude)")
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location manager error: \(error.localizedDescription)")
    }
}

// MARK: - CLAuthorizationStatus Extension

extension CLAuthorizationStatus {
    var description: String {
        switch self {
        case .notDetermined: return "Not Determined"
        case .restricted: return "Restricted"
        case .denied: return "Denied"
        case .authorizedAlways: return "Authorized Always"
        case .authorizedWhenInUse: return "Authorized When In Use"
        @unknown default: return "Unknown"
        }
    }
}
