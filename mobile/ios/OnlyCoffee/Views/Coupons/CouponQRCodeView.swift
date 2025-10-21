import SwiftUI

struct CouponQRCodeView: View {
    let coupon: Coupon
    @Environment(\.dismiss) var dismiss
    @State private var qrCodeImage: UIImage?
    @State private var brightness: CGFloat = UIScreen.main.brightness

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Instructions
                    VStack(spacing: 8) {
                        Image(systemName: "qrcode.viewfinder")
                            .font(.system(size: 50))
                            .foregroundColor(.brandPink)

                        Text("Show this code at checkout")
                            .font(.title3)
                            .fontWeight(.semibold)

                        Text("Staff will scan this code to apply your discount")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top)

                    // QR Code
                    if let qrImage = qrCodeImage {
                        Image(uiImage: qrImage)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 280, height: 280)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(20)
                            .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
                    } else {
                        ProgressView()
                            .frame(width: 280, height: 280)
                    }

                    // Coupon Info Card
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(coupon.displayValue)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.brandPink)

                                Text(coupon.label)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 4) {
                                Image(systemName: coupon.isExpiringSoon ? "clock.badge.exclamationmark" : "clock")
                                    .foregroundColor(coupon.isExpiringSoon ? .orange : .secondary)
                                Text(coupon.expiryText)
                                    .font(.caption)
                                    .foregroundColor(coupon.isExpiringSoon ? .orange : .secondary)
                            }
                        }

                        if let description = coupon.description {
                            Text(description)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        // Channel badge
                        HStack {
                            if coupon.channels == "in_store" || coupon.channels == "both" {
                                Label("In-Store", systemImage: "storefront.fill")
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.green)
                                    .cornerRadius(8)
                            }

                            if coupon.channels == "app_only" || coupon.channels == "both" {
                                Label("App", systemImage: "iphone")
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.blue)
                                    .cornerRadius(8)
                            }
                        }

                        // Eligible items info
                        if let eligibleItems = coupon.eligibleItems,
                           let exclude = eligibleItems.exclude,
                           !exclude.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Restrictions")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.secondary)
                                Text("Not valid for: \(exclude.joined(separator: ", "))")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Coupon ID (for staff reference)
                    VStack(spacing: 4) {
                        Text("Coupon ID")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(coupon.id)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.secondary)
                    }
                    .padding(.bottom)
                }
                .padding()
            }
            .navigationTitle("Coupon QR Code")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                // Increase brightness for better QR code scanning
                brightness = UIScreen.main.brightness
                UIScreen.main.brightness = 1.0

                // Generate QR code
                if qrCodeImage == nil {
                    qrCodeImage = QRCodeGenerator.shared.generateCouponQRCode(for: coupon)
                }
            }
            .onDisappear {
                // Restore original brightness
                UIScreen.main.brightness = brightness
            }
        }
    }
}

struct CouponQRCodeView_Previews: PreviewProvider {
    static var previews: some View {
        CouponQRCodeView(coupon: Coupon(
            id: "test-123",
            userId: "user-123",
            promoCodeId: nil,
            type: .percentOff,
            label: "50% Off Drink",
            description: "Get 50% off any drink",
            valueCents: nil,
            percentOff: 50,
            priceOverrideCents: nil,
            eligibleItems: nil,
            channels: "both",
            expiresAt: Date().addingTimeInterval(86400 * 7),
            redeemedAt: nil,
            redeemedOrderId: nil,
            status: .active,
            source: "promo_code",
            metadata: nil,
            createdAt: Date()
        ))
    }
}
