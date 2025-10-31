import Foundation
import SwiftUI

@MainActor
class PersonalizedOffersViewModel: ObservableObject {
    @Published var offers: [PersonalizedOffer] = []
    @Published var userSegment: String?
    @Published var churnRisk: Double?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedOffer: PersonalizedOffer?

    func fetchOffers() async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await PersonalizedOffersService.shared.fetchPersonalizedOffers()
            offers = response.offers.filter { $0.isValid }
            userSegment = response.userSegment
            churnRisk = response.churnRisk
            print("✅ Fetched \(offers.count) personalized offers")
        } catch {
            errorMessage = "Failed to load offers: \(error.localizedDescription)"
            print("❌ Error fetching offers: \(error.localizedDescription)")
        }

        isLoading = false
    }

    func trackOfferViewed(_ offer: PersonalizedOffer) {
        Task {
            await PersonalizedOffersService.shared.trackOfferViewed(
                offerId: offer.id,
                source: offer.source
            )
        }
    }

    func trackOfferClicked(_ offer: PersonalizedOffer) {
        Task {
            await PersonalizedOffersService.shared.trackOfferClicked(
                offerId: offer.id,
                source: offer.source
            )
        }
    }

    func selectOffer(_ offer: PersonalizedOffer) {
        selectedOffer = offer
        trackOfferClicked(offer)
    }

    func dismissOffer() {
        selectedOffer = nil
    }
}
