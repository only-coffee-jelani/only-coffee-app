import Foundation
import AuthenticationServices
import CryptoKit

enum OAuthProvider: String {
    case google
    case facebook
    case apple
}

@MainActor
class OAuthManager: NSObject, ObservableObject {
    static let shared = OAuthManager()

    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiClient = APIClient.shared
    private let keychainManager = KeychainManager.shared
    private var currentNonce: String?

    weak var authManager: AuthenticationManager?

    private override init() {
        super.init()
    }

    // MARK: - Apple Sign In
    func signInWithApple() {
        let nonce = randomNonceString()
        currentNonce = nonce
        let hashedNonce = sha256(nonce)

        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = hashedNonce

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }

    // MARK: - Google Sign In
    func signInWithGoogle() async {
        isLoading = true
        errorMessage = nil

        do {
            // Get Google OAuth URL from backend
            let authURL: OAuthURLResponse = try await apiClient.request(
                endpoint: "/auth/oauth/google/url",
                method: .get,
                requiresAuth: false
            )

            // Open Google OAuth in browser
            if let url = URL(string: authURL.url) {
                await openOAuthURL(url, provider: .google)
            }
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to initiate Google Sign In"
        }

        isLoading = false
    }

    // MARK: - Facebook Sign In
    func signInWithFacebook() async {
        isLoading = true
        errorMessage = nil

        do {
            // Get Facebook OAuth URL from backend
            let authURL: OAuthURLResponse = try await apiClient.request(
                endpoint: "/auth/oauth/facebook/url",
                method: .get,
                requiresAuth: false
            )

            // Open Facebook OAuth in browser
            if let url = URL(string: authURL.url) {
                await openOAuthURL(url, provider: .facebook)
            }
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to initiate Facebook Sign In"
        }

        isLoading = false
    }

    // MARK: - Handle OAuth Callback
    func handleOAuthCallback(url: URL) async {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let code = components.queryItems?.first(where: { $0.name == "code" })?.value,
              let provider = components.queryItems?.first(where: { $0.name == "provider" })?.value else {
            errorMessage = "Invalid OAuth callback"
            return
        }

        isLoading = true

        do {
            let request = OAuthCallbackRequest(code: code, provider: provider)
            let response: AuthResponse = try await apiClient.request(
                endpoint: "/auth/oauth/callback",
                method: .post,
                body: request,
                requiresAuth: false
            )

            // Save tokens
            keychainManager.saveAccessToken(response.tokens.accessToken)
            keychainManager.saveRefreshToken(response.tokens.refreshToken)

            // Update auth manager state
            authManager?.currentUser = response.user
            authManager?.isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "OAuth authentication failed"
        }

        isLoading = false
    }

    // MARK: - Private Helpers
    private func openOAuthURL(_ url: URL, provider: OAuthProvider) async {
        let session = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: "onlycoffee"
        ) { [weak self] callbackURL, error in
            Task { @MainActor in
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }

                if let callbackURL = callbackURL {
                    await self?.handleOAuthCallback(url: callbackURL)
                }
            }
        }

        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false
        session.start()
    }

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        let errorCode = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        if errorCode != errSecSuccess {
            fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
        }

        let charset: [Character] =
        Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")

        let nonce = randomBytes.map { byte in
            charset[Int(byte) % charset.count]
        }

        return String(nonce)
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            String(format: "%02x", $0)
        }.joined()

        return hashString
    }
}

// MARK: - ASAuthorizationControllerDelegate
extension OAuthManager: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        Task { @MainActor in
            isLoading = true

            guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                errorMessage = "Failed to get Apple ID credential"
                isLoading = false
                return
            }

            guard let nonce = currentNonce else {
                errorMessage = "Invalid state: A login callback was received, but no login request was sent."
                isLoading = false
                return
            }

            guard let appleIDToken = appleIDCredential.identityToken,
                  let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
                errorMessage = "Unable to fetch identity token"
                isLoading = false
                return
            }

            do {
                let request = AppleSignInRequest(
                    idToken: idTokenString,
                    nonce: nonce,
                    firstName: appleIDCredential.fullName?.givenName,
                    lastName: appleIDCredential.fullName?.familyName,
                    email: appleIDCredential.email
                )

                let response: AuthResponse = try await apiClient.request(
                    endpoint: "/auth/oauth/apple",
                    method: .post,
                    body: request,
                    requiresAuth: false
                )

                // Save tokens
                keychainManager.saveAccessToken(response.tokens.accessToken)
                keychainManager.saveRefreshToken(response.tokens.refreshToken)

                // Update auth manager state
                authManager?.currentUser = response.user
                authManager?.isAuthenticated = true
            } catch let error as APIError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = "Apple Sign In failed"
            }

            isLoading = false
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        Task { @MainActor in
            if let authError = error as? ASAuthorizationError {
                switch authError.code {
                case .canceled:
                    // User canceled, don't show error
                    break
                case .failed:
                    errorMessage = "Apple Sign In failed"
                case .invalidResponse:
                    errorMessage = "Invalid response from Apple"
                case .notHandled:
                    errorMessage = "Apple Sign In was not handled"
                case .unknown:
                    errorMessage = "Unknown error occurred"
                @unknown default:
                    errorMessage = "Apple Sign In failed"
                }
            } else {
                errorMessage = error.localizedDescription
            }
        }
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding
extension OAuthManager: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            fatalError("No window available")
        }
        return window
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding
extension OAuthManager: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            fatalError("No window available")
        }
        return window
    }
}

// MARK: - Request/Response Models
struct OAuthURLResponse: Codable {
    let url: String
}

struct OAuthCallbackRequest: Codable {
    let code: String
    let provider: String
}

struct AppleSignInRequest: Codable {
    let idToken: String
    let nonce: String
    let firstName: String?
    let lastName: String?
    let email: String?
}
