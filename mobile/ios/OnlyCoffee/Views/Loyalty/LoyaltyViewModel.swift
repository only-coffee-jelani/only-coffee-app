import Foundation
import Combine

@MainActor
class LoyaltyViewModel: ObservableObject {
    @Published var dashboard: LoyaltyDashboard?
    @Published var visitedToday: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let apiService = LoyaltyAPIService.shared

    func loadDashboard() async {
        isLoading = true
        errorMessage = nil

        do {
            // Load dashboard and visited today status in parallel
            async let dashboardTask = apiService.getDashboard()
            async let visitedTask = apiService.hasVisitedToday()

            dashboard = try await dashboardTask
            visitedToday = try await visitedTask

            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }

    func refreshData() async {
        await loadDashboard()
    }
}
