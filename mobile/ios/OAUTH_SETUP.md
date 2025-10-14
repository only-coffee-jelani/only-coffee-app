# OAuth Setup Guide for Only Coffee iOS App

## Overview
The iOS app now supports OAuth authentication with:
- Apple Sign In (native)
- Google Sign In
- Facebook Sign In

## What Was Fixed

### 1. API Connection Issues
- **Problem**: App couldn't connect to backend (`localhost:3000`)
- **Solution**:
  - Added conditional URL handling for simulator vs real device
  - iOS Simulator uses `http://localhost:3000/api/v1`
  - Real devices use `http://192.168.1.100:3000/api/v1` (update with your actual IP)
  - Added `NSAllowsLocalNetworking` to Info.plist to allow local network connections

### 2. OAuth Integration
- Added `OAuthManager.swift` to handle all OAuth flows
- Integrated with `AuthenticationManager` for seamless authentication
- Added OAuth buttons to `LoginView.swift`
- Configured URL schemes in Info.plist for OAuth callbacks

## Backend Requirements

Your backend needs to implement the following OAuth endpoints:

### 1. Apple Sign In
```
POST /api/v1/auth/oauth/apple
Body: {
  "idToken": "string",
  "nonce": "string",
  "firstName": "string" (optional),
  "lastName": "string" (optional),
  "email": "string" (optional)
}
Response: {
  "user": User object,
  "tokens": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

### 2. Google Sign In
```
GET /api/v1/auth/oauth/google/url
Response: {
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}

POST /api/v1/auth/oauth/callback
Body: {
  "code": "string",
  "provider": "google"
}
Response: {
  "user": User object,
  "tokens": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

### 3. Facebook Sign In
```
GET /api/v1/auth/oauth/facebook/url
Response: {
  "url": "https://www.facebook.com/v12.0/dialog/oauth?..."
}

POST /api/v1/auth/oauth/callback
Body: {
  "code": "string",
  "provider": "facebook"
}
Response: {
  "user": User object,
  "tokens": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

## Configuration Steps

### 1. Update API Base URL (for real devices)
Edit `mobile/ios/OnlyCoffee/Networking/APIClient.swift`:
```swift
#else
// Replace with your actual backend URL
private let baseURL = "http://YOUR-LOCAL-IP:3000/api/v1"
#endif
```

To find your local IP:
- macOS: System Settings > Network > (Your Connection) > Details > TCP/IP
- Or run: `ipconfig getifaddr en0` in Terminal

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sign In API
4. Create OAuth 2.0 credentials:
   - Application type: iOS
   - Bundle ID: `com.onlycoffee.app`
5. Copy the Client ID
6. Update Info.plist:
   ```xml
   <string>com.googleusercontent.apps.YOUR-CLIENT-ID</string>
   ```

7. Update backend with:
   - Client ID
   - Client Secret
   - Redirect URI: `onlycoffee://oauth/callback`

### 3. Configure Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add Facebook Login product
4. Configure OAuth settings:
   - Bundle ID: `com.onlycoffee.app`
   - Redirect URI: `onlycoffee://oauth/callback`
5. Update backend with:
   - App ID
   - App Secret

### 4. Configure Apple Sign In

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Select your App ID
3. Enable "Sign in with Apple" capability
4. In Xcode:
   - Select project > Signing & Capabilities
   - Click "+ Capability"
   - Add "Sign in with Apple"

5. Backend setup:
   - Create a Service ID in Apple Developer Portal
   - Generate a private key for Sign in with Apple
   - Configure your backend to verify Apple ID tokens

## Testing

### 1. Start Backend
```bash
cd backend/services/gateway
npm run start:dev
```

### 2. Build and Run iOS App
```bash
cd mobile/ios
xcodebuild -project OnlyCoffee.xcodeproj -scheme OnlyCoffee -configuration Debug -sdk iphonesimulator
```

Or open in Xcode:
```bash
open OnlyCoffee.xcodeproj
```

### 3. Test Email/Password Login
1. Ensure backend is running on port 3000
2. Try creating an account with email/password
3. Check backend logs for incoming requests

### 4. Test OAuth Flows
1. Click "Continue with Apple" - should open Apple Sign In dialog
2. Click "Continue with Google" - should open browser for Google OAuth
3. Click "Continue with Facebook" - should open browser for Facebook OAuth

## Troubleshooting

### "Network error: Could not connect to server"
- Check backend is running: `curl http://localhost:3000/api/v1/auth/login`
- For real device: Update IP address in APIClient.swift
- Check Info.plist has `NSAllowsLocalNetworking = true`

### OAuth Redirects Not Working
- Verify URL scheme in Info.plist matches backend redirect URIs
- Check OAuth provider console for correct redirect URIs
- Make sure callback endpoint is implemented in backend

### Apple Sign In Not Showing
- Check "Sign in with Apple" capability is enabled in Xcode
- Verify App ID has Sign in with Apple enabled in Apple Developer Portal
- Make sure you're testing on iOS 13+ device/simulator

### Build Errors
- Clean build folder: Cmd+Shift+K in Xcode
- Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Run: `xcodebuild clean`

## Security Notes

1. **HTTPS in Production**: The current setup uses HTTP for local development. In production:
   - Use HTTPS for all API calls
   - Remove `NSAllowsLocalNetworking` from Info.plist
   - Remove localhost exception domains

2. **Token Storage**: Tokens are stored in iOS Keychain (handled by KeychainManager)

3. **OAuth Secrets**: Never commit OAuth secrets to version control

## File Changes Summary

### New Files
- `mobile/ios/OnlyCoffee/Managers/OAuthManager.swift` - OAuth authentication handler

### Modified Files
- `mobile/ios/OnlyCoffee/Networking/APIClient.swift` - Added conditional URL handling
- `mobile/ios/OnlyCoffee/Managers/AuthenticationManager.swift` - Integrated OAuth manager
- `mobile/ios/OnlyCoffee/Views/Auth/LoginView.swift` - Added OAuth buttons
- `mobile/ios/OnlyCoffee/Info.plist` - Added OAuth URL schemes and network permissions
- `mobile/ios/OnlyCoffee.xcodeproj/project.pbxproj` - Added OAuthManager to build

## Next Steps

1. Implement OAuth endpoints in backend (NestJS)
2. Configure OAuth providers (Google, Facebook, Apple)
3. Update API base URL for production deployment
4. Test on real devices
5. Add error handling and retry logic
6. Implement token refresh mechanism
7. Add OAuth account linking for existing users
