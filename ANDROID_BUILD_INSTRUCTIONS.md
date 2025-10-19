# Android App Build Instructions

## Changes Made

I've updated the Android app to properly fetch and display the splash screen from the backend API. Here's what was changed:

### 1. **Created Hilt Network Module** (`android/app/src/main/java/com/onlycoffee/app/di/NetworkModule.kt`)
- Provides Retrofit instance configured with the API base URL
- Provides OkHttpClient with logging and timeouts
- Provides SplashScreenApi interface for dependency injection

### 2. **Updated MainActivity** (`android/app/src/main/java/com/onlycoffee/app/MainActivity.kt`)
- Added `@Inject` annotation to inject `SplashScreenRepository`
- Updated `OnlyCoffeeApp()` composable to accept the injected repository
- Added logging to debug splash screen fetching
- Properly passes the repository to the app initialization

## How to Build

### Option 1: Using Android Studio (Recommended)
1. Open Android Studio
2. Open the project: `C:\Users\sayalew\practice\only-coffee-app\android`
3. Click **Build** → **Make Project**
4. Once built, click **Run** → **Run 'app'**
5. Select the running emulator (Medium_Phone_API_36.0)

### Option 2: Using Command Line (Requires Java)
```bash
cd android
./gradlew.bat installDebug
```

## Testing the Splash Screen

Once the app is built and running on the emulator:

1. **Create a splash screen** via the admin dashboard:
   - Go to `http://localhost:5173/admin/splash-screen`
   - Fill in the form with:
     - Title: "Test Splash"
     - Description: "This is a test"
     - Upload an image
     - Set duration (e.g., 5 seconds)
     - Click "Create Splash Screen"

2. **Launch the Android app** on the emulator

3. **Verify the splash screen appears**:
   - The splash image should display on app startup
   - A "Skip X" button should appear in the top-right corner
   - The countdown should match the duration from the database
   - After the duration expires, the app should proceed to the home screen

## API Endpoint

The app fetches from: `GET http://localhost:3000/api/v1/splash-screen/current`

Current active splash screen:
- **Title**: "Testing"
- **Duration**: 6 seconds
- **Image**: S3 URL (https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/...)

## Debugging

If the splash screen doesn't appear:

1. **Check logcat** in Android Studio:
   - Look for "SplashScreen" tag
   - Check for any error messages

2. **Verify API connectivity**:
   - Test the endpoint: `curl http://localhost:3000/api/v1/splash-screen/current`
   - Should return JSON with splash screen data

3. **Check emulator network**:
   - Emulator should be able to reach `localhost:3000`
   - May need to use `10.0.2.2` instead of `localhost` on Android emulator

## Files Modified

- `android/app/src/main/java/com/onlycoffee/app/MainActivity.kt`
- `android/app/src/main/java/com/onlycoffee/app/di/NetworkModule.kt` (NEW)

## Next Steps

1. Build the app using Android Studio
2. Run it on the emulator
3. Verify the splash screen displays with the correct image and duration
4. Test the skip button and countdown timer

