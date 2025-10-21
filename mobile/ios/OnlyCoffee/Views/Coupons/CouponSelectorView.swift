import SwiftUI

struct CouponSelectorView: View {
    @EnvironmentObject var cartManager: CartManager
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = CouponSelectorViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if viewModel.isLoading {
                    ProgressView("Loading coupons...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage = viewModel.errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.orange)
                        Text(errorMessage)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                        Button("Retry") {
                            Task {
                                await viewModel.loadCoupons()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else if viewModel.activeCoupons.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "ticket")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("No coupons available")
                            .font(.title3)
                            .foregroundColor(.secondary)
                        Text("Visit My Coupons to add promo codes")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List {
                        // Remove coupon option (if one is selected)
                        if cartManager.selectedCoupon != nil {
                            Button(action: {
                                cartManager.removeCoupon()
                                dismiss()
                            }) {
                                HStack {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.red)
                                    Text("Remove coupon")
                                        .foregroundColor(.primary)
                                    Spacer()
                                }
                            }
                        }

                        // Active coupons
                        ForEach(viewModel.activeCoupons) { coupon in
                            CouponSelectorRow(
                                coupon: coupon,
                                isSelected: cartManager.selectedCoupon?.id == coupon.id,
                                subtotal: cartManager.subtotal,
                                onSelect: {
                                    cartManager.applyCoupon(coupon)
                                    dismiss()
                                }
                            )
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Select Coupon")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .task {
                await viewModel.loadCoupons()
            }
        }
    }
}

struct CouponSelectorRow: View {
    let coupon: Coupon
    let isSelected: Bool
    let subtotal: Double
    let onSelect: () -> Void

    var estimatedDiscount: String {
        switch coupon.type {
        case .percentOff:
            if let percentOff = coupon.percentOff {
                let discount = subtotal * (Double(percentOff) / 100.0)
                return String(format: "-$%.2f", min(discount, subtotal))
            }
        case .fixedAmount:
            if let valueCents = coupon.valueCents {
                let discount = Double(valueCents) / 100.0
                return String(format: "-$%.2f", min(discount, subtotal))
            }
        case .fixedPrice:
            if let priceOverrideCents = coupon.priceOverrideCents {
                let fixedPrice = Double(priceOverrideCents) / 100.0
                return String(format: "→ $%.2f", fixedPrice)
            }
        case .freeItem:
            return "FREE"
        }
        return ""
    }

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Checkmark indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .green : .gray)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 6) {
                    // Coupon value badge
                    Text(coupon.displayValue)
                        .font(.headline)
                        .foregroundColor(coupon.isExpiringSoon ? .orange : Color(hex: "#E91E63"))

                    // Label
                    Text(coupon.label)
                        .font(.subheadline)
                        .foregroundColor(.primary)

                    // Description (if available)
                    if let description = coupon.description {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }

                    // Expiry and channel
                    HStack(spacing: 8) {
                        Label(coupon.expiryText, systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(coupon.isExpiringSoon ? .orange : .secondary)

                        if !coupon.channelText.isEmpty {
                            Text("•")
                                .foregroundColor(.secondary)
                            Text(coupon.channelText)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Spacer()

                // Estimated discount
                VStack(alignment: .trailing, spacing: 4) {
                    Text(estimatedDiscount)
                        .font(.headline)
                        .foregroundColor(.green)

                    if isSelected {
                        Text("Applied")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
}

@MainActor
class CouponSelectorViewModel: ObservableObject {
    @Published var activeCoupons: [Coupon] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiService = CouponsAPIService.shared

    func loadCoupons() async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await apiService.getMyCoupons()
            activeCoupons = response.data.active
        } catch {
            errorMessage = "Failed to load coupons"
        }

        isLoading = false
    }
}
