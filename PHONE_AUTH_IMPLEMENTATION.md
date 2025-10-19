# Phone Authentication Implementation

## Summary

Successfully replaced email/password + OAuth authentication with phone-based SMS authentication (Luckin Coffee style).

## What Was Changed

### Backend (NestJS/TypeORM)

#### 1. Database Migration
- **File**: `backend/database/migrations/1729280000000-AddPhoneAuthFields.ts`
- **Changes**:
  - Added `marketing_opt_in` boolean field to users table
  - Added `verification_code` varchar(6) field (hashed)
  - Added `verification_code_expiry` timestamptz field
  - Added index on `verification_code` for faster lookups

#### 2. DTOs Created
- **SendCodeDto**: Phone number + marketing opt-in
- **VerifyCodeDto**: Phone number + 6-digit code
- **CompleteProfileDto**: Optional email, firstName, lastName

#### 3. Twilio SMS Service
- **File**: `backend/services/gateway/src/modules/auth/sms.service.ts`
- **Features**:
  - Send 6-digit verification codes via SMS
  - Send welcome SMS to new users
  - Send marketing SMS (with opt-out)
  - Phone number validation (E.164 format)
  - Development mode: logs codes to console when Twilio not configured

#### 4. Auth Service Methods
- **File**: `backend/services/gateway/src/modules/auth/auth.service.ts`
- **New Methods**:
  - `sendCode()`: Generates 6-digit code, hashes it, stores with 10-min expiry, sends SMS
  - `verifyCode()`: Validates code, creates/logs in user, returns JWT tokens + `isNewUser` flag
  - `completeProfile()`: Updates user with optional email/name after verification

#### 5. Auth Controller Endpoints
- **POST /api/v1/auth/send-code** - Send verification code
- **POST /api/v1/auth/verify-code** - Verify code and authenticate
- **POST /api/v1/auth/complete-profile** - Optional profile completion (requires auth)

#### 6. Environment Variables
Added to `.env.example`:
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_VERIFY_SERVICE_SID=your-verify-service-sid
```

### iOS (Swift/SwiftUI)

#### 1. New Views Created

**PhoneAuthView.swift**
- Phone number entry with country code picker (+1, +44, +86, +91)
- Two checkboxes:
  - "I agree to Terms of Use" (required)
  - "I agree to receive marketing messages" (optional)
- Input validation (min 10 digits, terms must be accepted)
- "Continue" button sends verification code
- Navigates to VerificationCodeView on success

**VerificationCodeView.swift**
- 6-digit code entry with auto-advance between fields
- Auto-submit when all 6 digits entered
- Resend code functionality with 60-second countdown
- "Wrong number?" button to go back
- Navigates to ProfileCompletionView for new users
- Clears code and refocuses on error

**ProfileCompletionView.swift**
- Optional email, first name, last name entry
- "Skip for Now" button
- Email validation (only if provided)
- "Optional" badge at top
- Note: "You can always update this later in profile settings"

#### 2. AuthenticationManager Updates
- **File**: `mobile/ios/OnlyCoffee/Managers/AuthenticationManager.swift`
- **New Methods**:
  - `sendVerificationCode(phone:marketingOptIn:)` - Calls `/auth/send-code`
  - `verifyCode(phone:code:)` - Calls `/auth/verify-code`, saves tokens, returns response with `isNewUser`
  - `completeProfile(email:firstName:lastName:)` - Calls `/auth/complete-profile`
- **Removed**: OAuthManager dependency

#### 3. LoginView Replacement
- **File**: `mobile/ios/OnlyCoffee/Views/Auth/LoginView.swift`
- **Change**: Now simply wraps PhoneAuthView for backward compatibility
- **Removed**: Email/password fields, OAuth buttons (Apple, Google, Facebook)

#### 4. Files Removed
- `OAuthManager.swift` - All OAuth functionality removed

## Authentication Flow

```
1. User opens app → PhoneAuthView
   ↓
2. Enter phone number (+1 555-1234-5678)
   ↓
3. Check "Agree to Terms" (required)
   ↓
4. Optionally check "Receive marketing messages"
   ↓
5. Tap "Continue" → Backend sends 6-digit SMS
   ↓
6. VerificationCodeView → Enter 6-digit code
   ↓
7. Backend verifies code:
   - New user → isNewUser: true → ProfileCompletionView
   - Existing user → isNewUser: false → Main app
   ↓
8. (New users only) ProfileCompletionView
   - Enter email, first name, last name OR skip
   ↓
9. Authenticated → Main app
```

## Security Features

1. **Code Hashing**: Verification codes are hashed with bcrypt before storage
2. **Code Expiry**: Codes expire after 10 minutes
3. **Rate Limiting**: Should be added for production (TODO)
4. **E.164 Phone Format**: Only valid international phone numbers accepted
5. **JWT Tokens**: Access token (15 min) + refresh token (30 days)

## Testing

### Backend Testing (Without Twilio)
When Twilio credentials are not configured, the SMS service will:
- Log verification codes to console instead of sending SMS
- Allow development testing without SMS costs

Example log output:
```
[DEV] Verification code for +12025551234: 123456
```

### iOS Testing
1. Run the app
2. Enter phone number with country code
3. Accept terms checkbox
4. Check console for verification code (if Twilio not configured)
5. Enter code
6. For new users, complete profile or skip

## Production Setup

### 1. Configure Twilio
1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Add to `.env`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### 2. Run Database Migration
```bash
cd backend/services/gateway
npm run migration:run
```

### 3. Restart Backend
```bash
npm run start:dev
```

### 4. Build iOS App
Project is already configured and builds successfully.

## Backward Compatibility

- Old email/password `register()` and `login()` endpoints still exist in backend
- Can be removed once all clients migrate to phone auth
- Old users with email/password can still log in using old endpoints

## Next Steps / TODOs

1. **Add rate limiting** to prevent SMS abuse (e.g., max 3 codes per phone per hour)
2. **Email verification** flow for users who provide email
3. **Terms of Use** modal/screen
4. **Privacy Policy** modal/screen
5. **Phone number edit** before verification sent
6. **Android implementation** (similar to iOS flow)
7. **Backend tests** for new auth endpoints
8. **iOS UI tests** for new auth flow

## Files Created

### Backend
- `backend/database/migrations/1729280000000-AddPhoneAuthFields.ts`
- `backend/services/gateway/src/modules/auth/dto/send-code.dto.ts`
- `backend/services/gateway/src/modules/auth/dto/verify-code.dto.ts`
- `backend/services/gateway/src/modules/auth/dto/complete-profile.dto.ts`
- `backend/services/gateway/src/modules/auth/sms.service.ts`

### iOS
- `mobile/ios/OnlyCoffee/Views/Auth/PhoneAuthView.swift`
- `mobile/ios/OnlyCoffee/Views/Auth/VerificationCodeView.swift`
- `mobile/ios/OnlyCoffee/Views/Auth/ProfileCompletionView.swift`

## Files Modified

### Backend
- `backend/shared/src/database/entities/user.entity.ts` (added 3 fields)
- `backend/services/gateway/src/modules/auth/dto/index.ts` (exported new DTOs)
- `backend/services/gateway/src/modules/auth/auth.service.ts` (added 3 methods)
- `backend/services/gateway/src/modules/auth/auth.controller.ts` (added 3 endpoints)
- `backend/services/gateway/src/modules/auth/auth.module.ts` (registered SmsService)
- `backend/.env.example` (added Twilio variables)
- `backend/services/gateway/package.json` (added twilio dependency)

### iOS
- `mobile/ios/OnlyCoffee/Managers/AuthenticationManager.swift` (added phone auth methods, removed OAuth)
- `mobile/ios/OnlyCoffee/Views/Auth/LoginView.swift` (replaced with PhoneAuthView wrapper)

## Files Removed

### iOS
- `mobile/ios/OnlyCoffee/Managers/OAuthManager.swift`

---

**Implementation Date**: October 2025
**Build Status**: ✅ BUILD SUCCEEDED
