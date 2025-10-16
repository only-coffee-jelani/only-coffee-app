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
            // Full-screen promotional image
            AsyncImage(url: URL(string: promotion.imageUrl)) { phase in
                switch phase {
                case .empty:
                    ZStack {
                        Color.black
                        ProgressView()
                            .tint(.white)
                    }
                    .ignoresSafeArea()
                case .success(let image):
                    GeometryReader { geometry in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .clipped()
                    }
                    .ignoresSafeArea()
                case .failure(let error):
                    ZStack {
                        Color.red.opacity(0.3)
                        VStack {
                            Image(systemName: "photo")
                                .font(.system(size: 60))
                                .foregroundColor(.white)
                            Text("Failed to load image")
                                .foregroundColor(.white)
                            Text("\(error.localizedDescription)")
                                .font(.caption)
                                .foregroundColor(.white)
                        }
                    }
                    .ignoresSafeArea()
                @unknown default:
                    Color.black
                        .ignoresSafeArea()
                }
            }
            .onTapGesture {
                // Navigate to menu item if targetMenuItemId exists
                if let menuItemId = promotion.targetMenuItemId {
                    onNavigateToMenuItem(menuItemId)
                    dismiss()
                }
            }

            // Skip button in top right
            VStack {
                HStack {
                    Spacer()

                    Button(action: {
                        dismiss()
                    }) {
                        Text("Skip \(timeRemaining)")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.black)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(Color.white.opacity(0.9))
                            .clipShape(Capsule())
                            .shadow(radius: 4)
                    }
                    .padding(16)
                }

                Spacer()
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
