import Foundation

enum Endpoint {
    // MARK: - Authentication
    case login
    case register
    case refreshToken

    // MARK: - User
    case getProfile
    case updateProfile
    case getLoyalty

    // MARK: - Stores
    case getAllStores
    case nearbyStores(latitude: Double, longitude: Double, radius: Int?)
    case storeDetails(id: String)

    // MARK: - Menu
    case getAllMenuItems
    case getMenu(storeId: String)
    case getMenuItem(id: String)
    case calculatePrice
    case getCategories

    // MARK: - Orders
    case createOrder
    case getOrders
    case getOrder(id: String)
    case confirmOrder(id: String)
    case cancelOrder(id: String)

    // MARK: - Payments
    case createPaymentIntent
    case confirmPayment
    case getPaymentMethods
    case attachPaymentMethod

    // MARK: - Rewards
    case getRewardsSummary
    case getRewardsHistory
    case redeemPoints

    // MARK: - Gift Cards
    case createGiftCard
    case redeemGiftCard
    case getGiftCardBalance(code: String)

    // MARK: - Reviews
    case createReview
    case getStoreReviews(storeId: String)
    case getStoreStats(storeId: String)


    var path: String {
        switch self {
        // Auth
        case .login: return "/auth/login"
        case .register: return "/auth/register"
        case .refreshToken: return "/auth/refresh"

        // User
        case .getProfile, .updateProfile: return "/users/me"
        case .getLoyalty: return "/users/me/loyalty"

        // Stores
        case .getAllStores: return "/stores"
        case .nearbyStores(let lat, let lon, let radius):
            var path = "/stores/nearby?latitude=\(lat)&longitude=\(lon)"
            if let radius = radius {
                path += "&radius=\(radius)"
            }
            return path
        case .storeDetails(let id): return "/stores/\(id)"

        // Menu
        case .getAllMenuItems: return "/menu-items"
        case .getMenu(let storeId): return "/menu/store/\(storeId)"
        case .getMenuItem(let id): return "/menu/item/\(id)"
        case .calculatePrice: return "/menu/calculate-price"
        case .getCategories: return "/categories"

        // Orders
        case .createOrder: return "/orders"
        case .getOrders: return "/orders/my-orders"
        case .getOrder(let id): return "/orders/\(id)"
        case .confirmOrder(let id): return "/orders/\(id)/confirm"
        case .cancelOrder(let id): return "/orders/\(id)/cancel"

        // Payments
        case .createPaymentIntent: return "/payments/create-intent"
        case .confirmPayment: return "/payments/confirm"
        case .getPaymentMethods: return "/payments/payment-methods"
        case .attachPaymentMethod: return "/payments/payment-methods/attach"

        // Rewards
        case .getRewardsSummary: return "/rewards/summary"
        case .getRewardsHistory: return "/rewards/history"
        case .redeemPoints: return "/rewards/redeem"

        // Gift Cards
        case .createGiftCard: return "/gifts"
        case .redeemGiftCard: return "/gifts/redeem"
        case .getGiftCardBalance(let code): return "/gifts/code/\(code)/balance"

        // Reviews
        case .createReview: return "/reviews"
        case .getStoreReviews(let storeId): return "/reviews/store/\(storeId)"
        case .getStoreStats(let storeId): return "/reviews/store/\(storeId)/stats"
        }
    }
}
