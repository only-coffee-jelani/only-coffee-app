# Only Coffee - Android App

## 📱 Overview

Enterprise-level Android mobile application for Only Coffee, built with modern Android development practices and achieving **75% production readiness** with iOS feature parity.

**Build Status**: ✅ **BUILD SUCCESSFUL** (42 tasks, 0 errors)  
**Architecture**: MVVM + Hilt DI  
**UI Framework**: Jetpack Compose + Material 3  
**Language**: Kotlin  
**Min SDK**: 28 (Android 9)  
**Target SDK**: 34 (Android 14)

---

## 🏗️ Architecture

### **MVVM Pattern**
- **Model**: Data classes and API services
- **View**: Jetpack Compose UI components
- **ViewModel**: StateFlow-based state management

### **Dependency Injection**
- Hilt (Dagger) for compile-time DI
- Singleton services and repositories
- Scoped ViewModels

### **Networking**
- Retrofit 2 for REST API calls
- OkHttp 4 with logging interceptor
- Gson for JSON serialization
- Automatic JWT token injection

### **Security**
- EncryptedSharedPreferences for token storage
- AES256_GCM encryption
- Secure keystore integration

---

## ✅ Implemented Features

### **1. Authentication** ✅
- Email/password login and registration
- JWT token management with automatic refresh
- Encrypted secure storage
- Global authentication state
- Sign-out functionality

**Files**:
- `managers/AuthenticationManager.kt`
- `managers/SecureStorageManager.kt`
- `ui/screens/auth/LoginScreen.kt`
- `ui/screens/auth/SignupScreen.kt`
- `ui/screens/auth/AuthViewModel.kt`

### **2. Home Screen** ✅
- Featured menu items
- Nearby stores display
- Quick order buttons
- User greeting with loyalty points
- API integration with fallback to sample data

**Files**:
- `ui/screens/home/HomeScreen.kt`
- `ui/screens/home/HomeViewModel.kt`

### **3. Menu Screen** ✅
- Category filtering (All, Vienna Classics, Specialty, Pastries, etc.)
- Search functionality
- Menu item cards with images and prices
- Store selection integration
- API integration with fallback to sample data

**Files**:
- `ui/screens/menu/MenuScreen.kt`
- `ui/screens/menu/MenuViewModel.kt`

### **4. Orders Screen** ✅
- Order history list
- Order cards with status chips
- Reorder functionality
- Empty state for no orders
- Authenticated/unauthenticated states

**Files**:
- `ui/screens/orders/OrdersScreenUpdated.kt`
- `ui/screens/orders/OrdersScreenViewModel.kt`

### **5. Rewards Screen** ✅
- Loyalty tier display with gradient badge
- Points display and formatting
- "How it Works" section
- Tier benefits list (Bronze → Black)
- Authenticated/unauthenticated states

**Files**:
- `ui/screens/rewards/RewardsScreen.kt`

### **6. Profile Screen** ✅
- User profile header with avatar and tier badge
- Settings sections (Account, Coupons, Payment, Addresses, Notifications, Privacy)
- Sign-out button
- Authenticated/unauthenticated states

**Files**:
- `ui/screens/profile/ProfileScreen.kt`

### **7. Location Selection** ✅
- Store list with search
- Location permissions handling
- Distance calculation
- Favorite stores functionality
- API integration with fallback to sample data

**Files**:
- `ui/screens/locations/SelectLocationScreen.kt`
- `ui/screens/locations/LocationViewModel.kt`

---

## 🔌 API Integration

### **Base URL**
```
http://10.0.2.2:3000/api/v1
```
(Emulator localhost mapping to host machine)

### **API Services**

#### **AuthApiService**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `GET /users/me` - Get current user

#### **MenuApiService**
- `GET /menu-items` - Get all menu items
- `GET /menu-items/{id}` - Get menu item by ID
- `GET /menu-items/featured` - Get featured items
- `GET /menu-items/popular` - Get popular items

#### **StoreApiService**
- `GET /stores` - Get all stores
- `GET /stores/{id}` - Get store by ID
- `GET /stores/nearby` - Get nearby stores (lat, lng, radius)
- `GET /stores/search` - Search stores

#### **OrderApiService**
- `GET /orders/my-orders` - Get user's orders
- `GET /orders/{id}` - Get order by ID
- `POST /orders` - Create new order
- `PATCH /orders/{id}/cancel` - Cancel order
- `POST /orders/{id}/reorder` - Reorder previous order

#### **CouponsApiService**
- `GET /coupons/my-coupons` - Get user's coupons
- `POST /coupons/redeem` - Redeem promo code

#### **LoyaltyApiService**
- `GET /loyalty/dashboard` - Get loyalty dashboard
- `GET /loyalty/history` - Get points history

---

## 🚀 Getting Started

### **Prerequisites**
- Android Studio Hedgehog (2023.1.1) or later
- JDK 17 or later
- Android SDK 34
- Gradle 8.13

### **Setup**
1. Clone the repository
2. Open the `android` folder in Android Studio
3. Sync Gradle files
4. Run the app on an emulator or device

### **Build Commands**
```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Run tests
./gradlew test

# Clean build
./gradlew clean assembleDebug
```

---

## 📦 Dependencies

### **Core**
- Kotlin 1.9.0
- Jetpack Compose 1.5.4
- Material 3

### **Architecture**
- Hilt 2.48
- Lifecycle ViewModel 2.6.2
- Navigation Compose 2.7.5

### **Networking**
- Retrofit 2.9.0
- OkHttp 4.12.0
- Gson 2.10.1

### **Security**
- Security Crypto 1.1.0-alpha06

### **Image Loading**
- Coil 2.5.0

### **Maps**
- Google Maps Compose 4.3.0
- Google Play Services Maps 18.2.0

---

## 📁 Project Structure

```
android/
├── app/
│   ├── src/main/java/com/onlycoffee/app/
│   │   ├── data/
│   │   │   ├── api/          # Retrofit API services
│   │   │   ├── model/        # Data models
│   │   │   └── repository/   # Repository pattern
│   │   ├── di/               # Dependency injection modules
│   │   ├── managers/         # Singleton managers (Auth, Storage)
│   │   ├── ui/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── navigation/   # Navigation setup
│   │   │   ├── screens/      # Screen composables
│   │   │   └── theme/        # Material 3 theme
│   │   └── utils/            # Utility classes
│   └── build.gradle.kts
├── gradle/
├── gradlew
├── gradlew.bat
├── README.md
└── PRODUCTION_READINESS_STATUS.md
```

---

## 🎨 Design System

### **Brand Colors**
- **Primary**: #ff93a3 (Coral Pink)
- **Background**: #FFFFFF
- **Surface**: #F5F5F5
- **Text Primary**: #1A1A1A
- **Text Secondary**: #666666

### **Typography**
- **Font Family**: Inter
- **Heading**: Bold, 24sp
- **Body**: Regular, 16sp
- **Caption**: Regular, 12sp

### **Spacing**
- **xs**: 4dp
- **sm**: 8dp
- **md**: 16dp
- **lg**: 24dp
- **xl**: 32dp

---

## 📝 Next Steps

See `PRODUCTION_READINESS_STATUS.md` for detailed status and roadmap.

### **Priority 1: Complete API Integration**
- Remove all sample data fallbacks
- Add proper error handling
- Implement retry logic

### **Priority 2: Advanced Features**
- Personalized offers
- Event tracking
- Push notifications
- Geofencing

### **Priority 3: Polish**
- Loading states and animations
- Offline support with Room database
- Comprehensive testing

---

## 📄 License

Proprietary - Only Coffee Inc.

