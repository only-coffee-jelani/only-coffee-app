# User ID Field Mapping Fix

## Problem

The Android app was receiving a `NullPointerException` when trying to save the user ID after successful registration:

```
Parameter specified as non-null is null: method
com.onlycoffee.app.managers.SecureStorageManager.saveUserId, parameter userId
```

### Root Cause

**API Contract Mismatch:**
- **Backend**: The User entity has a property named `userId` (mapped to database column `user_id`)
- **Android App**: The User model expects the field to be named `id`

The backend was serializing the User entity directly, which resulted in JSON responses containing `userId`:

```json
{
  "user": {
    "userId": "e00c8f9a-bd7c-4a1c-bdea-2909be29f2e8",  // ❌ Backend sent this
    "email": "test@example.com",
    ...
  }
}
```

But the Android app expected:

```json
{
  "user": {
    "id": "e00c8f9a-bd7c-4a1c-bdea-2909be29f2e8",  // ✅ Android expected this
    "email": "test@example.com",
    ...
  }
}
```

## Solution

Created an **enterprise-level Data Transfer Object (DTO)** pattern to explicitly define the API contract and map internal field names to client-expected field names.

### Changes Made

#### 1. Created `UserResponseDto` (NEW)

**File:** `backend/services/gateway/src/modules/auth/dto/user-response.dto.ts`

- Defines the API contract for user data in all responses
- Maps internal `userId` field to `id` for client consistency
- Includes factory method `fromEntity(user: User)` for easy conversion
- Fully documented with Swagger/OpenAPI decorators

**Key Features:**
```typescript
export class UserResponseDto {
  @ApiProperty({ description: 'Unique user identifier' })
  id: string;  // ✅ Mapped from userId
  
  // ... all other user fields
  
  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.userId;  // Map userId to id
    // ... map all other fields
    return dto;
  }
}
```

#### 2. Created `AuthResponseDto` (NEW)

**File:** `backend/services/gateway/src/modules/auth/dto/user-response.dto.ts`

- Defines the response structure for authentication endpoints
- Uses `UserResponseDto` for consistent user data serialization
- Includes access token, refresh token, and expiration time

#### 3. Updated `auth.service.ts` (MODIFIED)

**File:** `backend/services/gateway/src/modules/auth/auth.service.ts`

Updated all authentication methods to use `UserResponseDto.fromEntity()`:

- `register()` - Line 101
- `login()` - Line 141
- `verifyCode()` - Line 291
- `completeProfile()` - Line 357

**Before:**
```typescript
return {
  user: this.sanitizeUser(user),  // ❌ Returns userId
  ...tokens,
};
```

**After:**
```typescript
return {
  user: UserResponseDto.fromEntity(user),  // ✅ Returns id
  ...tokens,
};
```

#### 4. Updated `auth.controller.ts` (MODIFIED)

**File:** `backend/services/gateway/src/modules/auth/auth.controller.ts`

- Added `AuthResponseDto` import
- Updated `register()` and `login()` endpoints with proper return types and Swagger documentation
- Added `Promise<AuthResponseDto>` return type for type safety

#### 5. Updated `users.controller.ts` (MODIFIED)

**File:** `backend/services/gateway/src/modules/users/users.controller.ts`

- Added `UserResponseDto` import
- Updated `getProfile()` endpoint to return `UserResponseDto.fromEntity(user)`
- Updated `updateProfile()` endpoint to return `UserResponseDto.fromEntity(updatedUser)`
- Added proper Swagger documentation with `type: UserResponseDto`

#### 6. Updated DTO exports (MODIFIED)

**File:** `backend/services/gateway/src/modules/auth/dto/index.ts`

Added export for the new DTO:
```typescript
export * from './user-response.dto';
```

## Testing

### Before Fix

```powershell
# Registration returned userId field
{
  "user": {
    "userId": "e00c8f9a-bd7c-4a1c-bdea-2909be29f2e8",  // ❌
    ...
  }
}
```

### After Fix

```powershell
# Registration now returns id field
{
  "user": {
    "id": "3eb375ae-d888-4b57-9875-d75669d6ddd9",  // ✅
    "email": "test-user-with-id@example.com",
    "phone": null,
    "firstName": "Test",
    "lastName": "User",
    ...
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 900
}
```

## Benefits

1. **✅ Consistent API Contract**: All endpoints now return user data with `id` field
2. **✅ Type Safety**: TypeScript return types ensure compile-time checking
3. **✅ Documentation**: Swagger/OpenAPI decorators provide automatic API documentation
4. **✅ Maintainability**: Centralized DTO makes future changes easier
5. **✅ Security**: DTO pattern prevents accidental exposure of sensitive fields
6. **✅ Backward Compatibility**: Internal database schema unchanged

## Affected Endpoints

All endpoints now return consistent user data with `id` field:

- `POST /api/v1/auth/register` - Returns `AuthResponseDto`
- `POST /api/v1/auth/login` - Returns `AuthResponseDto`
- `POST /api/v1/auth/verify-code` - Returns `AuthResponseDto` with `isNewUser`
- `POST /api/v1/auth/complete-profile` - Returns `UserResponseDto`
- `GET /api/v1/users/me` - Returns `UserResponseDto`
- `PUT /api/v1/users/me` - Returns `UserResponseDto`

## Next Steps

The Android app should now be able to successfully:
1. Register new users
2. Parse the user ID from the response
3. Save the user ID to secure storage
4. Complete the authentication flow

**Test the fix by registering a new user on the Android app!** ☕🚀

