import SwiftUI

struct InviteFriendView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var showTermsModal = false
    @State private var showShareSheet = false
    @State private var successfulInvites = 0

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Scrollable Content
                ScrollView {
                    VStack(spacing: 0) {
                        // Top Banner (5% of screen)
                        HStack {
                            Button(action: {
                                presentationMode.wrappedValue.dismiss()
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "chevron.left")
                                        .font(.system(size: 18, weight: .semibold))
                                    Text("Back")
                                        .font(.body)
                                }
                                .foregroundColor(.brandPink)
                            }

                            Spacer()

                            Text("Only Friends Share Coffee")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.brandPink)

                            Spacer()

                            // Invisible placeholder for centering
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 18, weight: .semibold))
                                Text("Back")
                                    .font(.body)
                            }
                            .opacity(0)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 12)
                        .frame(height: geometry.size.height * 0.05)
                        .background(Color.white)

                        // Hero Image (55% of screen)
                        AsyncImage(url: URL(string: "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/invite-hero-placeholder.webp")) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            case .failure(_), .empty:
                                // Placeholder
                                ZStack {
                                    Color.brandLight.opacity(0.2)
                                    VStack(spacing: 12) {
                                        Image(systemName: "person.2.fill")
                                            .font(.system(size: 60))
                                            .foregroundColor(.brandPink)
                                        Text("Invite Friends")
                                            .font(.title2)
                                            .fontWeight(.bold)
                                            .foregroundColor(.brandPink)
                                        Text("Share the love of coffee")
                                            .font(.subheadline)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            @unknown default:
                                Color.brandLight.opacity(0.2)
                            }
                        }
                        .frame(height: geometry.size.height * 0.55)
                        .clipped()

                        // Rewards Card (20% of screen)
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Rewards")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)

                            HStack(spacing: 16) {
                                // Reward Image Placeholder
                                AsyncImage(url: URL(string: "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/free-drink-reward.webp")) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fit)
                                    case .failure(_), .empty:
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 12)
                                                .fill(Color.brandPink.opacity(0.1))
                                            Image(systemName: "cup.and.saucer.fill")
                                                .font(.system(size: 32))
                                                .foregroundColor(.brandPink)
                                        }
                                    @unknown default:
                                        Color.brandLight.opacity(0.2)
                                    }
                                }
                                .frame(width: 80, height: 80)
                                .cornerRadius(12)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Free Drink")
                                        .font(.headline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.primary)

                                    Text("When your friend makes their first purchase")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                        .lineLimit(2)
                                }
                            }
                        }
                        .padding()
                        .frame(minHeight: geometry.size.height * 0.20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.brandPink.opacity(0.05))
                        .cornerRadius(16)
                        .padding(.horizontal)
                        .padding(.top, 16)

                        // Invitation Record Card (20% of screen)
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Invitation Record")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)

                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Successful Invites")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)

                                    Text("\(successfulInvites)")
                                        .font(.system(size: 36, weight: .bold))
                                        .foregroundColor(.brandPink)
                                }

                                Spacer()

                                Image(systemName: "person.3.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.brandPink.opacity(0.3))
                            }
                        }
                        .padding()
                        .frame(minHeight: geometry.size.height * 0.20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.white)
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.brandPink.opacity(0.2), lineWidth: 1)
                        )
                        .padding(.horizontal)
                        .padding(.top, 12)

                        // How It Works Card
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("How It Works")
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primary)

                                Spacer()

                                Button(action: {
                                    showTermsModal = true
                                }) {
                                    Text("Learn More")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.brandPink)
                                }
                            }

                            VStack(alignment: .leading, spacing: 8) {
                                HowItWorksStep(number: 1, text: "Share your unique invite link with friends")
                                HowItWorksStep(number: 2, text: "Your friend signs up and makes their first purchase")
                                HowItWorksStep(number: 3, text: "You both get a free drink!")
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.white)
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.brandPink.opacity(0.2), lineWidth: 1)
                        )
                        .padding(.horizontal)
                        .padding(.top, 12)

                        // Bottom padding for button
                        Color.clear
                            .frame(height: 100)
                    }
                }

                // Pinned Bottom Button
                VStack {
                    Spacer()

                    Button(action: {
                        showShareSheet = true
                    }) {
                        Text("Share to Friends")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.brandPink)
                            .cornerRadius(25)
                    }
                    .padding(.horizontal, 32)
                    .padding(.bottom, 32)
                    .background(
                        LinearGradient(
                            colors: [Color.clear, Color.white.opacity(0.9), Color.white],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 120)
                    )
                }
            }
            .background(Color.white)
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showTermsModal) {
            TermsAndConditionsModal()
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [generateInviteLink()])
        }
    }

    private func generateInviteLink() -> String {
        // TODO: Generate unique link based on user ID
        let userId = "user123" // Replace with actual user ID
        return "onlycoffee://invite?code=\(userId)"
    }
}

// MARK: - How It Works Step
struct HowItWorksStep: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.brandPink)
                    .frame(width: 28, height: 28)

                Text("\(number)")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }

            Text(text)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Terms and Conditions Modal
struct TermsAndConditionsModal: View {
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Terms and Conditions")
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.bottom, 8)

                    Text("""
                    1. Eligibility
                    The referral program is open to all registered Only Coffee users in good standing.

                    2. Earning Rewards
                    You will receive one (1) free drink credit when a friend you refer makes their first purchase of $5 or more. Your friend will also receive one (1) free drink credit upon completing their first purchase.

                    3. Free Drink Redemption
                    Free drink credits are valid for beverages up to $8 in value. Credits expire 90 days after issuance and cannot be combined with other offers.

                    4. Program Terms
                    Only Coffee reserves the right to modify or terminate the referral program at any time. Fraudulent activity, including creating fake accounts or self-referrals, will result in forfeiture of rewards and possible account suspension.

                    5. Limitations
                    Free drink credits have no cash value and are non-transferable. Limit of 10 referral rewards per calendar year per user.

                    6. Privacy
                    By participating, you agree that Only Coffee may contact you regarding the referral program and special offers.

                    For questions, contact support@onlycoffee.com

                    Last updated: October 2025
                    """)
                    .font(.body)
                    .foregroundColor(.secondary)
                }
                .padding()
            }
            .background(Color.white)
            .navigationBarHidden(true)
        }
        .overlay(
            VStack {
                Spacer()

                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Close")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.brandPink)
                        .cornerRadius(25)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 32)
            }
        )
    }
}

// MARK: - Share Sheet
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

struct InviteFriendView_Previews: PreviewProvider {
    static var previews: some View {
        InviteFriendView()
    }
}
