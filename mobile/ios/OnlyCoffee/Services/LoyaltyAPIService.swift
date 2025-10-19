import Foundation

class LoyaltyAPIService {
    static let shared = LoyaltyAPIService()

    private let baseURL = "https://api.onlycoffee.com" // TODO: Update with actual API URL
    private var authToken: String?

    private init() {}

    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    // MARK: - Streak Endpoints

    func getMyStreak() async throws -> UserStreak {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/streak") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let streakResponse = try decoder.decode(StreakResponse.self, from: data)
        return streakResponse.data
    }

    func getMyVisits(startDate: Date? = nil, endDate: Date? = nil) async throws -> [StreakVisit] {
        var urlString = "\(baseURL)/api/v1/loyalty/visits"
        var queryItems: [String] = []

        if let start = startDate {
            let formatter = ISO8601DateFormatter()
            queryItems.append("startDate=\(formatter.string(from: start))")
        }

        if let end = endDate {
            let formatter = ISO8601DateFormatter()
            queryItems.append("endDate=\(formatter.string(from: end))")
        }

        if !queryItems.isEmpty {
            urlString += "?" + queryItems.joined(separator: "&")
        }

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let visitsResponse = try decoder.decode(VisitsResponse.self, from: data)
        return visitsResponse.data
    }

    func hasVisitedToday() async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/visited-today") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let visitedResponse = try decoder.decode(VisitedTodayResponse.self, from: data)
        return visitedResponse.data.visited
    }

    // MARK: - Rewards Endpoints

    func getStreakRewards() async throws -> [StreakReward] {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/rewards") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let rewardsResponse = try decoder.decode(RewardsResponse.self, from: data)
        return rewardsResponse.data
    }

    func getNextMilestone() async throws -> NextMilestone {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/rewards/next-milestone") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let milestoneResponse = try decoder.decode(NextMilestoneResponse.self, from: data)
        return milestoneResponse.data
    }

    // MARK: - Streak Saver Token Endpoints

    func getMyTokens(status: TokenStatus? = nil) async throws -> [StreakSaverToken] {
        var urlString = "\(baseURL)/api/v1/loyalty/tokens"

        if let status = status {
            urlString += "?status=\(status.rawValue)"
        }

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let tokensResponse = try decoder.decode(TokensResponse.self, from: data)
        return tokensResponse.data
    }

    func getAvailableTokenCount() async throws -> Int {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/tokens/available-count") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let countResponse = try decoder.decode(TokenCountResponse.self, from: data)
        return countResponse.data.count
    }

    func useToken(missedDate: Date) async throws -> UseTokenResponse {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/tokens/use") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let formatter = ISO8601DateFormatter()
        let body: [String: String] = ["missedDate": formatter.string(from: missedDate)]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw APIError.serverError( errorResponse.message)
            }
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        return try decoder.decode(UseTokenResponse.self, from: data)
    }

    // MARK: - Tier Endpoints

    func getMyTier() async throws -> TierProgress {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/tier") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let tierResponse = try decoder.decode(TierProgressResponse.self, from: data)
        return tierResponse.data
    }

    func getMyTierPerks() async throws -> [TierPerk] {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/tier/perks") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let perksResponse = try decoder.decode(TierPerksResponse.self, from: data)
        return perksResponse.data
    }

    // MARK: - Anniversary Endpoints

    func getMyAnniversaries() async throws -> [AnniversaryReward] {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/anniversaries") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let anniversariesResponse = try decoder.decode(AnniversariesResponse.self, from: data)
        return anniversariesResponse.data
    }

    func getNextAnniversary() async throws -> NextAnniversary {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/anniversaries/next") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let nextAnniversaryResponse = try decoder.decode(NextAnniversaryResponse.self, from: data)
        return nextAnniversaryResponse.data
    }

    // MARK: - Dashboard Endpoint

    func getDashboard() async throws -> LoyaltyDashboard {
        guard let url = URL(string: "\(baseURL)/api/v1/loyalty/dashboard") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let dashboardResponse = try decoder.decode(DashboardResponse.self, from: data)
        return dashboardResponse.data
    }
}
