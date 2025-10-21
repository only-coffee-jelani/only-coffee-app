import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        NavigationView {
            if authManager.isAuthenticated, let user = authManager.currentUser {
                List {
                    Section {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.fullName)
                                    .font(.title2.bold())
                                Text(user.email)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 8)
                    }

                    Section("Account") {
                        NavigationLink(destination: Text("Edit Profile")) {
                            Label("Edit Profile", systemImage: "person.fill")
                        }

                        NavigationLink(destination: MyCouponsView()) {
                            Label("My Coupons", systemImage: "ticket.fill")
                        }

                        NavigationLink(destination: Text("Payment Methods")) {
                            Label("Payment Methods", systemImage: "creditcard.fill")
                        }

                        NavigationLink(destination: Text("Addresses")) {
                            Label("Saved Addresses", systemImage: "mappin.circle.fill")
                        }
                    }

                    Section("Preferences") {
                        NavigationLink(destination: Text("Notifications")) {
                            Label("Notifications", systemImage: "bell.fill")
                        }

                        NavigationLink(destination: Text("Settings")) {
                            Label("Settings", systemImage: "gearshape.fill")
                        }
                    }

                    Section("Support") {
                        NavigationLink(destination: Text("Help Center")) {
                            Label("Help Center", systemImage: "questionmark.circle.fill")
                        }

                        NavigationLink(destination: Text("Contact Us")) {
                            Label("Contact Us", systemImage: "envelope.fill")
                        }
                    }

                    Section {
                        Button(role: .destructive, action: {
                            authManager.logout()
                        }) {
                            HStack {
                                Spacer()
                                Label("Log Out", systemImage: "arrow.right.square")
                                Spacer()
                            }
                        }
                    }

                    Section {
                        HStack {
                            Spacer()
                            VStack(spacing: 4) {
                                Text("Only Coffee")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("Version 1.0.0")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                        }
                    }
                }
                .listStyle(.insetGrouped)
                .navigationTitle("Profile")
            } else {
                // Not logged in - show login prompt
                VStack(spacing: 24) {
                    Spacer()

                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.brandPink)

                    VStack(spacing: 8) {
                        Text("Sign In to Your Account")
                            .font(.title2.bold())
                        Text("Access your orders, rewards, and more")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    NavigationLink(destination: LoginView()) {
                        Text("Sign In")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.brandPink)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .padding(.horizontal, 40)

                    Spacer()
                }
                .padding()
                .navigationTitle("Profile")
            }
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(AuthenticationManager.shared)
    }
}
