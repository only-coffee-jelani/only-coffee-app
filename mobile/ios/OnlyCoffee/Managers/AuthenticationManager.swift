import Foundation

@MainActor
class AuthenticationManager: ObservableObject {
    static let shared = AuthenticationManager()

    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiClient = APIClient.shared
    private let keychainManager = KeychainManager.shared

    private init() {
        // Check if user is already logged in
        if keychainManager.getAccessToken() != nil {
            isAuthenticated = true
            Task {
                await loadCurrentUser()
            }
        }
    }

    // MARK: - Login
    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let request = LoginRequest(email: email, password: password)
            let response: AuthResponse = try await apiClient.request(
                endpoint: Endpoint.login.path,
                method: .post,
                body: request,
                requiresAuth: false
            )

            // Save tokens
            keychainManager.saveAccessToken(response.tokens.accessToken)
            keychainManager.saveRefreshToken(response.tokens.refreshToken)

            // Update state
            currentUser = response.user
            isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "An unexpected error occurred"
        }

        isLoading = false
    }

    // MARK: - Register
    func register(email: String, password: String, firstName: String, lastName: String, phone: String?) async {
        isLoading = true
        errorMessage = nil

        do {
            let request = RegisterRequest(
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName,
                phone: phone
            )
            let response: AuthResponse = try await apiClient.request(
                endpoint: Endpoint.register.path,
                method: .post,
                body: request,
                requiresAuth: false
            )

            // Save tokens
            keychainManager.saveAccessToken(response.tokens.accessToken)
            keychainManager.saveRefreshToken(response.tokens.refreshToken)

            // Update state
            currentUser = response.user
            isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "An unexpected error occurred"
        }

        isLoading = false
    }

    // MARK: - Logout
    func logout() {
        keychainManager.clearAll()
        currentUser = nil
        isAuthenticated = false
    }

    // MARK: - Load Current User
    func loadCurrentUser() async {
        do {
            let user: User = try await apiClient.request(
                endpoint: Endpoint.getProfile.path,
                method: .get,
                requiresAuth: true
            )
            currentUser = user
        } catch {
            // If loading user fails, logout
            logout()
        }
    }

    // MARK: - Refresh Token
    func refreshAccessToken() async throws {
        guard let refreshToken = keychainManager.getRefreshToken() else {
            throw APIError.unauthorized
        }

        let request = RefreshTokenRequest(refreshToken: refreshToken)
        let response: TokenPair = try await apiClient.request(
            endpoint: Endpoint.refreshToken.path,
            method: .post,
            body: request,
            requiresAuth: false
        )

        keychainManager.saveAccessToken(response.accessToken)
        keychainManager.saveRefreshToken(response.refreshToken)
    }

    // MARK: - Phone Authentication

    /// Send verification code to phone number
    func sendVerificationCode(phone: String, marketingOptIn: Bool = false) async throws {
        let request = SendCodeRequest(phone: phone, marketingOptIn: marketingOptIn)
        let _: SendCodeResponse = try await apiClient.request(
            endpoint: "/auth/send-code",
            method: .post,
            body: request,
            requiresAuth: false
        )
    }

    /// Verify code and authenticate user
    func verifyCode(phone: String, code: String) async throws -> VerifyCodeResponse {
        let request = VerifyCodeRequest(phone: phone, code: code)
        let response: VerifyCodeResponse = try await apiClient.request(
            endpoint: "/auth/verify-code",
            method: .post,
            body: request,
            requiresAuth: false
        )

        // Save tokens
        keychainManager.saveAccessToken(response.accessToken)
        keychainManager.saveRefreshToken(response.refreshToken)

        // Update state
        currentUser = response.user
        isAuthenticated = true

        return response
    }

    /// Complete user profile after phone verification
    func completeProfile(email: String?, firstName: String?, lastName: String?) async throws {
        let request = CompleteProfileRequest(
            email: email,
            firstName: firstName,
            lastName: lastName
        )
        let response: CompleteProfileResponse = try await apiClient.request(
            endpoint: "/auth/complete-profile",
            method: .post,
            body: request,
            requiresAuth: true
        )

        // Update current user with new profile data
        currentUser = response.user
    }
}

// MARK: - Phone Auth Request/Response Models

struct SendCodeRequest: Codable {
    let phone: String
    let marketingOptIn: Bool
}

struct SendCodeResponse: Codable {
    let success: Bool
    let message: String
    let expiresIn: Int
}

struct VerifyCodeRequest: Codable {
    let phone: String
    let code: String
}

struct VerifyCodeResponse: Codable {
    let user: User
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let isNewUser: Bool
}

struct CompleteProfileRequest: Codable {
    let email: String?
    let firstName: String?
    let lastName: String?
}

struct CompleteProfileResponse: Codable {
    let user: User
    let success: Bool
    let message: String
}
