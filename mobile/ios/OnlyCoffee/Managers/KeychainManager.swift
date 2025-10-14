import Foundation
import Security

class KeychainManager {
    static let shared = KeychainManager()

    private let accessTokenKey = "com.onlycoffee.accessToken"
    private let refreshTokenKey = "com.onlycoffee.refreshToken"

    private init() {}

    // MARK: - Access Token
    func saveAccessToken(_ token: String) {
        save(key: accessTokenKey, value: token)
    }

    func getAccessToken() -> String? {
        return get(key: accessTokenKey)
    }

    func deleteAccessToken() {
        delete(key: accessTokenKey)
    }

    // MARK: - Refresh Token
    func saveRefreshToken(_ token: String) {
        save(key: refreshTokenKey, value: token)
    }

    func getRefreshToken() -> String? {
        return get(key: refreshTokenKey)
    }

    func deleteRefreshToken() {
        delete(key: refreshTokenKey)
    }

    // MARK: - Clear All
    func clearAll() {
        deleteAccessToken()
        deleteRefreshToken()
    }

    // MARK: - Private Helpers
    private func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    private func get(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }

        return value
    }

    private func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }
}
