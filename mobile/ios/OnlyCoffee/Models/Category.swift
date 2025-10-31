import Foundation

struct Category: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let displayName: String
    let sortOrder: Int
    let createdAt: String
    let updatedAt: String
}
