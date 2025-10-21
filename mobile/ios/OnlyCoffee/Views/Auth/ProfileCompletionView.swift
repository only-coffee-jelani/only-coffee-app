import SwiftUI

struct ProfileCompletionView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @Environment(\.dismiss) var dismiss

    @State private var email: String = ""
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "person.crop.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.brandPink)

                    Text("Complete Your Profile")
                        .font(.title.bold())

                    Text("Help us personalize your experience")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 40)

                // Optional Badge
                HStack {
                    Spacer()
                    Text("Optional")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.brandPink)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.brandPink.opacity(0.1))
                        .cornerRadius(12)
                    Spacer()
                }

                // Form Fields
                VStack(alignment: .leading, spacing: 20) {
                    // Email Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        TextField("your.email@example.com", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                    }

                    // First Name Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("First Name")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        TextField("John", text: $firstName)
                            .textContentType(.givenName)
                            .autocapitalization(.words)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                    }

                    // Last Name Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Last Name")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        TextField("Doe", text: $lastName)
                            .textContentType(.familyName)
                            .autocapitalization(.words)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                    }
                }

                // Error Message
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                }

                // Complete Profile Button
                Button {
                    completeProfile()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Complete Profile")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(hasAnyInput ? Color.brandPink : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(!hasAnyInput || isLoading)

                // Skip Button
                Button {
                    skipProfile()
                } label: {
                    Text("Skip for Now")
                        .fontWeight(.semibold)
                        .foregroundColor(.brandPink)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.clear)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.brandPink, lineWidth: 2)
                        )
                }

                // Info Text
                Text("You can always update this later in your profile settings")
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
        .navigationBarBackButtonHidden(true)
    }

    // MARK: - Computed Properties

    private var hasAnyInput: Bool {
        !email.isEmpty || !firstName.isEmpty || !lastName.isEmpty
    }

    private var isValidEmail: Bool {
        if email.isEmpty { return true } // Empty is valid (optional)
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    // MARK: - Methods

    private func completeProfile() {
        guard hasAnyInput else { return }

        // Validate email if provided
        if !email.isEmpty && !isValidEmail {
            errorMessage = "Please enter a valid email address"
            return
        }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await authManager.completeProfile(
                    email: email.isEmpty ? nil : email,
                    firstName: firstName.isEmpty ? nil : firstName,
                    lastName: lastName.isEmpty ? nil : lastName
                )

                await MainActor.run {
                    isLoading = false
                    dismiss() // Dismiss to main app
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }

    private func skipProfile() {
        // Just dismiss - user is already authenticated from verification step
        dismiss()
    }
}

struct ProfileCompletionView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileCompletionView()
            .environmentObject(AuthenticationManager.shared)
    }
}
