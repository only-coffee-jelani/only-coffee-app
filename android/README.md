# Only Coffee Android App

A modern, native Android application for the Only Coffee brand, built with Jetpack Compose and following Material Design 3 principles while maintaining the brand's unique coffee-inspired aesthetic.

## Features

### Core Functionality
- **Store Discovery**: Find nearby coffee stores, trucks, and kiosks with 4 real Only Coffee locations
- **Menu Browsing**: View-only menu with all Only Coffee items and consistent coffee cup branding
- **Store-First Ordering**: Orders must be placed through the Orders tab after selecting a store
- **Real Store Locations**: French Quarter, Warehouse District, Metairie, and Baton Rouge locations
- **Consistent Branding**: All menu items use the coffee_cup.png image for unified visual experience
- **Clean UI**: Coral pink theme with professional, modern design
- **Responsive Design**: Optimized for various Android screen sizes
- **Offline Menu**: Menu items stored locally for fast browsing

### Design System
- **Material Design 3**: Modern Android design language with custom theming
- **Coral Pink Brand Colors**: Coral pink (#FF93A3) primary, white backgrounds, black text
- **Typography**: Inter font family with consistent text hierarchy
- **Spacing**: 8dp grid system for consistent layouts
- **Components**: Reusable UI components following Android design guidelines

## Technical Stack

### Frameworks & Libraries
- **Jetpack Compose**: Modern declarative UI toolkit
- **Material Design 3**: Latest Material Design components
- **Hilt**: Dependency injection framework
- **Navigation Compose**: Type-safe navigation
- **ViewModel & LiveData**: MVVM architecture components
- **Room**: Local database for offline support
- **Retrofit**: HTTP client for API communication
- **Coil**: Image loading library
- **Coroutines**: Asynchronous programming

### Architecture
- **MVVM Pattern**: Model-View-ViewModel architecture
- **Repository Pattern**: Data layer abstraction
- **Use Cases**: Business logic encapsulation
- **Dependency Injection**: Hilt for clean architecture
- **Reactive Programming**: StateFlow and Compose state management

### Requirements
- **Android**: API 28+ (Android 9.0)
- **Kotlin**: 1.9.23
- **Gradle**: 8.2.1
- **Compile SDK**: 34

## Project Structure

```
app/src/main/java/com/onlycoffee/app/
├── MainActivity.kt                  # Main activity
├── OnlyCoffeeApplication.kt        # Application class
├── data/                           # Data layer
│   ├── model/                     # Data models
│   │   ├── MenuItem.kt           # Menu item model
│   │   └── Store.kt              # Store model
│   ├── repository/               # Repository implementations
│   ├── local/                    # Room database
│   └── remote/                   # API services
├── domain/                        # Domain layer
│   ├── usecase/                  # Business logic
│   └── repository/               # Repository interfaces
├── ui/                           # Presentation layer
│   ├── theme/                    # Design system
│   │   ├── Color.kt             # Color palette
│   │   ├── Typography.kt        # Font styles
│   │   ├── Dimensions.kt        # Spacing & sizes
│   │   └── Theme.kt             # Material theme
│   ├── components/               # Reusable components
│   │   ├── StoreCard.kt         # Store display cards
│   │   ├── MenuItemCard.kt      # Menu item cards
│   │   └── QuickActionCard.kt   # Action buttons
│   ├── screens/                  # Screen composables
│   │   ├── home/                # Home screen
│   │   ├── menu/                # Menu browsing
│   │   ├── orders/              # Order history
│   │   ├── rewards/             # Loyalty program
│   │   └── profile/             # User profile
│   └── navigation/               # Navigation setup
└── di/                           # Dependency injection modules
```

## Getting Started

### Prerequisites
1. Android Studio Hedgehog (2023.1.1) or later
2. Android SDK with API 28+
3. Kotlin 1.9.23+
4. Java 8+

### Installation
1. Clone the repository
2. Open the `android` folder in Android Studio
3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your actual configuration values
4. Sync project with Gradle files
5. Run the app on device or emulator

### Environment Configuration

The app uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

#### Required Variables
- `API_BASE_URL`: Base URL for the Only Coffee API
- `API_KEY`: Your API key for authentication
- `CLIENT_ID`: OAuth client ID
- `CLIENT_SECRET`: OAuth client secret

#### Optional Services
- `GOOGLE_MAPS_API_KEY`: For store locator functionality
- `STRIPE_PUBLISHABLE_KEY`: For payment processing
- `FIREBASE_PROJECT_ID`: For Firebase services
- `ONESIGNAL_APP_ID`: For push notifications

#### Feature Flags
- `ENABLE_LOYALTY_PROGRAM`: Enable/disable loyalty features
- `ENABLE_PUSH_NOTIFICATIONS`: Enable/disable push notifications
- `ENABLE_LOCATION_SERVICES`: Enable/disable location-based features

**Important**: Never commit the `.env` file to version control. It's included in `.gitignore`.

### Dependencies
Dependencies are managed through Gradle and will be automatically resolved when building the project.

## Design Guidelines

### Color Usage
- **Primary Brand**: Coral pink (#FF93A3) for main actions and branding
- **Secondary**: White (#FFFFFF) for backgrounds and secondary elements
- **Text**: Black (#000000) for primary text and content
- **Background**: Clean white backgrounds for modern, professional look

### Component Guidelines
- Use Material Design 3 components with custom theming
- Apply consistent spacing using the `Spacing` object
- Follow semantic color naming from the design system
- Use `CardDefaults` for consistent card styling

### Accessibility
- Support TalkBack screen reader
- Provide meaningful content descriptions
- Ensure sufficient color contrast (WCAG AA)
- Support large text sizes
- Keyboard navigation support

## API Integration

The app is designed to integrate with the Only Coffee backend API:

### Endpoints
- **Authentication**: User login/registration with JWT tokens
- **Stores**: Location discovery with geolocation
- **Menu**: Items, categories, modifiers, and availability
- **Orders**: Placement, tracking, and history
- **Loyalty**: Points balance and rewards redemption
- **Payments**: Stripe integration for secure transactions

### Data Flow
1. Repository pattern for data abstraction
2. Use cases for business logic
3. ViewModels for UI state management
4. Compose for reactive UI updates

## Testing

### Unit Tests
- ViewModel logic testing
- Repository and use case testing
- Model validation and business rules
- API response parsing

### UI Tests
- Compose UI testing with semantics
- Critical user flows (ordering, checkout)
- Accessibility compliance testing
- Cross-device compatibility

### Integration Tests
- End-to-end user scenarios
- API integration testing
- Database operations
- Navigation flow testing

## Build & Deployment

### Build Variants
- **Debug**: Development build with logging
- **Release**: Production build with ProGuard/R8

### Signing
- Debug builds use debug keystore
- Release builds require production keystore
- Configure signing in `build.gradle.kts`

### Play Store Preparation
1. Generate signed APK/AAB
2. Configure app metadata and screenshots
3. Set up Play Console
4. Submit for review following Play policies

## Performance

### Optimization
- Lazy loading for lists and images
- Image caching with Coil
- Database queries optimization
- Memory leak prevention
- Battery usage optimization

### Monitoring
- Crashlytics for crash reporting
- Performance monitoring
- ANR (Application Not Responding) tracking
- Custom analytics events

## Contributing

### Code Style
- Follow Kotlin coding conventions
- Use ktlint for code formatting
- Write descriptive commit messages
- Include unit tests for new features

### Pull Request Process
1. Create feature branch from develop
2. Implement changes with tests
3. Update documentation as needed
4. Submit pull request for review

## Security

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all API communications
- Secure token storage with EncryptedSharedPreferences
- Implement certificate pinning

### Privacy
- Request minimal permissions
- Clear privacy policy implementation
- User consent for data collection
- GDPR compliance considerations

## License

This project is proprietary to Only Coffee. All rights reserved.

## Support

For technical issues or questions:
- Email: dev@only-coffee.us
- Internal Slack: #android-development

## Roadmap

### Phase 1 (Current)
- ✅ Core UI components and design system
- ✅ Basic navigation and user flows
- 🔄 API integration and data models

### Phase 2 (Next)
- [ ] Real-time order tracking with WebSocket
- [ ] Push notifications with FCM
- [ ] Offline support with Room database
- [ ] Advanced customization options
- [ ] Google Pay integration

### Phase 3 (Future)
- [ ] Wear OS companion app
- [ ] Widget for quick ordering
- [ ] AR menu experiences
- [ ] Social sharing features
- [ ] Voice ordering with Google Assistant

## Performance Benchmarks

### Target Metrics
- App startup time: < 2 seconds
- Screen transition time: < 300ms
- Image loading time: < 1 second
- API response time: < 500ms
- Memory usage: < 100MB average

### Monitoring Tools
- Android Profiler for performance analysis
- Firebase Performance Monitoring
- Custom metrics for business KPIs
