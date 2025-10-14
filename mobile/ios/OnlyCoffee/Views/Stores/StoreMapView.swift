import SwiftUI
import MapKit

struct StoreMapView: View {
    let stores: [StoreWithDistance]
    @Binding var selectedStore: StoreWithDistance?
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )

    var body: some View {
        Map(coordinateRegion: $region, annotationItems: stores) { storeWithDistance in
            MapAnnotation(coordinate: storeWithDistance.store.coordinate) {
                Button(action: {
                    selectedStore = storeWithDistance
                }) {
                    VStack(spacing: 4) {
                        Image(systemName: storeWithDistance.store.type == .store ? "building.2.fill" :
                                storeWithDistance.store.type == .truck ? "bus.fill" : "storefront.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Circle().fill(Color.orange))
                            .shadow(radius: 3)

                        Text(storeWithDistance.store.name)
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.white)
                                    .shadow(radius: 2)
                            )
                    }
                }
            }
        }
        .onAppear {
            if let firstStore = stores.first {
                region.center = firstStore.store.coordinate
            }
        }
    }
}
