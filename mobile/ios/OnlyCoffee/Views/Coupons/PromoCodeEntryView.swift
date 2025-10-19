import SwiftUI

struct PromoCodeEntryView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var promoCode = ""
    @State private var isSubmitting = false
    @State private var resultMessage: String?
    @State private var isSuccess = false
    @State private var grantedCoupons: [Coupon] = []

    let onSuccess: (Bool) -> Void

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header Image
                    Image(systemName: "ticket.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.brandPink)
                        .padding(.top, 32)

                    // Title and Description
                    VStack(spacing: 8) {
                        Text("Enter Promo Code")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("Unlock exclusive offers and rewards\nwith your promo code")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    // Input Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("PROMO CODE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.brandPink)

                        TextField("Enter code", text: $promoCode)
                            .textFieldStyle(PlainTextFieldStyle())
                            .autocapitalization(.allCharacters)
                            .disableAutocorrection(true)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.brandPink.opacity(0.3), lineWidth: 1)
                            )
                    }
                    .padding(.horizontal)

                    // Submit Button
                    Button(action: {
                        Task {
                            await submitPromoCode()
                        }
                    }) {
                        HStack {
                            if isSubmitting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Apply Code")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(promoCode.isEmpty || isSubmitting ? Color.gray : Color.brandPink)
                        .cornerRadius(12)
                    }
                    .disabled(promoCode.isEmpty || isSubmitting)
                    .padding(.horizontal)

                    // Result Message
                    if let message = resultMessage {
                        HStack(spacing: 12) {
                            Image(systemName: isSuccess ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                .font(.title2)
                                .foregroundColor(isSuccess ? .green : .red)

                            Text(message)
                                .font(.body)
                                .foregroundColor(isSuccess ? .green : .red)

                            Spacer()
                        }
                        .padding()
                        .background(isSuccess ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }

                    // Granted Coupons Preview
                    if !grantedCoupons.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("NEW COUPONS ADDED")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.brandPink)
                                .padding(.horizontal)

                            ForEach(grantedCoupons) { coupon in
                                HStack(spacing: 12) {
                                    Image(systemName: "gift.fill")
                                        .foregroundColor(.brandPink)

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(coupon.label)
                                            .font(.subheadline)
                                            .fontWeight(.semibold)

                                        Text(coupon.expiryText)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }

                                    Spacer()

                                    Text(coupon.displayValue)
                                        .font(.headline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.brandPink)
                                }
                                .padding()
                                .background(Color.brandLight.opacity(0.1))
                                .cornerRadius(12)
                            }
                            .padding(.horizontal)

                            Button(action: {
                                onSuccess(true)
                                presentationMode.wrappedValue.dismiss()
                            }) {
                                Text("View My Coupons")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                                    .background(Color.brandAccent)
                                    .cornerRadius(12)
                            }
                            .padding(.horizontal)
                        }
                        .padding(.top, 16)
                    }

                    Spacer()
                }
                .padding(.vertical)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Promo Code")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }

    private func submitPromoCode() async {
        isSubmitting = true
        resultMessage = nil
        isSuccess = false
        grantedCoupons = []

        do {
            let idempotencyKey = UUID().uuidString
            let response = try await CouponsAPIService.shared.redeemPromoCode(
                promoCode.trimmingCharacters(in: .whitespaces),
                idempotencyKey: idempotencyKey
            )

            isSuccess = response.success
            resultMessage = response.message

            if let coupons = response.data {
                grantedCoupons = coupons
            }

            if !isSuccess {
                // Clear the input on failure
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    resultMessage = nil
                }
            }
        } catch {
            isSuccess = false
            resultMessage = error.localizedDescription

            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                resultMessage = nil
            }
        }

        isSubmitting = false
    }
}

#Preview {
    PromoCodeEntryView { success in
        print("Success: \(success)")
    }
}
