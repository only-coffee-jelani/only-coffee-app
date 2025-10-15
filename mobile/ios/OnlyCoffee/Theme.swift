import SwiftUI

// Only Coffee App Theme
extension Color {
    // Primary brand color - pink
    static let brandPink = Color(hex: "ff93a3")

    // Accent colors
    static let brandAccent = Color(hex: "ff7a8f")
    static let brandLight = Color(hex: "ffb3c1")

    // Text colors on pink background
    static let textOnBrand = Color.white

    // Initialize from hex string
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// Header view with logo and profile button
struct BrandHeader: View {
    var body: some View {
        ZStack {
            // Background
            Color.brandPink

            // Centered logo
            HStack {
                Spacer()
                Image("Logo")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 40)
                Spacer()
            }

            // Profile button on the right
            HStack {
                Spacer()
                NavigationLink(destination: ProfileView()) {
                    Image(systemName: "person.circle.fill")
                        .font(.title2)
                        .foregroundColor(.white)
                }
                .padding(.trailing, 16)
            }
        }
        .frame(height: 48)
    }
}
