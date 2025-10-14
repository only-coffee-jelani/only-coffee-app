import Foundation
import CoreLocation

struct Store: Codable, Identifiable {
    let id: String
    let name: String
    let type: StoreType
    let address: String
    let city: String
    let state: String
    let zipCode: String
    let latitude: Double
    let longitude: Double
    let phone: String?
    let isActive: Bool
    let acceptingOrders: Bool
    let capacity: Int
    let openingTime: String
    let closingTime: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var fullAddress: String {
        "\(address), \(city), \(state) \(zipCode)"
    }
}

enum StoreType: String, Codable, CaseIterable {
    case store = "store"
    case truck = "truck"
    case kiosk = "kiosk"

    var displayName: String {
        rawValue.capitalized
    }

    var icon: String {
        switch self {
        case .store: return "building.2"
        case .truck: return "bus"
        case .kiosk: return "storefront"
        }
    }
}

struct StoreWithDistance: Identifiable {
    let store: Store
    let distance: Double // in miles

    var id: String { store.id }

    var distanceText: String {
        String(format: "%.1f mi", distance)
    }
}
