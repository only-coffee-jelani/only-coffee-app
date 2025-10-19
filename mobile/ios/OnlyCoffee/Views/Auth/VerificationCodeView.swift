import SwiftUI

struct VerificationCodeView: View {
    let phoneNumber: String

    @EnvironmentObject var authManager: AuthenticationManager
    @Environment(\.dismiss) var dismiss

    @State private var code: [String] = Array(repeating: "", count: 6)
    @FocusState private var focusedField: Int?
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var canResend: Bool = false
    @State private var resendCountdown: Int = 60
    @State private var navigateToProfileCompletion: Bool = false

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "message.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.brandPink)

                    Text("Verify Your Phone")
                        .font(.title.bold())

                    Text("We sent a 6-digit code to")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text(phoneNumber)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.brandPink)
                }
                .padding(.top, 40)

                // Code Input Fields
                HStack(spacing: 12) {
                    ForEach(0..<6, id: \.self) { index in
                        CodeDigitField(
                            text: $code[index],
                            isFocused: focusedField == index,
                            onTextChange: { newValue in
                                handleCodeInput(at: index, value: newValue)
                            }
                        )
                        .focused($focusedField, equals: index)
                    }
                }
                .padding(.vertical, 20)

                // Error Message
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                }

                // Resend Code
                VStack(spacing: 12) {
                    if canResend {
                        Button {
                            resendCode()
                        } label: {
                            Text("Resend Code")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.brandPink)
                        }
                    } else {
                        Text("Resend code in \(resendCountdown)s")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Button {
                        // Go back to edit phone number
                        dismiss()
                    } label: {
                        Text("Wrong number?")
                            .font(.caption)
                            .foregroundColor(.brandPink)
                    }
                }

                // Verify Button
                Button {
                    verifyCode()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Verify")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isCodeComplete ? Color.brandPink : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(!isCodeComplete || isLoading)
                .padding(.top, 20)

                Spacer()
            }
            .padding()
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
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
        .onAppear {
            // Auto-focus first field
            focusedField = 0
            startResendTimer()
        }
        .onReceive(timer) { _ in
            updateResendTimer()
        }
        .navigationDestination(isPresented: $navigateToProfileCompletion) {
            ProfileCompletionView()
                .environmentObject(authManager)
        }
    }

    // MARK: - Computed Properties

    private var isCodeComplete: Bool {
        code.allSatisfy { !$0.isEmpty }
    }

    private var fullCode: String {
        code.joined()
    }

    // MARK: - Methods

    private func handleCodeInput(at index: Int, value: String) {
        // Only allow digits
        let filtered = value.filter { $0.isNumber }

        if filtered.isEmpty {
            // Handle backspace
            code[index] = ""
            if index > 0 {
                focusedField = index - 1
            }
        } else {
            // Take only the last character
            code[index] = String(filtered.last!)

            // Move to next field
            if index < 5 {
                focusedField = index + 1
            } else {
                // All fields filled, dismiss keyboard
                focusedField = nil

                // Auto-verify
                verifyCode()
            }
        }
    }

    private func verifyCode() {
        guard isCodeComplete else { return }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                let response = try await authManager.verifyCode(
                    phone: phoneNumber,
                    code: fullCode
                )

                await MainActor.run {
                    isLoading = false

                    // Check if profile completion is needed
                    if response.isNewUser {
                        navigateToProfileCompletion = true
                    } else {
                        // Existing user - dismiss all auth screens
                        dismiss()
                    }
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription

                    // Clear code on error
                    code = Array(repeating: "", count: 6)
                    focusedField = 0
                }
            }
        }
    }

    private func resendCode() {
        guard canResend else { return }

        errorMessage = nil

        Task {
            do {
                try await authManager.sendVerificationCode(
                    phone: phoneNumber,
                    marketingOptIn: false // Already set during initial send
                )

                await MainActor.run {
                    canResend = false
                    resendCountdown = 60
                    startResendTimer()
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Failed to resend code. Please try again."
                }
            }
        }
    }

    private func startResendTimer() {
        canResend = false
        resendCountdown = 60
    }

    private func updateResendTimer() {
        if resendCountdown > 0 {
            resendCountdown -= 1
        } else {
            canResend = true
        }
    }
}

// MARK: - Code Digit Field Component

struct CodeDigitField: View {
    @Binding var text: String
    let isFocused: Bool
    let onTextChange: (String) -> Void

    var body: some View {
        TextField("", text: $text)
            .keyboardType(.numberPad)
            .multilineTextAlignment(.center)
            .font(.title.bold())
            .frame(width: 50, height: 60)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isFocused ? Color.brandPink : Color.clear, lineWidth: 2)
            )
            .onChange(of: text) { newValue in
                onTextChange(newValue)
            }
    }
}

struct VerificationCodeView_Previews: PreviewProvider {
    static var previews: some View {
        VerificationCodeView(phoneNumber: "+12025551234")
            .environmentObject(AuthenticationManager.shared)
    }
}
