import SwiftUI

struct OfferDetailModal: View {
    let offer: PersonalizedOffer
    let onDismiss: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var isRedeeming = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Hero image section
                    if let imageUrl = offer.imageUrl, let url = URL(string: imageUrl) {
                        CachedAsyncImage(url: url) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .overlay(
                                    ProgressView()
                                )
                        }
                        .frame(height: 240)
                        .clipped()
                    } else {
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color(hex: "ff93a3"),
                                        Color(hex: "ff7a8f")
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(height: 240)
                            .overlay(
                                Image(systemName: "gift.fill")
                                    .font(.system(size: 72))
                                    .foregroundColor(.white.opacity(0.8))
                            )
                    }

                    VStack(alignment: .leading, spacing: 24) {
                        // Header section
                        VStack(alignment: .leading, spacing: 12) {
                            // Badges row
                            HStack(spacing: 8) {
                                // Offer value badge
                                Text(offer.formattedOfferValue)
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        Capsule()
                                            .fill(Color(hex: "ff93a3"))
                                    )

                                // Source badge
                                HStack(spacing: 4) {
                                    Image(systemName: sourceIcon)
                                        .font(.system(size: 12))
                                    Text(sourceLabel)
                                        .font(.system(size: 13, weight: .semibold))
                                }
                                .foregroundColor(Color(hex: "ff93a3"))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(
                                    Capsule()
                                        .stroke(Color(hex: "ff93a3"), lineWidth: 1.5)
                                )

                                Spacer()
                            }

                            // Title
                            Text(offer.title)
                                .font(.system(size: 26, weight: .bold))
                                .foregroundColor(.black)

                            // Description
                            Text(offer.description)
                                .font(.system(size: 16))
                                .foregroundColor(.secondary)
                                .lineSpacing(4)
                        }

                        Divider()

                        // Personalization context
                        if let reason = offer.reason {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 6) {
                                    Image(systemName: "sparkles")
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(Color(hex: "ff93a3"))
                                    Text("Why This Offer?")
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(.black)
                                }

                                Text(reason)
                                    .font(.system(size: 14))
                                    .foregroundColor(.secondary)
                                    .lineSpacing(3)
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(hex: "ff93a3").opacity(0.08))
                            )

                            Divider()
                        }

                        // Validity and restrictions
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Details")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.black)

                            // Validity period
                            DetailRow(
                                icon: "clock",
                                title: "Valid Until",
                                value: offer.validityText
                            )

                            // Min purchase
                            if let minPurchase = offer.minPurchaseAmount, minPurchase > 0 {
                                DetailRow(
                                    icon: "cart",
                                    title: "Minimum Purchase",
                                    value: "$\(String(format: "%.2f", minPurchase))"
                                )
                            }

                            // Max discount
                            if let maxDiscount = offer.maxDiscountAmount, maxDiscount > 0 {
                                DetailRow(
                                    icon: "dollarsign.circle",
                                    title: "Maximum Discount",
                                    value: "$\(String(format: "%.2f", maxDiscount))"
                                )
                            }

                            // Confidence score (for AI-generated offers)
                            #if DEBUG
                            if let confidence = offer.confidenceScore {
                                DetailRow(
                                    icon: "chart.bar",
                                    title: "AI Confidence",
                                    value: "\(Int(confidence * 100))%"
                                )
                            }
                            #endif
                        }

                        Divider()

                        // Terms and conditions
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Terms & Conditions")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.black)

                            VStack(alignment: .leading, spacing: 6) {
                                TermsRow(text: "Offer valid for one-time use only")
                                TermsRow(text: "Cannot be combined with other offers")
                                TermsRow(text: "Valid at participating locations only")
                                if offer.offerType == .freeItem || offer.offerType == .buyXGetY {
                                    TermsRow(text: "Free item of equal or lesser value")
                                }
                                TermsRow(text: "Subject to availability")
                            }
                        }
                        .padding(.bottom, 24)
                    }
                    .padding(20)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        onDismiss()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.gray.opacity(0.6))
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                // CTA Button (fixed at bottom)
                VStack(spacing: 0) {
                    Divider()

                    Button(action: handleRedeem) {
                        HStack {
                            if isRedeeming {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text(offer.ctaText)
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color(hex: "ff93a3"))
                        )
                    }
                    .disabled(isRedeeming)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(Color.white)
                }
            }
        }
    }

    // MARK: - Computed Properties

    private var sourceIcon: String {
        switch offer.source {
        case .aiGenerated:
            return "sparkles"
        case .manual:
            return "person.badge.shield.checkmark"
        case .geofence:
            return "location.fill"
        case .bandit:
            return "wand.and.stars"
        case .trigger:
            return "bolt.fill"
        }
    }

    private var sourceLabel: String {
        switch offer.source {
        case .aiGenerated:
            return "AI Generated"
        case .manual:
            return "Curated"
        case .geofence:
            return "Location Based"
        case .bandit:
            return "Smart Optimized"
        case .trigger:
            return "Event Triggered"
        }
    }

    // MARK: - Actions

    private func handleRedeem() {
        isRedeeming = true

        Task {
            // Track redemption event
            await EventTrackerService.shared.trackPromotionRedeemed(
                promotionId: offer.id,
                promotionType: offer.source.rawValue
            )

            // Handle deep link if available
            if let deepLinkString = offer.deepLink,
               let deepLinkURL = URL(string: deepLinkString) {
                // Deep link navigation will be handled by the app's URL handler
                // For now, just close the modal
                await MainActor.run {
                    isRedeeming = false
                    onDismiss()
                    dismiss()
                }
            } else {
                // No deep link, just close and navigate to menu
                await MainActor.run {
                    isRedeeming = false
                    onDismiss()
                    dismiss()
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(Color(hex: "ff93a3"))
                .frame(width: 24)

            Text(title)
                .font(.system(size: 15))
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.black)
        }
    }
}

struct TermsRow: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•")
                .font(.system(size: 13))
                .foregroundColor(.secondary)

            Text(text)
                .font(.system(size: 13))
                .foregroundColor(.secondary)
                .lineSpacing(2)
        }
    }
}

// MARK: - Preview

#if DEBUG
struct OfferDetailModal_Previews: PreviewProvider {
    static var previews: some View {
        OfferDetailModal(
            offer: PersonalizedOffer(
                id: "test-1",
                title: "20% Off Your Next Order",
                description: "Enjoy 20% off your entire purchase. Perfect for trying something new or stocking up on your favorites!",
                offerType: .percentageDiscount,
                offerValue: 20,
                imageUrl: nil,
                validFrom: Date(),
                validUntil: Calendar.current.date(byAdding: .day, value: 7, to: Date()),
                minPurchaseAmount: 10.0,
                maxDiscountAmount: 5.0,
                targetSegments: ["high_value"],
                priority: 1,
                source: .aiGenerated,
                personalizedFor: "high_value",
                confidenceScore: 0.87,
                reason: "You've been a loyal customer! We noticed you haven't visited in a while and want to welcome you back with this special offer.",
                ctaText: "Redeem Now",
                deepLink: "onlycoffee://menu"
            ),
            onDismiss: {}
        )
    }
}
#endif
