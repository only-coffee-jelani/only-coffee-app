import Foundation

class PersonalizedOffersService {
    static let shared = PersonalizedOffersService()

    private init() {}

    /// Fetch personalized offers for the current user
    func fetchPersonalizedOffers() async throws -> PersonalizedOffersResponse {
        guard let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? Bundle.main.infoDictionary?["API_BASE_URL"] as? String else {
            throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "API_BASE_URL not configured"])
        }

        let endpoint = "\(baseURL)/offers/personalized"
        guard let url = URL(string: endpoint) else {
            throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        // Add auth token
        if let token = KeychainManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }

        guard httpResponse.statusCode == 200 else {
            throw NSError(domain: "", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Server returned \(httpResponse.statusCode)"])
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        return try decoder.decode(PersonalizedOffersResponse.self, from: data)
    }

    /// Fetch recommended menu items
    func fetchRecommendedItems() async throws -> [MenuItem] {
        guard let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? Bundle.main.infoDictionary?["API_BASE_URL"] as? String else {
            throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "API_BASE_URL not configured"])
        }

        let endpoint = "\(baseURL)/recommendations/for-me"
        guard let url = URL(string: endpoint) else {
            throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        // Add auth token
        if let token = KeychainManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }

        guard httpResponse.statusCode == 200 else {
            throw NSError(domain: "", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Server returned \(httpResponse.statusCode)"])
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        struct RecommendationsResponse: Codable {
            let success: Bool
            let recommendations: [RecommendedItem]
        }

        struct RecommendedItem: Codable {
            let itemId: String
            let name: String
            let category: String?
            let basePrice: Double
            let score: Double
            let reason: String
        }

        let recommendationsResponse = try decoder.decode(RecommendationsResponse.self, from: data)

        // For now, return empty array since we need to fetch full menu items
        // In production, you'd want to fetch full menu item details for each recommendation
        return []
    }

    /// Track offer viewed
    func trackOfferViewed(offerId: String, source: OfferSource) async {
        await EventTrackerService.shared.trackPromotionViewed(
            promotionId: offerId,
            promotionType: source.rawValue
        )
    }

    /// Track offer clicked
    func trackOfferClicked(offerId: String, source: OfferSource) async {
        await EventTrackerService.shared.trackPromotionClicked(
            promotionId: offerId,
            promotionType: source.rawValue
        )
    }
}
