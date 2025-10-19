import SwiftUI

struct LoyaltyDashboardView: View {
    @StateObject private var viewModel = LoyaltyViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if viewModel.isLoading {
                        ProgressView()
                            .padding(.top, 100)
                    } else if let dashboard = viewModel.dashboard {
                        // Header with tier badge
                        HStack {
                            TierBadgeView(tier: dashboard.tier.currentTier, size: 60)

                            Spacer()

                            VStack(alignment: .trailing, spacing: 4) {
                                Text("\(dashboard.streak.monthlyPoints) pts")
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(.primary)

                                Text("this month")
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()

                        // Streak progress
                        StreakProgressView(
                            consecutiveDays: dashboard.streak.consecutiveDays,
                            longestStreak: dashboard.streak.longestStreak,
                            visitedToday: viewModel.visitedToday
                        )
                        .padding(.horizontal)

                        // Next milestone card
                        if let milestone = dashboard.nextMilestone.nextMilestone,
                           let reward = dashboard.nextMilestone.reward {
                            NextMilestoneCard(
                                currentDay: dashboard.streak.consecutiveDays,
                                milestoneDay: milestone,
                                reward: reward
                            )
                            .padding(.horizontal)
                        }

                        // Streak Saver tokens
                        if dashboard.streakSaverTokens > 0 {
                            StreakSaverTokenCard(tokenCount: dashboard.streakSaverTokens)
                                .padding(.horizontal)
                        }

                        // Tier progress
                        TierProgressCard(tierProgress: dashboard.tier)
                            .padding(.horizontal)

                        // Tier perks
                        if !dashboard.perks.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Your Perks")
                                    .font(.system(size: 20, weight: .bold))
                                    .padding(.horizontal)

                                ForEach(dashboard.perks) { perk in
                                    PerkRow(perk: perk)
                                }
                            }
                            .padding(.top, 10)
                        }

                        // Anniversary info
                        if let nextAnniversary = dashboard.nextAnniversary.nextAnniversaryDate,
                           let year = dashboard.nextAnniversary.nextAnniversaryYear {
                            AnniversaryCard(
                                year: year,
                                date: nextAnniversary,
                                daysUntil: dashboard.nextAnniversary.daysUntilAnniversary ?? 0
                            )
                            .padding(.horizontal)
                        }
                    } else if let errorMessage = viewModel.errorMessage {
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 50))
                                .foregroundColor(.orange)

                            Text("Error Loading Loyalty Data")
                                .font(.headline)

                            Text(errorMessage)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)

                            Button("Retry") {
                                Task {
                                    await viewModel.loadDashboard()
                                }
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        .padding(.top, 100)
                    }
                }
                .padding(.bottom, 30)
            }
            .navigationTitle("Loyalty Rewards")
            .refreshable {
                await viewModel.loadDashboard()
            }
        }
        .task {
            await viewModel.loadDashboard()
        }
    }
}

// MARK: - Next Milestone Card
struct NextMilestoneCard: View {
    let currentDay: Int
    let milestoneDay: Int
    let reward: StreakReward

    var daysRemaining: Int {
        max(0, milestoneDay - currentDay)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Next Reward")
                    .font(.system(size: 16, weight: .semibold))

                Spacer()

                Text("Day \(milestoneDay)")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.orange)
            }

            HStack(spacing: 12) {
                Image(systemName: "gift.fill")
                    .font(.system(size: 30))
                    .foregroundColor(.orange)

                VStack(alignment: .leading, spacing: 4) {
                    Text(reward.label)
                        .font(.system(size: 16, weight: .medium))

                    if let description = reward.description {
                        Text(description)
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()
            }

            // Progress bar
            VStack(alignment: .leading, spacing: 6) {
                Text("\(daysRemaining) day\(daysRemaining == 1 ? "" : "s") to go")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 8)
                            .cornerRadius(4)

                        Rectangle()
                            .fill(Color.orange)
                            .frame(width: geometry.size.width * CGFloat(currentDay) / CGFloat(milestoneDay), height: 8)
                            .cornerRadius(4)
                    }
                }
                .frame(height: 8)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
}

// MARK: - Streak Saver Token Card
struct StreakSaverTokenCard: View {
    let tokenCount: Int

    var body: some View {
        HStack {
            Image(systemName: "shield.lefthalf.filled.badge.checkmark")
                .font(.system(size: 30))
                .foregroundColor(.blue)

            VStack(alignment: .leading, spacing: 4) {
                Text("Streak Saver Tokens")
                    .font(.system(size: 16, weight: .semibold))

                Text("\(tokenCount) available")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
}

// MARK: - Tier Progress Card
struct TierProgressCard: View {
    let tierProgress: TierProgress

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Tier Progress")
                .font(.system(size: 16, weight: .semibold))

            if let nextTier = tierProgress.nextTier {
                HStack(alignment: .top, spacing: 12) {
                    TierBadgeView(tier: tierProgress.currentTier, size: 50)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Next: \(nextTier.displayName)")
                            .font(.system(size: 14, weight: .medium))

                        // Show progress metrics
                        ProgressMetricRow(
                            label: "Monthly Visits",
                            current: tierProgress.progress.monthlyVisits.current,
                            required: tierProgress.progress.monthlyVisits.required
                        )

                        ProgressMetricRow(
                            label: "Tier XP",
                            current: tierProgress.progress.tierXP.current,
                            required: tierProgress.progress.tierXP.required
                        )
                    }
                }
            } else {
                HStack(spacing: 12) {
                    TierBadgeView(tier: tierProgress.currentTier, size: 50)

                    Text("Maximum tier reached!")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
}

// MARK: - Progress Metric Row
struct ProgressMetricRow: View {
    let label: String
    let current: Int
    let required: Int

    var percentage: Double {
        guard required > 0 else { return 0 }
        return min(Double(current) / Double(required), 1.0)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)

                Spacer()

                Text("\(current)/\(required)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.primary)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 4)
                        .cornerRadius(2)

                    Rectangle()
                        .fill(Color.blue)
                        .frame(width: geometry.size.width * percentage, height: 4)
                        .cornerRadius(2)
                }
            }
            .frame(height: 4)
        }
    }
}

// MARK: - Perk Row
struct PerkRow: View {
    let perk: TierPerk

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: perk.iconName ?? "star.fill")
                .font(.system(size: 20))
                .foregroundColor(.blue)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(perk.perkName)
                    .font(.system(size: 14, weight: .medium))

                Text(perk.description)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))
        )
        .padding(.horizontal)
    }
}

// MARK: - Anniversary Card
struct AnniversaryCard: View {
    let year: Int
    let date: Date
    let daysUntil: Int

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "party.popper.fill")
                .font(.system(size: 30))
                .foregroundColor(.purple)

            VStack(alignment: .leading, spacing: 4) {
                Text("\(year) Year Anniversary")
                    .font(.system(size: 16, weight: .semibold))

                Text("In \(daysUntil) day\(daysUntil == 1 ? "" : "s")")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.purple.opacity(0.1))
        )
    }
}

#Preview {
    LoyaltyDashboardView()
}
