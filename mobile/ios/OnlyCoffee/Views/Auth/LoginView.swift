import SwiftUI

/// Main login/signup screen - now uses phone authentication
/// This view wraps PhoneAuthView for backward compatibility
struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        NavigationStack {
            PhoneAuthView()
                .environmentObject(authManager)
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
            .environmentObject(AuthenticationManager.shared)
    }
}
