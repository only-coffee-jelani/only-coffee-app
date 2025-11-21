import SwiftUI

struct MyCouponsView: View {
    @State private var selectedTab = 0
    @State private var coupons: CouponsResponse.CouponsData?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showPromoCodeEntry = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Promo Code Entry Section
                VStack(spacing: 12) {
                    Text("ENTER PROMO CODE")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.brandPink)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Button(action: {
                        showPromoCodeEntry = true
                    }) {
                        HStack {
                            Image(systemName: "ticket.fill")
                                .foregroundColor(.brandPink)

                            Text("Enter Promo Code")
                                .foregroundColor(.primary)

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color.white)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.brandPink.opacity(0.3), lineWidth: 1)
                        )
                    }
                }
                .padding()
                .background(Color(.systemGroupedBackground))

                // Tabs
                Picker("", selection: $selectedTab) {
                    Text("Active (\(coupons?.active.count ?? 0))").tag(0)
                    Text("Expired").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Content
                if isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if let error = errorMessage {
                    Spacer()
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 48))
                            .foregroundColor(.red)

                        Text(error)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        Button("Retry") {
                            Task {
                                await loadCoupons()
                            }
                        }
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.brandPink)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                    .padding()
                    Spacer()
                } else if let couponsData = coupons {
                    let displayedCoupons = selectedTab == 0 ? couponsData.active : couponsData.expired

                    if displayedCoupons.isEmpty {
                        CouponEmptyStateView(tab: selectedTab)
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                ForEach(displayedCoupons) { coupon in
                                    CouponCard(coupon: coupon)
                                }
                            }
                            .padding()
                        }
                    }
                } else {
                    CouponEmptyStateView(tab: selectedTab)
                }
            }
            .navigationTitle("My Coupons")
            .navigationBarTitleDisplayMode(.inline)
            .background(Color(.systemGroupedBackground))
            .onAppear {
                Task {
                    await loadCoupons()
                }
            }
            .sheet(isPresented: $showPromoCodeEntry) {
                PromoCodeEntryView { success in
                    if success {
                        // Reload coupons after successful redemption
                        Task {
                            await loadCoupons()
                        }
                    }
                }
            }
        }
    }

    private func loadCoupons() async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await CouponsAPIService.shared.getMyCoupons()
            coupons = response.data
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// MARK: - Empty State View
struct CouponEmptyStateView: View {
    let tab: Int

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: tab == 0 ? "ticket" : "clock.badge.xmark")
                .font(.system(size: 64))
                .foregroundColor(.gray.opacity(0.5))

            Text(tab == 0 ? "No active coupons yet" : "No expired coupons")
                .font(.headline)
                .foregroundColor(.primary)

            if tab == 0 {
                Text("Enter a promo code or earn rewards\nthrough your loyalty streak!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Spacer()
        }
        .padding()
    }
}

#Preview {
    MyCouponsView()
}
