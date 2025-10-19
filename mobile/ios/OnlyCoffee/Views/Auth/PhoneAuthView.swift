import SwiftUI

struct PhoneAuthView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @Environment(\.dismiss) var dismiss

    @State private var phoneNumber: String = ""
    @State private var countryCode: String = "+1"
    @State private var marketingOptIn: Bool = false
    @State private var termsAccepted: Bool = false
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var navigateToVerification: Bool = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: "phone.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.brandPink)

                        Text("Welcome to Only Coffee")
                            .font(.title.bold())

                        Text("Enter your phone number to get started")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 40)

                    // Phone Number Input
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Phone Number")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        HStack(spacing: 12) {
                            // Country Code Picker
                            Menu {
                                Button("+1 (US/Canada)") { countryCode = "+1" }
                                Button("+44 (UK)") { countryCode = "+44" }
                                Button("+86 (China)") { countryCode = "+86" }
                                Button("+91 (India)") { countryCode = "+91" }
                                // Add more country codes as needed
                            } label: {
                                HStack {
                                    Text(countryCode)
                                        .foregroundColor(.primary)
                                    Image(systemName: "chevron.down")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 14)
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                            }

                            // Phone Number Field
                            TextField("Phone Number", text: $phoneNumber)
                                .keyboardType(.phonePad)
                                .textContentType(.telephoneNumber)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                        }
                    }

                    // Checkboxes
                    VStack(alignment: .leading, spacing: 16) {
                        // Terms Checkbox
                        HStack(alignment: .top, spacing: 12) {
                            Button {
                                termsAccepted.toggle()
                            } label: {
                                Image(systemName: termsAccepted ? "checkmark.square.fill" : "square")
                                    .font(.title3)
                                    .foregroundColor(termsAccepted ? .brandPink : .gray)
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text("I agree to the Terms of Use")
                                    .font(.subheadline)

                                Button("View Terms") {
                                    // TODO: Show terms modal
                                }
                                .font(.caption)
                                .foregroundColor(.brandPink)
                            }
                        }

                        // Marketing Checkbox
                        HStack(alignment: .top, spacing: 12) {
                            Button {
                                marketingOptIn.toggle()
                            } label: {
                                Image(systemName: marketingOptIn ? "checkmark.square.fill" : "square")
                                    .font(.title3)
                                    .foregroundColor(marketingOptIn ? .brandPink : .gray)
                            }

                            Text("I agree to receive marketing messages and promotional offers")
                                .font(.subheadline)
                        }
                    }
                    .padding(.vertical, 8)

                    // Error Message
                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }

                    // Continue Button
                    Button {
                        sendVerificationCode()
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Continue")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isFormValid ? Color.brandPink : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!isFormValid || isLoading)

                    // Privacy Notice
                    Text("By continuing, you will receive an SMS verification code. Message and data rates may apply.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                            Text("Back")
                        }
                        .foregroundColor(.brandPink)
                    }
                }
            }
            .navigationDestination(isPresented: $navigateToVerification) {
                VerificationCodeView(phoneNumber: formattedPhoneNumber)
                    .environmentObject(authManager)
            }
        }
    }

    // MARK: - Computed Properties

    private var isFormValid: Bool {
        !phoneNumber.isEmpty &&
        termsAccepted &&
        phoneNumber.count >= 10 // Basic validation
    }

    private var formattedPhoneNumber: String {
        // Remove any non-digit characters
        let digits = phoneNumber.filter { $0.isNumber }
        return "\(countryCode)\(digits)"
    }

    // MARK: - Methods

    private func sendVerificationCode() {
        guard isFormValid else { return }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await authManager.sendVerificationCode(
                    phone: formattedPhoneNumber,
                    marketingOptIn: marketingOptIn
                )

                await MainActor.run {
                    isLoading = false
                    navigateToVerification = true
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}

struct PhoneAuthView_Previews: PreviewProvider {
    static var previews: some View {
        PhoneAuthView()
            .environmentObject(AuthenticationManager.shared)
    }
}
