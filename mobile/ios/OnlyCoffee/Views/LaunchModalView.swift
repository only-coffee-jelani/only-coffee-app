import SwiftUI

struct LaunchModalView: View {
    let promotion: Promotion
    let onDismiss: () -> Void
    let onNavigateToMenuItem: (String) -> Void

    @State private var timeRemaining: Int = 3

    init(promotion: Promotion, onDismiss: @escaping () -> Void, onNavigateToMenuItem: @escaping (String) -> Void) {
        self.promotion = promotion
        self.onDismiss = onDismiss
        self.onNavigateToMenuItem = onNavigateToMenuItem
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
                            dismiss()
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
            startCountdown()
        }
    }

    private func startCountdown() {
        // Wait 1 second before starting countdown (shows "Skip 3" for 1 second)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            // Start countdown timer
            Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
                if timeRemaining > 0 {
                    timeRemaining -= 1
                } else {
                    timer.invalidate()
                    dismiss()
                }
            }
        }
    }

    private func dismiss() {
        onDismiss()
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
