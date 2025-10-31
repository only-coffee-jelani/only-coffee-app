import SwiftUI

struct PersonalizedOffersView: View {
    @StateObject private var viewModel = PersonalizedOffersViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView("Loading your offers...")
                } else if let errorMessage = viewModel.errorMessage {
                    ErrorView(message: errorMessage, retry: {
                        Task {
                            await viewModel.fetchOffers()
                        }
                    })
                } else if viewModel.offers.isEmpty {
                    EmptyStateView()
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Header section
                            if let segment = viewModel.userSegment {
                                PersonalizationHeaderView(
                                    segment: segment,
                                    churnRisk: viewModel.churnRisk
                                )
                            }

                            // Offers grid
                            LazyVStack(spacing: 16) {
                                ForEach(viewModel.offers) { offer in
                                    OfferCard(offer: offer) {
                                        viewModel.selectOffer(offer)
                                    }
                                    .onAppear {
                                        viewModel.trackOfferViewed(offer)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical)
                    }
                }
            }
            .navigationTitle("For You")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task {
                            await viewModel.fetchOffers()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(Color(hex: "ff93a3"))
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .sheet(item: $viewModel.selectedOffer) { offer in
                OfferDetailModal(
                    offer: offer,
                    onDismiss: { viewModel.dismissOffer() }
                )
            }
        }
        .task {
            await viewModel.fetchOffers()
        }
    }
}

// MARK: - Personalization Header
struct PersonalizationHeaderView: View {
    let segment: String
    let churnRisk: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color(hex: "ff93a3"))
                Text("Personalized Just For You")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color(hex: "ff93a3"))
            }

            Text("Based on your preferences and purchase history, we've handpicked these special offers.")
                .font(.system(size: 14))
                .foregroundColor(.secondary)

            // Segment badge (for debugging/testing)
            #if DEBUG
            if !segment.isEmpty {
                HStack(spacing: 4) {
                    Text("Segment:")
                        .font(.system(size: 11, weight: .medium))
                    Text(segment.replacingOccurrences(of: "_", with: " ").capitalized)
                        .font(.system(size: 11, weight: .bold))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    Capsule()
                        .fill(Color.blue)
                )
            }
            #endif
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "ff93a3").opacity(0.1))
        )
        .padding(.horizontal)
    }
}

// MARK: - Empty State
struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "gift")
                .font(.system(size: 64))
                .foregroundColor(.gray)

            Text("No Offers Available")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.black)

            Text("Check back soon for personalized offers tailored just for you!")
                .font(.system(size: 16))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }
}

// MARK: - Error View
struct ErrorView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 64))
                .foregroundColor(.orange)

            Text("Oops!")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.black)

            Text(message)
                .font(.system(size: 16))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button(action: retry) {
                Text("Try Again")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 12)
                    .background(
                        Capsule()
                            .fill(Color(hex: "ff93a3"))
                    )
            }
        }
    }
}
