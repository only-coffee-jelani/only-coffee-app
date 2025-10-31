import SwiftUI

struct LaunchModalView: View {
    let promotion: Promotion
    let onDismiss: () -> Void
    let onNavigateToMenuItem: (String) -> Void

    @State private var timeRemaining: Int
    @State private var hasRecordedImpression = false

    init(promotion: Promotion, onDismiss: @escaping () -> Void, onNavigateToMenuItem: @escaping (String) -> Void) {
        self.promotion = promotion
        self.onDismiss = onDismiss
        self.onNavigateToMenuItem = onNavigateToMenuItem
        // Initialize timeRemaining with the duration from the database
        _timeRemaining = State(initialValue: promotion.displayDuration)
    }

    var body: some View {
        ZStack {
            // Pink background matching the image
            Color(red: 0.96, green: 0.73, blue: 0.75)
                .ignoresSafeArea()

            // Full-screen promotional image with caching (scaled to 95%)
            CachedAsyncImage(
                url: URL(string: promotion.imageUrl),
                content: { image in
                    GeometryReader { geometry in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: geometry.size.width * 0.95, height: geometry.size.height * 0.95)
                            .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    }
                    .ignoresSafeArea()
                },
                placeholder: {
                    ZStack {
                        Color(red: 0.96, green: 0.73, blue: 0.75)
                        ProgressView()
                            .tint(.white)
                    }
                    .ignoresSafeArea()
                }
            )
            .onTapGesture {
                // Record click before navigating
                recordClick()

                // Navigate to menu item if targetMenuItemId exists
                if let menuItemId = promotion.targetMenuItemId {
                    onNavigateToMenuItem(menuItemId)
                    dismiss()
                }
            }

            // Skip button in top right
            GeometryReader { geometry in
                VStack {
                    HStack {
                        Spacer()

                        Button(action: {
                            // Record skip before dismissing
                            recordSkip()
                            dismiss(isSkip: true)
                        }) {
                            Text("Skip \(timeRemaining)s")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.black)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(Color.white.opacity(0.9))
                                .clipShape(Capsule())
                                .shadow(radius: 4)
                        }
                        .padding(.horizontal, 16)
                        .offset(y: 0)
                    }

                    Spacer()
                }
            }
        }
        .onAppear {
            print("🎬 LaunchModalView appeared")
            print("🖼️ Loading image: \(promotion.imageUrl)")
            print("⏱️ Display duration: \(promotion.displayDuration) seconds")
            recordImpression()
            startCountdown()
        }
    }

    private func startCountdown() {
        // Wait 1 second before starting countdown
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            // Start countdown timer
            Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
                if timeRemaining > 0 {
                    timeRemaining -= 1
                } else {
                    timer.invalidate()
                    // Auto-dismiss without recording skip (user watched the full duration)
                    dismiss(isSkip: false)
                }
            }
        }
    }

    private func dismiss(isSkip: Bool = false) {
        onDismiss()
    }

    // MARK: - Analytics Tracking

    private func recordImpression() {
        guard !hasRecordedImpression else { return }
        hasRecordedImpression = true

        Task {
            do {
                let _: [String: Bool] = try await APIClient.shared.request(
                    endpoint: "/splash-screen/\(promotion.id)/impression",
                    method: .post,
                    requiresAuth: false
                )
                print("✅ Recorded splash screen impression")
            } catch {
                print("❌ Failed to record impression: \(error)")
            }
        }
    }

    private func recordClick() {
        Task {
            do {
                let _: [String: Bool] = try await APIClient.shared.request(
                    endpoint: "/splash-screen/\(promotion.id)/click",
                    method: .post,
                    requiresAuth: false
                )
                print("✅ Recorded splash screen click")
            } catch {
                print("❌ Failed to record click: \(error)")
            }
        }
    }

    private func recordSkip() {
        Task {
            do {
                let _: [String: Bool] = try await APIClient.shared.request(
                    endpoint: "/splash-screen/\(promotion.id)/skip",
                    method: .post,
                    requiresAuth: false
                )
                print("✅ Recorded splash screen skip")
            } catch {
                print("❌ Failed to record skip: \(error)")
            }
        }
    }
}

#Preview {
    LaunchModalView(
        promotion: Promotion(
            id: "1",
            title: "Fall Special",
            description: "New Waffolino drink",
            promotionType: .launchModal,
            imageUrl: "https://via.placeholder.com/800x1200",
            targetMenuItemId: "menu-item-1",
            targetUrl: nil,
            startDate: Date(),
            endDate: Date().addingTimeInterval(30 * 24 * 60 * 60),
            isActive: true,
            displayDuration: 3,
            sortOrder: 0,
            createdAt: Date(),
            updatedAt: Date()
        ),
        onDismiss: {},
        onNavigateToMenuItem: { _ in }
    )
}
