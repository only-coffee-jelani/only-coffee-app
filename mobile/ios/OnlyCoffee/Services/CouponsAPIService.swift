import Foundation

class CouponsAPIService {
    static let shared = CouponsAPIService()

    private let baseURL = "https://api.onlycoffee.com" // TODO: Update with actual API URL
    private var authToken: String?

    private init() {}

    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    // MARK: - Get User Coupons
    func getMyCoupons() async throws -> CouponsResponse {
        guard let url = URL(string: "\(baseURL)/api/v1/v1/coupons/my-coupons") else {
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

        return try decoder.decode(CouponsResponse.self, from: data)
    }

    // MARK: - Redeem Promo Code
    func redeemPromoCode(_ code: String, idempotencyKey: String? = nil) async throws -> RedeemPromoCodeResponse {
        guard let url = URL(string: "\(baseURL)/api/v1/v1/coupons/redeem-code") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let key = idempotencyKey {
            request.setValue(key, forHTTPHeaderField: "idempotency-key")
        }

        let body: [String: String] = ["code": code]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            // Try to decode error message
            if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw APIError.serverError( errorResponse.message)
            }
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        return try decoder.decode(RedeemPromoCodeResponse.self, from: data)
    }

    // MARK: - Get Coupon by ID
    func getCoupon(id: String) async throws -> Coupon {
        guard let url = URL(string: "\(baseURL)/api/v1/v1/coupons/\(id)") else {
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

        let decodedResponse = try decoder.decode(CouponResponse.self, from: data)
        return decodedResponse.data
    }

    // MARK: - Redeem Coupon on Order
    func redeemCoupon(couponId: String, orderId: String) async throws -> Coupon {
        guard let url = URL(string: "\(baseURL)/api/v1/v1/coupons/redeem") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let body: [String: String] = [
            "couponId": couponId,
            "orderId": orderId
        ]
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

        let decodedResponse = try decoder.decode(CouponResponse.self, from: data)
        return decodedResponse.data
    }
}
