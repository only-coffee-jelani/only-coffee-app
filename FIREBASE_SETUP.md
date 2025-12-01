# Firebase Push Notifications Setup

## 🔥 Overview

This document describes the Firebase Cloud Messaging (FCM) setup for the Only Coffee app's push notification system.

## ✅ What's Already Configured

### Android App
- ✅ Firebase SDK integrated (BOM 34.6.0)
- ✅ Google Services plugin configured (4.4.4)
- ✅ `google-services.json` added to `android/app/`
- ✅ `OnlyCoffeeFirebaseMessagingService` implemented
- ✅ `PushNotificationManager` with token management
- ✅ Notification channels configured
- ✅ API integration with backend

### Backend
- ✅ Firebase Admin SDK installed (`firebase-admin`)
- ✅ `FirebaseService` implemented
- ✅ `NotificationsService` updated to use Firebase
- ✅ Service account key: `backend/only-coffee-us-firebase-adminsdk-fbsvc-9780c09fd4.json`
- ✅ Database integration with `user_devices` table
- ✅ Token registration endpoint: `POST /api/v1/notifications/register-device`

## 🔐 Security - Files in .gitignore

The following sensitive files are properly excluded from version control:

```
# Root .gitignore
google-services.json
*firebase-adminsdk*.json
firebase-service-account.json
firebase-credentials.json
backend/google-services.json
backend/*firebase-adminsdk*.json
android/app/google-services.json
mobile/ios/GoogleService-Info.plist

# Android .gitignore
google-services.json

# Backend .gitignore
google-services.json
*firebase-adminsdk*.json
firebase-service-account.json
firebase-credentials.json
```

## 📋 Firebase Project Details

- **Project ID**: `only-coffee-us`
- **Project Number**: `548675746448`
- **Android Package**: `com.onlycoffee.app`
- **Service Account**: `firebase-adminsdk-fbsvc@only-coffee-us.iam.gserviceaccount.com`

## 🚀 How It Works

### 1. Token Registration Flow

```
1. App launches → Firebase generates FCM token
2. PushNotificationManager.requestToken() called
3. Token sent to backend: POST /api/v1/notifications/register-device
4. Backend saves token to user_devices table
5. Token persisted in SharedPreferences for idempotency
```

### 2. Notification Sending Flow

```
1. Order status changes (e.g., order ready)
2. Backend calls NotificationsService.sendOrderStatusNotification()
3. FirebaseService.sendToDevice() sends via FCM
4. Android app receives notification
5. OnlyCoffeeFirebaseMessagingService handles message
6. PushNotificationManager displays notification
```

### 3. Notification Types

- **Order Updates** (High Priority)
  - `order_placed` - Order confirmed
  - `order_preparing` - Being prepared
  - `order_ready` - Ready for pickup
  - `order_completed` - Order complete
  - `order_cancelled` - Order cancelled

- **Promotions** (Default Priority)
  - Promotional offers
  - Special deals

- **Rewards** (Default Priority)
  - `coupon_granted` - New coupon available
  - `coupon_expiring` - Coupon expiring soon
  - `loyalty_points` - Points earned
  - `tier_upgrade` - Loyalty tier upgraded

## 🧪 Testing Push Notifications

### Method 1: Firebase Console (Quick Test)

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and body
4. Click "Send test message"
5. Enter FCM token from app logs
6. Click "Test"

### Method 2: Backend API (Production Flow)

```bash
# 1. Get user's FCM token from logs
adb logcat | Select-String "FCM Token obtained"

# 2. Trigger order status change (will auto-send notification)
# Or manually call the notification service
```

### Method 3: cURL (Direct API Call)

```bash
curl -X POST http://localhost:3000/api/v1/notifications/register-device \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "FCM_TOKEN_HERE",
    "platform": "android"
  }'
```

## 📱 Android App Logs

To monitor FCM activity:

```powershell
# All FCM logs
adb logcat | Select-String "PushNotificationManager|FCMService|Firebase"

# Token generation
adb logcat | Select-String "FCM Token"

# Notification reception
adb logcat | Select-String "FCM message received"
```

## 🔧 Backend Configuration

The Firebase service automatically initializes on module startup:

```typescript
// Path to service account key (relative to backend/services/gateway)
../../only-coffee-us-firebase-adminsdk-fbsvc-9780c09fd4.json
```

If the file is not found, the service logs a warning but doesn't crash. Push notifications simply won't work until the file is added.

## 📊 Database Schema

```sql
-- user_devices table
CREATE TABLE user_devices (
  device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  device_type VARCHAR(20),  -- 'ios' or 'android'
  push_token TEXT,          -- FCM token
  app_version VARCHAR(20),
  os_version VARCHAR(20),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## ⚠️ Important Notes

1. **Token Expiration**: FCM tokens can expire or become invalid. The backend automatically removes invalid tokens when detected.

2. **Multiple Devices**: Users can have multiple devices. Notifications are sent to all registered devices.

3. **Permission Required**: Android 13+ requires runtime permission for notifications. The app handles this automatically.

4. **Rate Limiting**: Firebase has rate limits. For production, consider batching notifications.

5. **Error Handling**: All notification failures are logged but don't crash the app or backend.

## 🎯 Next Steps

1. ✅ Firebase configured
2. ✅ Android app integrated
3. ✅ Backend integrated
4. ⏳ Test end-to-end flow
5. ⏳ Add notification preferences UI
6. ⏳ Integrate with order status changes
7. ⏳ Add iOS support (when ready)

## 📚 Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Android FCM Integration](https://firebase.google.com/docs/cloud-messaging/android/client)

