import SwiftUI

struct CouponCard: View {
    let coupon: Coupon
    @State private var showDetails = false

    var body: some View {
        Button(action: {
            showDetails = true
        }) {
            VStack(alignment: .leading, spacing: 12) {
                // Header with value badge
                HStack(alignment: .top, spacing: 12) {
                    // Value Badge
                    Text(coupon.displayValue)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            coupon.isExpired ? Color.gray :
                            coupon.isExpiringSoon ? Color.orange : Color.brandPink
                        )
                        .cornerRadius(12)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(coupon.label)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(coupon.isExpired ? .secondary : .primary)

                        if let description = coupon.description {
                            Text(description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }
                    }

                    Spacer()
                }

                // Expiry and Channel Info
                HStack(spacing: 16) {
                    // Expiry
                    HStack(spacing: 4) {
                        Image(systemName: coupon.isExpiringSoon ? "exclamationmark.triangle.fill" : "clock")
                            .font(.caption)
                            .foregroundColor(coupon.isExpiringSoon ? .orange : .secondary)

                        Text(coupon.expiryText)
                            .font(.caption)
                            .fontWeight(coupon.isExpiringSoon ? .semibold : .regular)
                            .foregroundColor(coupon.isExpiringSoon ? .orange : .secondary)
                    }

                    Spacer()

                    // Channel Badge
                    HStack(spacing: 4) {
                        Image(systemName: coupon.channels == "app_only" ? "iphone" : "bag")
                            .font(.caption2)

                        Text(coupon.channelText)
                            .font(.caption2)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.brandAccent.opacity(0.8))
                    .cornerRadius(8)
                }

                // Use Now Button (only for active coupons)
                if coupon.isActive {
                    Button(action: {
                        // TODO: Navigate to menu or checkout
                    }) {
                        Text("Use Now")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.brandPink)
                            .cornerRadius(8)
                    }
                } else if coupon.status == .redeemed {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)

                        Text("Redeemed")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.green)

                        if let redeemedAt = coupon.redeemedAt {
                            Text("• \(formatDate(redeemedAt))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            .padding()
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
            .opacity(coupon.isExpired ? 0.6 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
        .sheet(isPresented: $showDetails) {
            CouponDetailView(coupon: coupon)
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }
}

// MARK: - Coupon Detail View
struct CouponDetailView: View {
    let coupon: Coupon
    @Environment(\.presentationMode) var presentationMode
    @State private var showQRCode = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Value Display
                    VStack(spacing: 8) {
                        Text(coupon.displayValue)
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(.brandPink)

                        Text(coupon.label)
                            .font(.title2)
                            .fontWeight(.bold)

                        if let description = coupon.description {
                            Text(description)
                                .font(.body)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 32)
                    .background(Color.brandLight.opacity(0.2))
                    .cornerRadius(16)

                    // Details
                    VStack(alignment: .leading, spacing: 16) {
                        DetailRow(icon: "clock", title: "Expires", value: coupon.formattedExpiryDate)

                        DetailRow(icon: "bag", title: "Redeem", value: coupon.channelText)

                        if let eligibleItems = coupon.eligibleItems {
                            if let exclude = eligibleItems.exclude, !exclude.isEmpty {
                                DetailRow(
                                    icon: "xmark.circle",
                                    title: "Excludes",
                                    value: exclude.joined(separator: ", ").capitalized
                                )
                            }

                            if let include = eligibleItems.include, !include.isEmpty {
                                DetailRow(
                                    icon: "checkmark.circle",
                                    title: "Includes",
                                    value: include.joined(separator: ", ").capitalized
                                )
                            }
                        }

                        DetailRow(icon: "tag", title: "Source", value: formatSource(coupon.source))
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)

                    // Action Buttons
                    if coupon.isActive {
                        VStack(spacing: 12) {
                            // Show QR Code button (for in-store redemption)
                            if coupon.channels == "in_store" || coupon.channels == "both" {
                                Button(action: {
                                    showQRCode = true
                                }) {
                                    HStack {
                                        Image(systemName: "qrcode")
                                        Text("Show QR Code for In-Store")
                                            .fontWeight(.semibold)
                                    }
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                                    .background(Color.green)
                                    .cornerRadius(12)
                                }
                            }

                            // Use in app button
                            if coupon.channels == "app_only" || coupon.channels == "both" {
                                Button(action: {
                                    // TODO: Navigate to menu with coupon pre-selected
                                    presentationMode.wrappedValue.dismiss()
                                }) {
                                    HStack {
                                        Image(systemName: "iphone")
                                        Text("Use in App")
                                            .fontWeight(.semibold)
                                    }
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                                    .background(Color.brandPink)
                                    .cornerRadius(12)
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Coupon Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .sheet(isPresented: $showQRCode) {
                CouponQRCodeView(coupon: coupon)
            }
        }
    }

    private func formatSource(_ source: String) -> String {
        source.replacingOccurrences(of: "_", with: " ").capitalized
    }
}

// MARK: - Detail Row
struct DetailRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.brandPink)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(value)
                    .font(.body)
                    .foregroundColor(.primary)
            }

            Spacer()
        }
    }
}

#Preview {
    CouponCard(coupon: Coupon(
        id: "1",
        userId: "user1",
        promoCodeId: nil,
        type: .percentOff,
        label: "50% Off Drink",
        description: "Get 50% off any drink",
        valueCents: nil,
        percentOff: 50,
        priceOverrideCents: nil,
        eligibleItems: Coupon.EligibleItems(exclude: ["waffolino"], include: nil),
        channels: "both",
        expiresAt: Date().addingTimeInterval(86400 * 3),
        redeemedAt: nil,
        redeemedOrderId: nil,
        status: .active,
        source: "new_user",
        metadata: nil,
        createdAt: Date()
    ))
    .padding()
}
