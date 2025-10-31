import SwiftUI
import AppTrackingTransparency

struct PrivacySettingsView: View {
    @StateObject private var privacyManager = PrivacyManager.shared
    @Environment(\.dismiss) private var dismiss

    @State private var showDataExportConfirmation = false
    @State private var showDataDeletionConfirmation = false
    @State private var showDataDeletionAlert = false
    @State private var deletionReason = ""
    @State private var isProcessing = false
    @State private var alertMessage = ""
    @State private var showAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Image(systemName: "hand.raised.fill")
                                .font(.system(size: 20))
                                .foregroundColor(Color(hex: "ff93a3"))
                            Text("Your Privacy Matters")
                                .font(.system(size: 20, weight: .bold))
                        }

                        Text("Control how your data is used and manage your privacy preferences.")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                            .lineSpacing(3)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(hex: "ff93a3").opacity(0.08))
                    )

                    // App Tracking Transparency Section
                    VStack(alignment: .leading, spacing: 16) {
                        SectionHeader(
                            icon: "chart.bar.xaxis",
                            title: "App Tracking",
                            subtitle: "iOS App Tracking Transparency"
                        )

                        VStack(spacing: 0) {
                            TrackingStatusRow(status: privacyManager.trackingAuthorizationStatus)

                            if privacyManager.trackingAuthorizationStatus == .notDetermined {
                                Divider()
                                    .padding(.leading, 16)

                                Button(action: {
                                    Task {
                                        await privacyManager.requestTrackingAuthorization()
                                    }
                                }) {
                                    HStack {
                                        Text("Request Permission")
                                            .font(.system(size: 15, weight: .medium))
                                            .foregroundColor(Color(hex: "ff93a3"))

                                        Spacer()

                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 14))
                                            .foregroundColor(.gray)
                                    }
                                    .padding(16)
                                }
                            }
                        }
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                    }

                    // Privacy Controls Section
                    VStack(alignment: .leading, spacing: 16) {
                        SectionHeader(
                            icon: "slider.horizontal.3",
                            title: "Privacy Controls",
                            subtitle: "Choose what data we can collect"
                        )

                        VStack(spacing: 0) {
                            PrivacyToggleRow(
                                icon: "chart.line.uptrend.xyaxis",
                                title: "Analytics",
                                description: "Help us improve the app by sharing usage data",
                                isOn: $privacyManager.analyticsEnabled,
                                action: { enabled in
                                    privacyManager.setAnalyticsEnabled(enabled)
                                }
                            )

                            Divider()
                                .padding(.leading, 56)

                            PrivacyToggleRow(
                                icon: "sparkles",
                                title: "Personalization",
                                description: "Receive personalized offers and recommendations",
                                isOn: $privacyManager.personalizationEnabled,
                                action: { enabled in
                                    privacyManager.setPersonalizationEnabled(enabled)
                                }
                            )

                            Divider()
                                .padding(.leading, 56)

                            PrivacyToggleRow(
                                icon: "location.fill",
                                title: "Location Tracking",
                                description: "Get location-based offers when near stores",
                                isOn: $privacyManager.locationTrackingEnabled,
                                action: { enabled in
                                    privacyManager.setLocationTrackingEnabled(enabled)
                                }
                            )

                            Divider()
                                .padding(.leading, 56)

                            PrivacyToggleRow(
                                icon: "bell.fill",
                                title: "Push Notifications",
                                description: "Receive notifications about special offers",
                                isOn: $privacyManager.pushNotificationsEnabled,
                                action: { enabled in
                                    privacyManager.setPushNotificationsEnabled(enabled)
                                }
                            )
                        }
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                    }

                    // Data Rights Section (GDPR/CCPA)
                    VStack(alignment: .leading, spacing: 16) {
                        SectionHeader(
                            icon: "doc.text.fill",
                            title: "Your Data Rights",
                            subtitle: "GDPR & CCPA compliance"
                        )

                        VStack(spacing: 0) {
                            DataRightsButton(
                                icon: "arrow.down.doc",
                                title: "Export My Data",
                                description: "Download a copy of all your data",
                                action: {
                                    showDataExportConfirmation = true
                                }
                            )

                            Divider()
                                .padding(.leading, 56)

                            DataRightsButton(
                                icon: "trash",
                                title: "Delete My Account",
                                description: "Permanently delete your account and data",
                                isDestructive: true,
                                action: {
                                    showDataDeletionAlert = true
                                }
                            )
                        }
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                    }

                    // Legal Links
                    VStack(alignment: .leading, spacing: 12) {
                        LegalLinkButton(
                            title: "Privacy Policy",
                            icon: "doc.plaintext"
                        )

                        LegalLinkButton(
                            title: "Terms of Service",
                            icon: "doc.text"
                        )

                        LegalLinkButton(
                            title: "Cookie Policy",
                            icon: "list.bullet.rectangle"
                        )
                    }
                }
                .padding(16)
            }
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("Privacy & Data")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Text("Done")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Color(hex: "ff93a3"))
                    }
                }
            }
            .confirmationDialog(
                "Export Your Data",
                isPresented: $showDataExportConfirmation,
                titleVisibility: .visible
            ) {
                Button("Request Export") {
                    handleDataExport()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("We'll prepare a copy of all your data and send you a download link via email. This may take up to 48 hours.")
            }
            .alert("Delete Account", isPresented: $showDataDeletionAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    showDataDeletionConfirmation = true
                }
            } message: {
                Text("Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted within 30 days.")
            }
            .sheet(isPresented: $showDataDeletionConfirmation) {
                DataDeletionConfirmationView(
                    reason: $deletionReason,
                    onConfirm: {
                        handleDataDeletion()
                    },
                    onCancel: {
                        showDataDeletionConfirmation = false
                    }
                )
            }
            .alert("Privacy Request", isPresented: $showAlert) {
                Button("OK") {}
            } message: {
                Text(alertMessage)
            }
            .overlay {
                if isProcessing {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                        .overlay {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(1.5)
                        }
                }
            }
        }
    }

    // MARK: - Actions

    private func handleDataExport() {
        isProcessing = true

        Task {
            do {
                let response = try await privacyManager.requestDataExport()

                await MainActor.run {
                    isProcessing = false
                    alertMessage = response.message
                    showAlert = true
                }
            } catch {
                await MainActor.run {
                    isProcessing = false
                    alertMessage = "Failed to request data export. Please try again later."
                    showAlert = true
                }
            }
        }
    }

    private func handleDataDeletion() {
        isProcessing = true
        showDataDeletionConfirmation = false

        Task {
            do {
                let response = try await privacyManager.requestDataDeletion(reason: deletionReason.isEmpty ? nil : deletionReason)

                await MainActor.run {
                    isProcessing = false
                    alertMessage = response.message
                    showAlert = true

                    // Clear local data
                    privacyManager.clearLocalData()

                    // Log out user
                    AuthenticationManager.shared.logout()

                    // Dismiss view
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        dismiss()
                    }
                }
            } catch {
                await MainActor.run {
                    isProcessing = false
                    alertMessage = "Failed to delete account. Please try again later."
                    showAlert = true
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct SectionHeader: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(Color(hex: "ff93a3"))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.black)

                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct TrackingStatusRow: View {
    let status: ATTrackingManager.AuthorizationStatus

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: statusIcon)
                .font(.system(size: 20))
                .foregroundColor(statusColor)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                Text("Tracking Status")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.black)

                Text(statusText)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(statusLabel)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(statusColor)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    Capsule()
                        .fill(statusColor.opacity(0.15))
                )
        }
        .padding(16)
    }

    private var statusIcon: String {
        switch status {
        case .authorized: return "checkmark.shield.fill"
        case .denied: return "xmark.shield.fill"
        case .restricted: return "exclamationmark.shield.fill"
        case .notDetermined: return "questionmark.circle.fill"
        @unknown default: return "questionmark.circle"
        }
    }

    private var statusLabel: String {
        switch status {
        case .authorized: return "Authorized"
        case .denied: return "Denied"
        case .restricted: return "Restricted"
        case .notDetermined: return "Not Set"
        @unknown default: return "Unknown"
        }
    }

    private var statusColor: Color {
        switch status {
        case .authorized: return .green
        case .denied: return .red
        case .restricted: return .orange
        case .notDetermined: return .gray
        @unknown default: return .gray
        }
    }

    private var statusText: String {
        switch status {
        case .authorized:
            return "You've allowed app tracking for personalized experiences"
        case .denied:
            return "You've denied app tracking. Limited personalization available."
        case .restricted:
            return "Tracking is restricted by system settings"
        case .notDetermined:
            return "You haven't responded to the tracking request yet"
        @unknown default:
            return "Unknown status"
        }
    }
}

struct PrivacyToggleRow: View {
    let icon: String
    let title: String
    let description: String
    @Binding var isOn: Bool
    let action: (Bool) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(Color(hex: "ff93a3"))
                .frame(width: 24)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.black)

                Text(description)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .lineSpacing(2)
            }

            Spacer()

            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(Color(hex: "ff93a3"))
                .onChange(of: isOn) { newValue in
                    action(newValue)
                }
        }
        .padding(16)
    }
}

struct DataRightsButton: View {
    let icon: String
    let title: String
    let description: String
    var isDestructive: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(isDestructive ? .red : Color(hex: "ff93a3"))
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(isDestructive ? .red : .black)

                    Text(description)
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                        .lineSpacing(2)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
            .padding(16)
        }
    }
}

struct LegalLinkButton: View {
    let title: String
    let icon: String

    var body: some View {
        Button(action: {
            // Open legal document
            // In production, this would open a web view or PDF
        }) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(Color(hex: "ff93a3"))
                    .frame(width: 24)

                Text(title)
                    .font(.system(size: 15))
                    .foregroundColor(.black)

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
            }
            .padding(14)
        }
        .background(Color.white)
        .cornerRadius(10)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 1)
    }
}

struct DataDeletionConfirmationView: View {
    @Binding var reason: String
    let onConfirm: () -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Warning header
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.red)

                    Text("Delete Account")
                        .font(.system(size: 24, weight: .bold))

                    Text("This action is permanent and cannot be undone. Your account and all data will be deleted within 30 days.")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                }
                .padding(.top, 32)

                // Reason input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Reason (Optional)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)

                    TextEditor(text: $reason)
                        .frame(height: 100)
                        .padding(8)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                }
                .padding(.horizontal)

                Spacer()

                // Action buttons
                VStack(spacing: 12) {
                    Button(action: onConfirm) {
                        Text("Delete My Account")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.red)
                            )
                    }

                    Button(action: onCancel) {
                        Text("Cancel")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
