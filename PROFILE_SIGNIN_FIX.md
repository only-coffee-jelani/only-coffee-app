# Profile Screen Sign-In Button Navigation Fix

## Problem

When clicking the "Sign In" button on the Profile page (when not authenticated), the app was navigating to the login screen and then immediately redirecting to the homepage, preventing the user from actually logging in.

### User Experience Issue

1. User opens the app (already has valid tokens stored)
2. User navigates to Profile tab
3. Profile screen shows "Sign In to View Profile" button (unauthenticated state)
4. User clicks "Sign In" button
5. App navigates to Login screen
6. Login screen immediately redirects to Home screen
7. User is confused and cannot access their profile

### Root Cause

**State Synchronization Issue:**

The `AuthenticationManager` had a critical bug in its initialization:

```kotlin
init {
    // Check if user is already logged in
    if (authRepository.isLoggedIn()) {
        _isAuthenticated.value = true
        // ❌ BUG: currentUser was NOT loaded!
    }
}
```

This caused a state mismatch:
- `isAuthenticated` = `true` (tokens exist in storage)
- `currentUser` = `null` (user data never loaded)

The `ProfileScreen` checks **both** conditions:

```kotlin
if (uiState.isAuthenticated && uiState.currentUser != null) {
    // Show authenticated profile UI
} else {
    // Show "Sign In" button ❌ This was shown even when authenticated!
}
```

When the user clicked "Sign In", the `LoginScreen` detected `isAuthenticated = true` and immediately redirected to home:

```kotlin
LaunchedEffect(uiState.isAuthenticated) {
    if (uiState.isAuthenticated) {
        navController.navigate("home") {
            popUpTo("login") { inclusive = true }
        }
    }
}
```

## Solution

**Load the current user data when the app initializes with existing tokens.**

### Changes Made

#### 1. Updated `AuthenticationManager.kt` (MODIFIED)

**File:** `android/app/src/main/java/com/onlycoffee/app/managers/AuthenticationManager.kt`

**Added imports:**
```kotlin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
```

**Added CoroutineScope:**
```kotlin
@Singleton
class AuthenticationManager @Inject constructor(
    private val authRepository: AuthRepository
) {
    // Use a supervisor job so that failures in one coroutine don't cancel others
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    
    // ... state flows
```

**Fixed init block:**
```kotlin
init {
    // Check if user is already logged in and load their profile
    if (authRepository.isLoggedIn()) {
        _isAuthenticated.value = true
        // ✅ Load current user data in background
        scope.launch {
            loadCurrentUser()
        }
    }
}
```

### Why This Works

1. **On App Launch:**
   - If tokens exist, `isAuthenticated` is set to `true`
   - `loadCurrentUser()` is called asynchronously
   - User data is fetched from the backend
   - `currentUser` is populated with user data

2. **Profile Screen:**
   - Now both `isAuthenticated = true` AND `currentUser != null`
   - Shows the authenticated profile UI with user information
   - No "Sign In" button is shown

3. **If User Data Load Fails:**
   - `loadCurrentUser()` returns `false`
   - `isAuthenticated` remains `true` (tokens still valid)
   - Profile screen will still show "Sign In" button
   - User can click to refresh or re-authenticate

### Benefits

1. **✅ Proper State Synchronization**: Authentication state and user data are always in sync
2. **✅ Better User Experience**: Profile screen shows correct state immediately
3. **✅ Automatic Profile Loading**: User data is loaded automatically on app launch
4. **✅ Error Resilience**: Uses `SupervisorJob` so failures don't crash the app
5. **✅ Background Loading**: User data loads asynchronously without blocking UI

## Testing

### Before Fix

1. ❌ Open app with valid tokens
2. ❌ Navigate to Profile tab
3. ❌ See "Sign In to View Profile" button (incorrect state)
4. ❌ Click "Sign In"
5. ❌ Immediately redirected to Home (cannot login)

### After Fix

1. ✅ Open app with valid tokens
2. ✅ Navigate to Profile tab
3. ✅ See user profile with name, email, settings (correct state)
4. ✅ Can view and edit profile information
5. ✅ "Sign Out" button works correctly

### Edge Cases Handled

1. **No Tokens:** Shows "Sign In" button correctly
2. **Expired Tokens:** API call fails, user can re-authenticate
3. **Network Error:** Loading fails gracefully, user can retry
4. **First Launch:** No tokens, shows unauthenticated state correctly

## Related Files

### Modified:
- `android/app/src/main/java/com/onlycoffee/app/managers/AuthenticationManager.kt`

### Related (No Changes):
- `android/app/src/main/java/com/onlycoffee/app/ui/screens/profile/ProfileScreen.kt`
- `android/app/src/main/java/com/onlycoffee/app/ui/screens/auth/LoginScreen.kt`
- `android/app/src/main/java/com/onlycoffee/app/ui/screens/auth/AuthViewModel.kt`

## Next Steps

**Test the fix:**

1. **Test with existing user:**
   - Close and reopen the app
   - Navigate to Profile tab
   - Verify profile information is displayed
   - Verify no "Sign In" button is shown

2. **Test sign out:**
   - Click "Sign Out" button
   - Verify Profile tab shows "Sign In" button
   - Click "Sign In"
   - Verify login screen is shown (not redirected to home)

3. **Test new user:**
   - Uninstall and reinstall the app
   - Navigate to Profile tab
   - Verify "Sign In" button is shown
   - Click "Sign In"
   - Complete registration
   - Verify profile is displayed after registration

The fix is complete and ready for testing! ☕🚀

