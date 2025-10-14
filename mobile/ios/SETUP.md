# Only Coffee iOS - Setup Guide

## 🚀 Quick Start

### Prerequisites
- macOS 13.0+
- Xcode 15.0+
- Backend API running at `http://localhost:3000`

### Opening the Project

1. **Navigate to iOS directory**
   ```bash
   cd mobile/ios
   ```

2. **Open in Xcode**
   ```bash
   open OnlyCoffee.xcodeproj
   ```

   Or double-click `OnlyCoffee.xcodeproj` in Finder

### First Time Setup

#### 1. Configure Signing
- Select the project in Xcode navigator
- Select "OnlyCoffee" target
- Go to "Signing & Capabilities" tab
- Select your **Team** from dropdown
- Xcode will automatically generate a provisioning profile

#### 2. Update Bundle Identifier (Optional)
If you get signing errors:
- Change Bundle Identifier from `com.onlycoffee.app` to something unique
- Example: `com.yourname.onlycoffee`

#### 3. Build the Project
- Select a simulator (iPhone 15 Pro recommended)
- Press **⌘R** or click the Play button
- Wait for dependencies to download (Stripe SDK)

### Project Structure

```
OnlyCoffee/
├── OnlyCoffeeApp.swift          # App entry point
├── ContentView.swift             # Root view
├── Info.plist                   # Configuration
├── Assets.xcassets/             # Images and colors
├── Models/                      # Data models (7 files)
├── Managers/                    # Business logic (3 files)
├── Networking/                  # API client (2 files)
└── Views/                       # UI screens (15+ files)
    ├── Auth/
    ├── Stores/
    ├── Menu/
    ├── Cart/
    ├── Orders/
    ├── Rewards/
    └── Profile/
```

## 🔧 Configuration

### API Endpoint
The app connects to `http://localhost:3000/api/v1` by default.

To change:
1. Open `Networking/APIClient.swift`
2. Update the `baseURL` property:
   ```swift
   private let baseURL = "https://your-api-domain.com/api/v1"
   ```

### Location Permissions
Already configured in `Info.plist`:
- NSLocationWhenInUseUsageDescription
- NSLocationAlwaysAndWhenInUseUsageDescription

### App Transport Security
Configured to allow `localhost` HTTP connections for development.
**Production**: Remove this exception and use HTTPS only.

## 🐛 Troubleshooting

### Build Errors

**"No such module 'StripePaymentSheet'"**
- Solution: File > Packages > Reset Package Caches
- Then: Product > Clean Build Folder (⇧⌘K)
- Rebuild

**"Team not found"**
- Solution: Add Apple Developer account in Xcode
- Xcode > Settings > Accounts > Add Apple ID

**"Signing certificate not found"**
- Solution: Select "Automatically manage signing"
- Xcode will create a development certificate

### Runtime Errors

**"Location services not available"**
- Simulator: Features > Location > Apple
- Device: Settings > Privacy > Location Services > OnlyCoffee

**"Network request failed"**
- Ensure backend is running: `cd backend && npm run start:dev`
- Check API is accessible: `curl http://localhost:3000/api/v1/health`

**"Login failed"**
- Verify backend is running
- Check console logs in Xcode for detailed error
- Try creating a new account

## 📱 Running on Device

1. Connect iPhone via USB
2. Select your device in Xcode
3. Ensure device is unlocked
4. Trust developer certificate (Settings > General > VPN & Device Management)
5. Build and run

## 🧪 Testing

### Test User
Create via the signup flow or backend:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test Flow
1. Sign up / Log in
2. Grant location permission
3. Browse nearby stores
4. Select a store
5. Add items to cart
6. Proceed to checkout
7. Place order (payment integration pending)

## 🎨 Customization

### App Colors
Edit `Assets.xcassets/AccentColor.colorset/Contents.json`

### App Icon
1. Design 1024x1024 icon
2. Drag to `Assets.xcassets/AppIcon.appiconset`

### Launch Screen
Configured to show brown gradient background

## 📦 Dependencies

### Swift Package Manager
- **Stripe iOS SDK** (v23.0.0)
  - For payment processing
  - Apple Pay integration ready

To update:
- File > Packages > Update to Latest Package Versions

## 🚀 Next Steps

### Phase 1: Complete Payment Integration
1. Get Stripe publishable key
2. Initialize Stripe in `OnlyCoffeeApp.swift`
3. Implement payment sheet in `CheckoutView`
4. Test Apple Pay on device

### Phase 2: Enhanced Features
- Push notifications setup
- Deep linking
- iMessage extension
- Offline support

### Phase 3: Production
- Update API endpoint to production
- Remove localhost HTTP exception
- Configure release signing
- Submit to App Store Connect

## 📚 Resources

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Stripe iOS SDK](https://stripe.com/docs/payments/accept-a-payment?platform=ios)
- [MapKit Guide](https://developer.apple.com/documentation/mapkit)
- [Backend API Docs](../../backend/README.md)

## 💡 Tips

### Xcode Shortcuts
- **⌘B** - Build
- **⌘R** - Run
- **⌘.** - Stop
- **⇧⌘K** - Clean Build Folder
- **⌘0** - Toggle Navigator
- **⌥⌘0** - Toggle Inspector

### Debug Console
- View logs in Console (⇧⌘Y)
- All `print()` statements appear here
- Network errors logged with details

### SwiftUI Previews
Most views have preview code at bottom:
```swift
struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
    }
}
```
Press ⌥⌘↩ to show preview canvas

## 🆘 Support

Issues? Check:
1. Backend is running
2. Dependencies are installed
3. Signing is configured
4. Location permission granted
5. Console logs for errors

---

**Version**: 1.0.0
**Last Updated**: 2025-01-10
