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
    let oauthManager = OAuthManager.shared

    private init() {
        // Connect OAuth manager
        oauthManager.authManager = self

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
}
