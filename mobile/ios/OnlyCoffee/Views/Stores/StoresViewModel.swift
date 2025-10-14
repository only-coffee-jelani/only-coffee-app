import Foundation
import CoreLocation

@MainActor
class StoresViewModel: NSObject, ObservableObject {
    @Published var stores: [StoreWithDistance] = []
    @Published var selectedStore: StoreWithDistance?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiClient = APIClient.shared
    private let locationManager = CLLocationManager()
    private var userLocation: CLLocation?

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func loadNearbyStores() async {
        isLoading = true
        errorMessage = nil

        // Request location permission
        let authStatus = locationManager.authorizationStatus
        if authStatus == .notDetermined {
            locationManager.requestWhenInUseAuthorization()
        }

        // Get current location
        if authStatus == .authorizedWhenInUse || authStatus == .authorizedAlways {
            locationManager.requestLocation()

            // Wait for location (simple approach)
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
        }

        // Use default location if no user location (San Francisco)
        let latitude = userLocation?.coordinate.latitude ?? 37.7749
        let longitude = userLocation?.coordinate.longitude ?? -122.4194

        do {
            let response: [Store] = try await apiClient.request(
                endpoint: Endpoint.nearbyStores(latitude: latitude, longitude: longitude, radius: 10).path,
                method: .get,
                requiresAuth: true
            )

            // Calculate distances
            let userLoc = CLLocation(latitude: latitude, longitude: longitude)
            stores = response.map { store in
                let storeLoc = CLLocation(latitude: store.latitude, longitude: store.longitude)
                let distance = userLoc.distance(from: storeLoc) / 1609.34 // Convert meters to miles
                return StoreWithDistance(store: store, distance: distance)
            }
            .sorted { $0.distance < $1.distance }

        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to load stores"
        }

        isLoading = false
    }
}

extension StoresViewModel: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        userLocation = locations.first
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .authorizedWhenInUse ||
           manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }
}
