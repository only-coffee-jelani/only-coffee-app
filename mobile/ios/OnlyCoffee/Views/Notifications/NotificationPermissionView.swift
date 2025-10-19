import SwiftUI

struct NotificationPermissionView: View {
    @StateObject private var notificationManager = PushNotificationManager.shared
    @Environment(\.dismiss) var dismiss
    @State private var isRequesting = false

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Icon
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.1))
                    .frame(width: 120, height: 120)

                Image(systemName: "bell.badge.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.orange)
            }

            // Content
            VStack(spacing: 12) {
                Text("Stay Updated")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Get notified when:")
                    .font(.headline)
                    .foregroundColor(.secondary)

                VStack(alignment: .leading, spacing: 12) {
                    NotificationBenefit(
                        icon: "ticket.fill",
                        text: "Your coupons are about to expire"
                    )

                    NotificationBenefit(
                        icon: "gift.fill",
                        text: "You receive new rewards"
                    )

                    NotificationBenefit(
                        icon: "cup.and.saucer.fill",
                        text: "Your order is ready for pickup"
                    )

                    NotificationBenefit(
                        icon: "star.fill",
                        text: "Exclusive deals are available"
                    )
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
            }
            .padding(.horizontal)

            Spacer()

            // Buttons
            VStack(spacing: 12) {
                Button(action: {
                    requestPermission()
                }) {
                    Group {
                        if isRequesting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Enable Notifications")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isRequesting)

                Button(action: {
                    dismiss()
                }) {
                    Text("Maybe Later")
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 8)
            }
            .padding(.horizontal)
            .padding(.bottom, 32)
        }
        .onAppear {
            // Check current status
            notificationManager.checkAuthorizationStatus()
        }
    }

    private func requestPermission() {
        isRequesting = true

        Task {
            let granted = await notificationManager.requestAuthorization()

            await MainActor.run {
                isRequesting = false

                if granted {
                    // Success - dismiss the view
                    dismiss()
                } else {
                    // Show alert to go to settings
                    showSettingsAlert()
                }
            }
        }
    }

    private func showSettingsAlert() {
        // TODO: Show alert with option to open Settings
    }
}

struct NotificationBenefit: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.orange)
                .frame(width: 24)

            Text(text)
                .font(.subheadline)
                .foregroundColor(.primary)

            Spacer()
        }
    }
}

struct NotificationPermissionView_Previews: PreviewProvider {
    static var previews: some View {
        NotificationPermissionView()
    }
}
