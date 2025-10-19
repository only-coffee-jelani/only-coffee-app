import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var currentCarouselIndex = 0
    @State private var carouselTimer: Timer?

    // Carousel items matching Android promotions
    private let carouselItems = [
        CarouselItem(
            title: "Fall Special: Waffolino",
            description: "Try our signature Waffolino - espresso in a crispy waffle cone",
            imageName: "waffolino",
            backgroundColor: Color.brandLight
        ),
        CarouselItem(
            title: "Happy Hour",
            description: "$1 off all drinks from 2-4 PM daily",
            imageName: "happyhour",
            backgroundColor: Color.brandAccent.opacity(0.2)
        ),
        CarouselItem(
            title: "Join Rewards",
            description: "Earn points with every purchase",
            imageName: "rewards",
            backgroundColor: Color.brandPink.opacity(0.2)
        )
    ]

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Welcome Card (when not logged in) - covers top 35% of screen
                    if !authManager.isAuthenticated {
                        WelcomeCard()
                            .frame(height: geometry.size.height * 0.35)
                            .padding(.horizontal)
                            .padding(.bottom, 8) // Add space between card and slideshow
                    }

                    // Auto-scrolling Promotional Carousel (matching Android) - 5% bigger
                    TabView(selection: $currentCarouselIndex) {
                        ForEach(0..<carouselItems.count, id: \.self) { index in
                            CarouselCard(item: carouselItems[index])
                                .tag(index)
                        }
                    }
                    .frame(height: 210) // Increased from 200 to 210 (5% bigger)
                    .tabViewStyle(.page(indexDisplayMode: .always))
                    .onAppear {
                        startCarouselTimer()
                    }
                    .onDisappear {
                        stopCarouselTimer()
                    }

                    // Coupon Promo Banner (if authenticated)
                    if authManager.isAuthenticated {
                        NavigationLink(destination: MyCouponsView()) {
                            HStack(spacing: 12) {
                                Image(systemName: "ticket.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(.orange)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("My Coupons")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.primary)
                                    Text("Check your active coupons & discounts")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .foregroundColor(.gray)
                            }
                            .padding()
                            .background(
                                LinearGradient(
                                    colors: [Color.orange.opacity(0.1), Color.orange.opacity(0.05)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(12)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal)
                    }

                // Quick Action Cards (matching Android 2x 50% layout)
                HStack(spacing: 12) {
                    // Order Now Card with image
                    NavigationLink(destination: MenuBrowseView()) {
                        CachedAsyncImage(
                            url: URL(string: "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/order-now-card.webp"),
                            content: { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            },
                            placeholder: {
                                // Fallback
                                VStack(spacing: 12) {
                                    Image(systemName: "cup.and.saucer.fill")
                                        .font(.system(size: 32))
                                        .foregroundColor(.brandPink)

                                    VStack(spacing: 4) {
                                        Text("Order Now")
                                            .font(.headline)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.primary)

                                        Text("Browse menu")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 24)
                                .background(Color(.systemBackground))
                            }
                        )
                        .frame(maxWidth: .infinity)
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
                    }

                    // Refer Friends Card with image
                    NavigationLink(destination: InviteFriendView()) {
                        CachedAsyncImage(
                            url: URL(string: "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/refer-friends-card.webp"),
                            content: { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            },
                            placeholder: {
                                // Fallback
                                VStack(spacing: 12) {
                                    Image(systemName: "heart.fill")
                                        .font(.system(size: 32))
                                        .foregroundColor(.brandPink)

                                    VStack(spacing: 4) {
                                        Text("Refer Friends")
                                            .font(.headline)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.primary)

                                        Text("Share the love")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 24)
                                .background(Color(.systemBackground))
                            }
                        )
                        .frame(maxWidth: .infinity)
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
                    }
                }
                .padding(.horizontal)

                // Promotions Section Title
                HStack {
                    Text("PROMOTIONS")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.brandPink)

                    Spacer()
                }
                .padding(.horizontal)
                .padding(.top, 8)

                // Invite a Friend Card
                InviteFriendCard()
                    .padding(.horizontal)

                // Happy Hour Promotion
                PromotionCard(
                    icon: "clock.fill",
                    iconColor: .brandAccent,
                    title: "Happy Hour Special",
                    description: "$1 off all drinks from 2-4 PM every day. Stop by and save!",
                    price: nil,
                    buttonText: "View Menu",
                    action: {
                        // Navigate to menu
                    }
                )
                .padding(.horizontal)

                // Rewards Section
                if authManager.isAuthenticated {
                    PromotionCard(
                        icon: "gift.fill",
                        iconColor: .brandPink,
                        title: "Your Rewards",
                        description: "You have 100 points. You're 50 points away from a free drink!",
                        price: nil,
                        buttonText: "View Rewards",
                        backgroundColor: Color.brandLight.opacity(0.2),
                        action: {
                            // Navigate to rewards
                        }
                    )
                    .padding(.horizontal)
                } else {
                    PromotionCard(
                        icon: "gift.fill",
                        iconColor: .brandPink,
                        title: "Join Rewards",
                        description: "Earn points with every purchase. Sign up today and get 50 bonus points!",
                        price: nil,
                        buttonText: "Sign In",
                        backgroundColor: Color.brandLight.opacity(0.2),
                        action: {
                            // Navigate to login
                        }
                    )
                    .padding(.horizontal)
                }

                // Menu Highlights Section
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("MENU HIGHLIGHTS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.brandPink)

                        Spacer()

                        NavigationLink(destination: MenuBrowseView()) {
                            HStack(spacing: 4) {
                                Text("View All")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                Image(systemName: "arrow.right")
                                    .font(.caption)
                            }
                            .foregroundColor(.brandPink)
                        }
                    }

                    // Popular Items Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
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
                .background(Color.white)
                .cornerRadius(16)
                .padding(.horizontal)

                    // Bottom Spacing for tab bar
                    Color.clear
                        .frame(height: 100)
                }
                .padding(.top)
            }
            .background(Color.white)
        }
        .navigationTitle("Only Coffee")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func startCarouselTimer() {
        carouselTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { _ in
            withAnimation {
                currentCarouselIndex = (currentCarouselIndex + 1) % carouselItems.count
            }
        }
    }

    private func stopCarouselTimer() {
        carouselTimer?.invalidate()
        carouselTimer = nil
    }
}

// MARK: - Carousel Item Model
struct CarouselItem {
    let title: String
    let description: String
    let imageName: String
    let backgroundColor: Color
}

// MARK: - Carousel Card
struct CarouselCard: View {
    let item: CarouselItem

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Background with gradient
            LinearGradient(
                colors: [item.backgroundColor, item.backgroundColor.opacity(0.7)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Content
            VStack(alignment: .leading, spacing: 8) {
                Text(item.title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)

                Text(item.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            .padding()
        }
        .cornerRadius(16)
        .padding(.horizontal)
    }
}

// MARK: - Quick Action Card
struct QuickActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let destination: AnyView

    var body: some View {
        NavigationLink(destination: destination) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 32))
                    .foregroundColor(.brandPink)

                VStack(spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)

                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 24)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        }
    }
}

// MARK: - Promotion Card
struct PromotionCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    let price: String?
    let buttonText: String
    var backgroundColor: Color = Color(.systemBackground)
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Icon and title
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(iconColor)

                Text(title)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }

            // Description
            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
                .lineLimit(3)

            // Price and button
            HStack {
                if let price = price {
                    Text(price)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.brandPink)
                }

                Spacer()

                Button(action: action) {
                    Text(buttonText)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.brandPink)
                        .cornerRadius(8)
                }
            }
            .padding(.top, 4)
        }
        .padding()
        .background(backgroundColor)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Menu Highlight Card
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
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.brandPink.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Welcome Card
struct WelcomeCard: View {
    var body: some View {
        NavigationLink(destination: LoginView()) {
            CachedAsyncImage(
                url: URL(string: "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/welcome-card.webp"),
                content: { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                },
                placeholder: {
                    // Fallback to original design
                    VStack(spacing: 16) {
                        Spacer()

                        Image(systemName: "cup.and.saucer.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.brandPink)

                        Text("Welcome")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.brandPink)

                        Text("No lines. No waiting.")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.brandPink)
                            .multilineTextAlignment(.center)

                        Spacer()
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.systemBackground))
                }
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
    }
}

// MARK: - Invite Friend Card
struct InviteFriendCard: View {
    var body: some View {
        NavigationLink(destination: InviteFriendView()) {
            CachedAsyncImage(
                url: URL(string: "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/share-drink-promo.webp"),
                content: { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                },
                placeholder: {
                    // Fallback
                    ZStack {
                        LinearGradient(
                            colors: [Color.brandPink.opacity(0.2), Color.brandAccent.opacity(0.2)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )

                        VStack(spacing: 12) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.brandPink)

                            Text("FREE DRINK")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)

                            Text("Share the Love")
                                .font(.headline)
                                .foregroundColor(.brandPink)

                            Text("Invite friends and earn free drinks")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                    }
                }
            )
            .frame(height: 200)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        }
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
