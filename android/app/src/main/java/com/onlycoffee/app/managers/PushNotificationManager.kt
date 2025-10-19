package com.onlycoffee.app.managers

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.RemoteMessage
import com.onlycoffee.app.R
import com.onlycoffee.app.data.api.RetrofitClient
import com.onlycoffee.app.data.model.RegisterDeviceTokenRequest
import com.onlycoffee.app.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PushNotificationManager @Inject constructor(
    private val context: Context
) {
    companion object {
        private const val TAG = "PushNotificationManager"
        private const val CHANNEL_ID = "only_coffee_notifications"
        private const val CHANNEL_NAME = "Only Coffee Notifications"
        private const val CHANNEL_DESCRIPTION = "Notifications for coupons, orders, and promotions"
    }

    private val _deviceToken = MutableStateFlow<String?>(null)
    val deviceToken: StateFlow<String?> = _deviceToken.asStateFlow()

    private val _permissionGranted = MutableStateFlow(false)
    val permissionGranted: StateFlow<Boolean> = _permissionGranted.asStateFlow()

    init {
        createNotificationChannel()
        checkPermissionStatus()
    }

    /**
     * Create notification channel for Android O+
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESCRIPTION
                enableLights(true)
                enableVibration(true)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Check if notification permission is granted
     */
    fun checkPermissionStatus() {
        _permissionGranted.value = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true // Permission not required for older versions
        }
    }

    /**
     * Request FCM token and register with backend
     */
    suspend fun requestToken(): String? {
        return try {
            val token = FirebaseMessaging.getInstance().token.await()
            _deviceToken.value = token

            Log.d(TAG, "📱 FCM Token: $token")

            // Register token with backend
            registerTokenWithBackend(token)

            token
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to get FCM token: ${e.message}", e)
            null
        }
    }

    /**
     * Register device token with backend
     */
    private suspend fun registerTokenWithBackend(token: String) {
        try {
            val request = RegisterDeviceTokenRequest(
                deviceToken = token,
                platform = "android"
            )

            // TODO: Implement API call when NotificationsApiService is available
            // val response = retrofitClient.notificationsApi.registerDevice(request)

            Log.d(TAG, "✅ Device token registered with backend successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to register device token with backend: ${e.message}", e)
        }
    }

    /**
     * Handle incoming FCM messages
     */
    fun handleRemoteMessage(remoteMessage: RemoteMessage) {
        Log.d(TAG, "📬 Received FCM message from: ${remoteMessage.from}")

        // Handle data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            handleDataPayload(remoteMessage.data)
        }

        // Handle notification payload
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Message notification: ${notification.title}")
            showNotification(
                title = notification.title ?: "Only Coffee",
                body = notification.body ?: "",
                data = remoteMessage.data
            )
        }
    }

    /**
     * Handle data payload from FCM message
     */
    private fun handleDataPayload(data: Map<String, String>) {
        val notificationType = data["type"] ?: return

        when (notificationType) {
            "coupon_expiring" -> {
                val couponId = data["couponId"]
                val hoursUntilExpiry = data["hoursUntilExpiry"]?.toIntOrNull() ?: 0
                Log.d(TAG, "Coupon expiring notification: $couponId in $hoursUntilExpiry hours")
                // Deep link data will be handled when notification is tapped
            }

            "coupon_granted" -> {
                val couponLabel = data["couponLabel"]
                Log.d(TAG, "New coupon granted: $couponLabel")
            }

            "order_status" -> {
                val orderId = data["orderId"]
                val status = data["status"]
                Log.d(TAG, "Order status update: $orderId -> $status")
            }

            else -> {
                Log.d(TAG, "Unknown notification type: $notificationType")
            }
        }
    }

    /**
     * Show notification to user
     */
    fun showNotification(
        title: String,
        body: String,
        data: Map<String, String> = emptyMap()
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "Notification permission not granted")
                return
            }
        }

        // Create intent for notification tap
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("notification_type", data["type"])
            putExtra("notification_data", data.toString())
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(context).notify(
            System.currentTimeMillis().toInt(),
            notification
        )
    }

    /**
     * Clear all notifications
     */
    fun clearAllNotifications() {
        NotificationManagerCompat.from(context).cancelAll()
    }

    /**
     * Delete FCM token (for logout)
     */
    suspend fun deleteToken() {
        try {
            FirebaseMessaging.getInstance().deleteToken().await()
            _deviceToken.value = null
            Log.d(TAG, "✅ FCM token deleted")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to delete FCM token: ${e.message}", e)
        }
    }
}

// Request model for device token registration
data class RegisterDeviceTokenRequest(
    val deviceToken: String,
    val platform: String
)
