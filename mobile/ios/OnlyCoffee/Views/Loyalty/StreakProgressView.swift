import SwiftUI

struct StreakProgressView: View {
    let consecutiveDays: Int
    let longestStreak: Int
    let visitedToday: Bool

    var body: some View {
        VStack(spacing: 16) {
            // Main streak counter
            VStack(spacing: 8) {
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .foregroundColor(.orange)
                        .font(.system(size: 32))

                    Text("\(consecutiveDays)")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.primary)

                    Text("day\(consecutiveDays == 1 ? "" : "s")")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.secondary)
                        .padding(.top, 16)
                }

                Text("Current Streak")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.secondary)
            }

            // Visit status badge
            HStack {
                Image(systemName: visitedToday ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(visitedToday ? .green : .gray)

                Text(visitedToday ? "Visited today!" : "Visit today to keep your streak")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(visitedToday ? .green : .secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(visitedToday ? Color.green.opacity(0.1) : Color.gray.opacity(0.1))
            )

            // Longest streak stat
            if longestStreak > 0 {
                HStack {
                    Image(systemName: "trophy.fill")
                        .foregroundColor(.yellow)

                    Text("Longest: \(longestStreak) day\(longestStreak == 1 ? "" : "s")")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
}

#Preview {
    StreakProgressView(consecutiveDays: 7, longestStreak: 14, visitedToday: true)
        .padding()
}
