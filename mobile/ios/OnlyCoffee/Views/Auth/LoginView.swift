import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var email = ""
    @State private var password = ""
    @State private var showingSignup = false

    var body: some View {
        ZStack {
            // Background - pink
            Color.brandPink
                .ignoresSafeArea()

            VStack(spacing: 30) {
                    // Logo and title
                    VStack(spacing: 12) {
                        Image(systemName: "cup.and.saucer.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.white)

                        Text("Only Coffee")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(.white)

                        Text("Your daily brew, delivered")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.top, 60)

                    Spacer()

                    // Login form
                    VStack(spacing: 20) {
                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.9))

                            TextField("", text: $email)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.emailAddress)
                                .textInputAutocapitalization(.never)
                                .keyboardType(.emailAddress)
                        }

                        // Password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.9))

                            SecureField("", text: $password)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.password)
                        }

                        // Error message
                        if let errorMessage = authManager.errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(.horizontal)
                        }

                        // Login button
                        Button(action: {
                            Task {
                                await authManager.login(email: email, password: password)
                            }
                        }) {
                            HStack {
                                if authManager.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text("Log In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white)
                            .foregroundColor(.brandPink)
                            .cornerRadius(12)
                        }
                        .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
                        .opacity(email.isEmpty || password.isEmpty ? 0.6 : 1.0)

                        // Divider
                        HStack {
                            Rectangle()
                                .fill(Color.white.opacity(0.3))
                                .frame(height: 1)
                            Text("OR")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.6))
                                .padding(.horizontal, 8)
                            Rectangle()
                                .fill(Color.white.opacity(0.3))
                                .frame(height: 1)
                        }
                        .padding(.vertical, 8)

                        // OAuth buttons
                        VStack(spacing: 12) {
                            // Apple Sign In
                            Button(action: {
                                authManager.oauthManager.signInWithApple()
                            }) {
                                HStack {
                                    Image(systemName: "applelogo")
                                        .font(.system(size: 18))
                                    Text("Continue with Apple")
                                        .fontWeight(.medium)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .foregroundColor(.black)
                                .cornerRadius(12)
                            }

                            // Google Sign In
                            Button(action: {
                                Task {
                                    await authManager.oauthManager.signInWithGoogle()
                                }
                            }) {
                                HStack {
                                    Image(systemName: "globe")
                                        .font(.system(size: 18))
                                    Text("Continue with Google")
                                        .fontWeight(.medium)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .foregroundColor(.black)
                                .cornerRadius(12)
                            }

                            // Facebook Sign In
                            Button(action: {
                                Task {
                                    await authManager.oauthManager.signInWithFacebook()
                                }
                            }) {
                                HStack {
                                    Image(systemName: "f.circle.fill")
                                        .font(.system(size: 18))
                                    Text("Continue with Facebook")
                                        .fontWeight(.medium)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(red: 0.23, green: 0.35, blue: 0.6))
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                        }

                        // Sign up link
                        Button(action: {
                            showingSignup = true
                        }) {
                            HStack(spacing: 4) {
                                Text("Don't have an account?")
                                    .foregroundColor(.white.opacity(0.8))
                                Text("Sign Up")
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                            }
                            .font(.subheadline)
                        }
                        .padding(.top, 8)
                    }
                    .padding(.horizontal, 30)

                    Spacer()
                }
            }
        }
        .sheet(isPresented: $showingSignup) {
            SignupView()
        }
        .navigationTitle("Sign In")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white.opacity(0.15))
            .cornerRadius(10)
            .foregroundColor(.white)
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
            .environmentObject(AuthenticationManager.shared)
    }
}
