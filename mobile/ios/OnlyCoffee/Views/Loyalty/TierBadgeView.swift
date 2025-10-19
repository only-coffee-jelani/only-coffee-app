import SwiftUI

struct TierBadgeView: View {
    let tier: UserTier
    let size: CGFloat

    var body: some View {
        VStack(spacing: 4) {
            // Tier icon/badge
            ZStack {
                Circle()
                    .fill(tierGradient)
                    .frame(width: size, height: size)

                Image(systemName: tierIcon)
                    .font(.system(size: size * 0.5, weight: .bold))
                    .foregroundColor(.white)
            }

            Text(tier.displayName)
                .font(.system(size: size * 0.2, weight: .semibold))
                .foregroundColor(.primary)
        }
    }

    private var tierGradient: LinearGradient {
        switch tier {
        case .bronze:
            return LinearGradient(
                colors: [Color(red: 0.8, green: 0.5, blue: 0.2), Color(red: 0.6, green: 0.3, blue: 0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .silver:
            return LinearGradient(
                colors: [Color(red: 0.75, green: 0.75, blue: 0.75), Color(red: 0.5, green: 0.5, blue: 0.5)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .gold:
            return LinearGradient(
                colors: [Color(red: 1.0, green: 0.84, blue: 0.0), Color(red: 0.85, green: 0.65, blue: 0.13)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .platinum:
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.95, blue: 1.0), Color(red: 0.6, green: 0.7, blue: 0.9)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .black:
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.2, blue: 0.2), Color.black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private var tierIcon: String {
        switch tier {
        case .bronze:
            return "shield.fill"
        case .silver:
            return "star.fill"
        case .gold:
            return "crown.fill"
        case .platinum:
            return "diamond.fill"
        case .black:
            return "sparkles"
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        TierBadgeView(tier: .bronze, size: 80)
        TierBadgeView(tier: .silver, size: 80)
        TierBadgeView(tier: .gold, size: 80)
        TierBadgeView(tier: .platinum, size: 80)
        TierBadgeView(tier: .black, size: 80)
    }
    .padding()
}
