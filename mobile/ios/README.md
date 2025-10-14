# Only Coffee - iOS App

A modern iOS application for ordering coffee built with SwiftUI and following MVVM architecture.

## 📱 Features

### ✅ Implemented
- **Authentication** - Login, signup, JWT token management with Keychain storage
- **Store Discovery** - MapKit integration with nearby store search
- **Menu Browsing** - Browse menu items by category with modifiers
- **Shopping Cart** - Add items, manage quantities, calculate totals
- **Checkout** - Place orders with ASAP or scheduled pickup
- **Order Tracking** - View order history and status
- **Rewards Program** - View loyalty points and tier status
- **User Profile** - View and manage account settings

## 🏗️ Architecture

### MVVM Pattern
- **Models** - Data structures matching backend API
- **Views** - SwiftUI views with declarative UI
- **ViewModels** - Business logic and state management with `@ObservableObject`

### Key Components
- `AuthenticationManager` - Centralized auth state and token management
- `CartManager` - Shopping cart logic
- `APIClient` - Type-safe REST API client with Codable
- `KeychainManager` - Secure token storage

## 📁 Project Structure

```
OnlyCoffee/
├── OnlyCoffeeApp.swift          # App entry point
├── ContentView.swift             # Root view with auth routing
├── Models/                       # Data models
│   ├── User.swift
│   ├── Store.swift
│   ├── MenuItem.swift
│   ├── Order.swift
│   ├── CartItem.swift
│   └── Auth.swift
├── Managers/                     # Business logic
│   ├── AuthenticationManager.swift
│   ├── CartManager.swift
│   └── KeychainManager.swift
├── Networking/                   # API layer
│   ├── APIClient.swift
│   └── Endpoints.swift
└── Views/                        # UI components
    ├── Auth/
    │   ├── LoginView.swift
    │   └── SignupView.swift
    ├── Stores/
    │   ├── StoresView.swift
    │   ├── StoreMapView.swift
    │   ├── StoreListView.swift
    │   └── StoreDetailView.swift
    ├── Menu/
    │   ├── MenuView.swift
    │   └── MenuItemDetailView.swift
    ├── Cart/
    │   ├── CartView.swift
    │   └── CheckoutView.swift
    ├── Orders/
    │   └── OrdersView.swift
    ├── Rewards/
    │   └── RewardsView.swift
    ├── Profile/
    │   └── ProfileView.swift
    └── MainTabView.swift
```

## 🚀 Getting Started

### Prerequisites
- macOS 13.0 or later
- Xcode 15.0 or later
- iOS 16.0+ deployment target
- Backend API running at `http://localhost:3000`

### Setup Instructions

1. **Open in Xcode**
   ```bash
   cd mobile/ios
   open OnlyCoffee.xcodeproj
   ```

2. **Configure Signing**
   - Select your Development Team
   - Update Bundle Identifier

3. **Update API Configuration**
   - Edit `APIClient.swift`
   - Update `baseURL` if backend is not on localhost

4. **Add Required Permissions**
   Add to `Info.plist`:
   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>We need your location to find nearby coffee stores</string>
   ```

5. **Run the App**
   - Select target device/simulator
   - Press ⌘R to build and run

## 🔌 API Integration

The app integrates with all 53 backend endpoints:

- **Auth**: Login, register, refresh tokens
- **Users**: Profile management, loyalty info
- **Stores**: Nearby search, store details
- **Menu**: Browse items, calculate prices
- **Orders**: Create, view, cancel orders
- **Payments**: Stripe integration (ready for Apple Pay)
- **Rewards**: Points summary, redemption
- **Gift Cards**: Create, redeem (ready)
- **Reviews**: Create, view reviews (ready)

## 🎨 Design System

### Colors
- Primary: Orange (#FF9500)
- Background: Brown gradient
- Text: Dynamic (Light/Dark mode support)

### Typography
- Headlines: Bold, system font
- Body: Regular, system font
- Captions: Small, secondary color

## 🔐 Security

- JWT tokens stored securely in Keychain
- Automatic token refresh on expiration
- HTTPS required for production
- No credentials stored in UserDefaults

## 📝 Code Quality

### SwiftUI Best Practices
- ✅ Environment objects for shared state
- ✅ @StateObject for view models
- ✅ Async/await for network calls
- ✅ Proper error handling
- ✅ Loading states and error messages

### Testing
- Unit tests: Coming soon
- UI tests: Coming soon

## 🚧 Next Steps

### Phase 1: Payment Integration
- [ ] Stripe SDK integration
- [ ] Apple Pay setup
- [ ] Payment method management
- [ ] Saved cards

### Phase 2: Enhanced Features
- [ ] Push notifications
- [ ] Deep linking
- [ ] iMessage extension for gifting
- [ ] Face ID/Touch ID

### Phase 3: Polish
- [ ] Animations and transitions
- [ ] Loading skeletons
- [ ] Error retry mechanisms
- [ ] Offline support

## 🐛 Known Issues

1. **Location Permission** - Must be granted for store discovery
2. **Simulator Payment** - Stripe requires real device for Apple Pay
3. **Image Loading** - Placeholder images only (no CDN yet)

## 📚 Dependencies

### Native Frameworks
- SwiftUI
- MapKit
- CoreLocation
- Security (Keychain)

### Third-Party (To Add)
- Stripe SDK (for payments)

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Built with ☕ by the Only Coffee team

---

**Version**: 1.0.0
**Target**: iOS 16.0+
**Language**: Swift 5.10
**Framework**: SwiftUI
