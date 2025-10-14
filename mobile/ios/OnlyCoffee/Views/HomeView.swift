import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Hero Announcement
                VStack(alignment: .leading, spacing: 12) {
                    Text("We do one thing.")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.brandPink)
                    Text("Coffee. Perfectly.")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.primary)

                    Text("No distractions. No compromises. Just expertly crafted coffee, every single time.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .padding(.top, 4)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)

                // Signature Item - Waffolino
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                        Text("SIGNATURE ITEM")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.brandPink)
                    }

                    Text("The Waffolino")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("Our signature espresso served in a crispy waffle cone. Bold, innovative, and unmistakably Only Coffee.")
                        .font(.body)
                        .foregroundColor(.secondary)

                    HStack {
                        Text("$8.50")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.brandPink)

                        Spacer()

                        Button(action: {
                            // Navigate to menu or add to cart
                        }) {
                            Text("Order Now")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 12)
                                .background(Color.brandPink)
                                .cornerRadius(8)
                        }
                    }
                    .padding(.top, 8)
                }
                .padding()
                .background(Color.brandLight.opacity(0.1))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.brandPink.opacity(0.3), lineWidth: 1)
                )

                // Rewards Section
                if authManager.isAuthenticated {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "gift.fill")
                                .foregroundColor(.brandPink)
                            Text("YOUR REWARDS")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.brandPink)
                        }

                        Text("100 points")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(.brandPink)

                        Text("You're 50 points away from a free drink!")
                            .font(.body)
                            .foregroundColor(.secondary)

                        Button(action: {
                            // Navigate to rewards
                        }) {
                            HStack {
                                Text("View Rewards")
                                    .fontWeight(.semibold)
                                Image(systemName: "arrow.right")
                            }
                            .foregroundColor(.brandPink)
                        }
                        .padding(.top, 4)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
                } else {
                    // Rewards CTA for non-logged in users
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "gift.fill")
                                .foregroundColor(.brandPink)
                            Text("JOIN REWARDS")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.brandPink)
                        }

                        Text("Earn points with every purchase")
                            .font(.title3)
                            .fontWeight(.bold)

                        Text("Sign in to start earning rewards on every coffee you buy.")
                            .font(.body)
                            .foregroundColor(.secondary)

                        NavigationLink(destination: LoginView()) {
                            HStack {
                                Text("Sign In")
                                    .fontWeight(.semibold)
                                Image(systemName: "arrow.right")
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(Color.brandPink)
                            .cornerRadius(8)
                        }
                        .padding(.top, 4)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
                }

                // Menu Highlights
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("MENU HIGHLIGHTS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.brandPink)

                        Spacer()

                        NavigationLink(destination: StoresView()) {
                            HStack {
                                Text("View Stores & Menu")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                Image(systemName: "arrow.right")
                                    .font(.caption)
                            }
                            .foregroundColor(.brandPink)
                        }
                    }

                    // Popular Items Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        MenuHighlightCard(
                            name: "Espresso",
                            price: "$4.50",
                            icon: "cup.and.saucer.fill",
                            description: "Classic, bold"
                        )

                        MenuHighlightCard(
                            name: "Cappuccino",
                            price: "$5.50",
                            icon: "cup.and.saucer.fill",
                            description: "Perfectly balanced"
                        )

                        MenuHighlightCard(
                            name: "Americano",
                            price: "$4.50",
                            icon: "cup.and.saucer.fill",
                            description: "Bold & smooth"
                        )

                        MenuHighlightCard(
                            name: "Latte",
                            price: "$6.00",
                            icon: "cup.and.saucer.fill",
                            description: "Creamy classic"
                        )
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)

                // Current Offers
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "tag.fill")
                            .foregroundColor(.brandPink)
                        Text("CURRENT OFFERS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.brandPink)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "clock.fill")
                                .foregroundColor(.brandAccent)
                            Text("Happy Hour: 2-4 PM")
                                .font(.headline)
                        }
                        Text("$1 off all drinks")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.brandLight.opacity(0.1))
                    .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                            Text("New Member Bonus")
                                .font(.headline)
                        }
                        Text("Sign up and get 50 bonus points")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.brandLight.opacity(0.1))
                    .cornerRadius(8)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)

                // Bottom Spacing
                Spacer()
                    .frame(height: 80)
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Only Coffee")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct MenuHighlightCard: View {
    let name: String
    let price: String
    let icon: String
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.brandPink)

            Text(name)
                .font(.headline)
                .fontWeight(.bold)

            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(price)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(.brandPink)
                .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.brandLight.opacity(0.1))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.brandPink.opacity(0.2), lineWidth: 1)
        )
    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            HomeView()
                .environmentObject(AuthenticationManager.shared)
        }
    }
}
