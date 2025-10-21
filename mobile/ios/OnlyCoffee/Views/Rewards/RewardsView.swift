import SwiftUI

struct RewardsView: View {
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    if let user = authManager.currentUser {
                        // Tier badge
                        VStack(spacing: 12) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 60))
                                .foregroundColor(Color(user.loyaltyTier.color))

                            Text(user.loyaltyTier.displayName)
                                .font(.title.bold())

                            Text("\(user.loyaltyPoints) points")
                                .font(.title2)
                                .foregroundColor(.orange)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(32)
                        .background(
                            LinearGradient(
                                colors: [Color(user.loyaltyTier.color).opacity(0.2), Color(user.loyaltyTier.color).opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .cornerRadius(16)

                        // Points info
                        VStack(alignment: .leading, spacing: 16) {
                            Text("How it Works")
                                .font(.headline)

                            InfoRow(icon: "dollarsign.circle.fill", text: "Earn 10 points per $1 spent")
                            InfoRow(icon: "cup.and.saucer.fill", text: "Redeem 500 points for $6 off")
                            InfoRow(icon: "star.circle.fill", text: "Unlock rewards with higher tiers")
                        }
                        .padding()
                        .background(Color.gray.opacity(0.05))
                        .cornerRadius(12)

                        // Tier benefits
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Tier Benefits")
                                .font(.headline)

                            ForEach(LoyaltyTier.allCases, id: \.self) { tier in
                                HStack {
                                    Image(systemName: tier == user.loyaltyTier ? "checkmark.circle.fill" : "circle")
                                        .foregroundColor(tier == user.loyaltyTier ? .orange : .gray)
                                    Text(tier.displayName)
                                        .font(.subheadline)
                                    Spacer()
                                    Text("\(tier.pointsRequired)+ pts")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding()
                        .background(Color.gray.opacity(0.05))
                        .cornerRadius(12)
                    } else {
                        // Not logged in - show sign in prompt
                        VStack(spacing: 20) {
                            Spacer()

                            Image(systemName: "star.circle.fill")
                                .font(.system(size: 80))
                                .foregroundColor(.brandPink)

                            VStack(spacing: 8) {
                                Text("Sign In to View Rewards")
                                    .font(.title2.bold())
                                Text("Access your loyalty points, tier benefits, and exclusive rewards")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal)
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
                    }
                }
                .padding()
            }
            .navigationTitle("Rewards")
        }
    }
}

struct InfoRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.orange)
                .frame(width: 24)
            Text(text)
                .font(.subheadline)
        }
    }
}

struct RewardsView_Previews: PreviewProvider {
    static var previews: some View {
        RewardsView()
            .environmentObject(AuthenticationManager.shared)
    }
}
