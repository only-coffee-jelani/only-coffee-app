import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var currentPromoSlide = 0

    let promoSlides = ["promo1", "promo2", "promo3", "promo4", "promo5"]

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Top Sign-In Card (30% height, full width)
                ZStack {
                    // Background coffee cup image
                    Image(systemName: "cup.and.saucer.fill")
                        .resizable()
                        .scaledToFill()
                        .frame(height: UIScreen.main.bounds.height * 0.3)
                        .foregroundColor(.brandLight.opacity(0.3))
                        .clipped()

                    // Gradient overlay for text readability
                    LinearGradient(
                        gradient: Gradient(colors: [Color.black.opacity(0.5), Color.black.opacity(0.2)]),
                        startPoint: .bottom,
                        endPoint: .top
                    )

                    // Sign In / Join Now Content
                    VStack(spacing: 16) {
                        if authManager.isAuthenticated, let user = authManager.currentUser {
                            // Authenticated view
                            VStack(spacing: 8) {
                                Text("Welcome back,")
                                    .font(.title3)
                                    .foregroundColor(.white)
                                Text(user.fullName)
                                    .font(.title.bold())
                                    .foregroundColor(.white)
                                Text("100 Points Available")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.9))
                            }
                        } else {
                            // Not authenticated
                            VStack(spacing: 12) {
                                Text("Join Only Coffee")
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(.white)

                                Text("Earn rewards on every order")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.9))

                                NavigationLink(destination: LoginView()) {
                                    Text("Sign In / Join Now")
                                        .fontWeight(.semibold)
                                        .foregroundColor(.white)
                                        .frame(maxWidth: 250)
                                        .padding()
                                        .background(Color.brandPink)
                                        .cornerRadius(25)
                                }
                            }
                        }
                    }
                }
                .frame(height: UIScreen.main.bounds.height * 0.3)

                // Promotional Carousel (No title, 5 slides)
                TabView(selection: $currentPromoSlide) {
                    ForEach(0..<5) { index in
                        ZStack {
                            RoundedRectangle(cornerRadius: 0)
                                .fill(LinearGradient(
                                    gradient: Gradient(colors: [Color.brandPink.opacity(0.7), Color.brandAccent.opacity(0.5)]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))

                            VStack {
                                Image(systemName: "cup.and.saucer.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(.white)

                                Text("Special Offer \(index + 1)")
                                    .font(.title2.bold())
                                    .foregroundColor(.white)

                                Text("Limited time only")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.9))
                            }
                        }
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))
                .frame(height: 200)
                .onAppear {
                    // Auto-scroll carousel
                    Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { _ in
                        withAnimation {
                            currentPromoSlide = (currentPromoSlide + 1) % 5
                        }
                    }
                }

                // Two Quick Action Cards (50% width each, 15% height)
                HStack(spacing: 12) {
                    // Order Now Card
                    NavigationLink(destination: MenuBrowseView()) {
                        QuickActionCard(
                            title: "Order Now",
                            icon: "storefront.fill",
                            backgroundColor: Color.brandLight.opacity(0.3)
                        )
                    }

                    // Refer Friends Card
                    QuickActionCard(
                        title: "Refer Friends",
                        icon: "person.2.fill",
                        backgroundColor: Color.brandAccent.opacity(0.3)
                    )
                }
                .frame(height: UIScreen.main.bounds.height * 0.15)
                .padding(.horizontal)
                .padding(.vertical, 12)

                // Promotions Section (Scrollable)
                VStack(alignment: .leading, spacing: 16) {
                    Text("Promotions")
                        .font(.title2.bold())
                        .foregroundColor(.primary)
                        .padding(.horizontal)

                    // Promotion Card 1: Invite a friend
                    PromotionCard(
                        title: "Invite a friend, get a free coffee",
                        description: "Share the love and earn rewards",
                        buttonText: "Share Now",
                        iconName: "gift.fill",
                        backgroundColor: Color.brandPink.opacity(0.1)
                    )

                    // Promotion Card 2: Join Daily Club
                    PromotionCard(
                        title: "Join the Daily Club",
                        description: "Subscribe for daily coffee perks",
                        buttonText: "Order Now",
                        iconName: "star.fill",
                        backgroundColor: Color.brandAccent.opacity(0.1)
                    )

                    // Promotion Card 3: Business Catering
                    PromotionCard(
                        title: "Business / Event Catering",
                        description: "Perfect for your next meeting or event",
                        buttonText: "Order Now",
                        iconName: "building.2.fill",
                        backgroundColor: Color.brandLight.opacity(0.2)
                    )
                }
                .padding(.vertical)

                // Bottom spacing
                Spacer()
                    .frame(height: 60)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// Quick Action Card Component
struct QuickActionCard: View {
    let title: String
    let icon: String
    let backgroundColor: Color

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(backgroundColor)

            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 40))
                    .foregroundColor(.brandPink)

                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
            }
        }
    }
}

// Promotion Card Component
struct PromotionCard: View {
    let title: String
    let description: String
    let buttonText: String
    let iconName: String
    let backgroundColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: iconName)
                    .font(.title)
                    .foregroundColor(.brandPink)

                Spacer()
            }

            Text(title)
                .font(.title3.bold())
                .foregroundColor(.primary)

            Text(description)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: {
                // Action handler
            }) {
                Text(buttonText)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.brandPink)
                    .cornerRadius(12)
            }
            .padding(.top, 4)
        }
        .padding()
        .background(backgroundColor)
        .cornerRadius(16)
        .padding(.horizontal)
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
