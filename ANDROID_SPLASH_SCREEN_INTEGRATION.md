# Android Splash Screen Integration

## Overview
The Android app now fetches splash screen information (image URL and display duration) from the `splash_screens` database table via the backend API, instead of using hardcoded values.

## Changes Made

### 1. **New Data Model** (`SplashScreen.kt`)
- Created a new `SplashScreen` data class that mirrors the database entity
- Includes all fields: `id`, `title`, `description`, `imageUrl`, `displayDuration`, `targetMenuItemId`, `targetUrl`, `isActive`, analytics fields, and tracking fields
- Marked as `@Parcelize` and `@Serializable` for Compose and Retrofit compatibility

### 2. **API Interface** (`SplashScreenApi.kt`)
- Created Retrofit interface for splash screen endpoints
- Single endpoint: `GET /splash-screen/current`
- Public endpoint (no authentication required)
- Returns the currently active splash screen or null

### 3. **Repository Pattern** (`SplashScreenRepository.kt`)
- Implements repository pattern for data access
- Handles API calls and error handling
- Injected with Hilt for dependency injection
- Method: `getCurrentSplashScreen(): SplashScreen?`

### 4. **Updated MainActivity** (`MainActivity.kt`)
- Replaced hardcoded splash screen with API call
- Uses `SplashScreenRepository` to fetch current splash screen
- Fetches on app startup in `LaunchedEffect`
- Gracefully handles API failures (no splash screen shown if API fails)
- Uses `Dispatchers.IO` for network calls

### 5. **Updated LaunchModalScreen** (`LaunchModalScreen.kt`)
- Now accepts both `Promotion` and `SplashScreen` parameters
- Dynamically uses `displayDuration` from the database
- Falls back to `Promotion` if `SplashScreen` is not available
- Countdown timer now uses the actual duration from the database
- Supports navigation to menu items via `targetMenuItemId`

## How It Works

### Flow:
1. **App Startup**: `MainActivity` launches and calls `OnlyCoffeeApp()`
2. **API Call**: `LaunchedEffect` triggers `SplashScreenRepository.getCurrentSplashScreen()`
3. **Fetch Data**: Repository calls `SplashScreenApi.getCurrentSplashScreen()`
4. **Backend Response**: Backend returns the active splash screen from the database
5. **Display**: If splash screen exists, `LaunchModalScreen` displays it with:
   - Image from S3 (via `imageUrl`)
   - Duration from database (via `displayDuration`)
   - Skip button with countdown
   - Auto-dismiss after duration expires

### Example Response:
```json
{
  "id": "79c07f7c-a456-44a2-9a00-d27295ca3182",
  "title": "Fall Special: Waffolino",
  "description": "Try our signature Waffolino - a perfect blend of espresso and waffle flavors",
  "imageUrl": "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/waffolino-launch-v3.webp",
  "displayDuration": 4,
  "targetMenuItemId": null,
  "targetUrl": null,
  "isActive": true,
  "createdAt": "2025-10-18T23:22:09.862Z",
  "updatedAt": "2025-10-18T23:22:09.862Z"
}
```

## Key Features

✅ **Dynamic Duration**: Skip button countdown uses actual duration from database
✅ **S3 Image Support**: Displays images from S3 bucket via URL
✅ **Error Handling**: Gracefully handles API failures
✅ **Dependency Injection**: Uses Hilt for clean architecture
✅ **Backward Compatible**: Still supports `Promotion` model as fallback
✅ **Offline Support**: Uses Coil's image caching for offline viewing
✅ **Analytics Ready**: All analytics fields available for future tracking

## Files Created/Modified

### Created:
- `android/app/src/main/java/com/onlycoffee/app/data/model/SplashScreen.kt`
- `android/app/src/main/java/com/onlycoffee/app/data/api/SplashScreenApi.kt`
- `android/app/src/main/java/com/onlycoffee/app/data/repository/SplashScreenRepository.kt`

### Modified:
- `android/app/src/main/java/com/onlycoffee/app/MainActivity.kt`
- `android/app/src/main/java/com/onlycoffee/app/ui/screens/modal/LaunchModalScreen.kt`

## Testing

To test the integration:

1. **Create a splash screen** via the admin dashboard at `http://localhost:5173/admin/splash-screen`
2. **Set the duration** (e.g., 5 seconds)
3. **Upload an image** to S3
4. **Run the Android app** - the splash screen should appear on startup
5. **Verify the countdown** matches the duration from the database
6. **Check the image** loads from the S3 URL

## Future Enhancements

- Add analytics tracking (impressions, clicks, skips)
- Support multiple splash screens with rotation
- Add caching to reduce API calls
- Implement refresh mechanism for updated splash screens
- Add A/B testing support

