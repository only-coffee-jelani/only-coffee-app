import SwiftUI

struct OfferCard: View {
    let offer: PersonalizedOffer
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 0) {
                // Image section
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
                    .frame(height: 140)
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
                        .frame(height: 140)
                        .overlay(
                            Image(systemName: "gift.fill")
                                .font(.system(size: 48))
                                .foregroundColor(.white.opacity(0.8))
                        )
                }

                // Content section
                VStack(alignment: .leading, spacing: 8) {
                    // Badge row
                    HStack(spacing: 8) {
                        // Offer value badge
                        Text(offer.formattedOfferValue)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(
                                Capsule()
                                    .fill(Color(hex: "ff93a3"))
                            )

                        // Source badge
                        if offer.source == .aiGenerated {
                            HStack(spacing: 4) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 10))
                                Text("AI")
                                    .font(.system(size: 11, weight: .semibold))
                            }
                            .foregroundColor(Color(hex: "ff93a3"))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .stroke(Color(hex: "ff93a3"), lineWidth: 1.5)
                            )
                        }

                        Spacer()
                    }

                    // Title
                    Text(offer.title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.black)
                        .lineLimit(2)

                    // Description
                    Text(offer.description)
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .lineLimit(2)

                    // Validity
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 12))
                        Text(offer.validityText)
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundColor(.secondary)

                    // Personalization reason (if available)
                    if let reason = offer.reason {
                        HStack(spacing: 4) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 11))
                            Text(reason)
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundColor(Color(hex: "ff93a3"))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(hex: "ff93a3").opacity(0.1))
                        )
                    }
                }
                .padding(16)
            }
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
