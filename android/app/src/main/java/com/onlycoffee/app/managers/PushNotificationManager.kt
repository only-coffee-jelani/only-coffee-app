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
import com.onlycoffee.app.R
import com.onlycoffee.app.data.api.NotificationsApiService
import com.onlycoffee.app.data.model.RegisterDeviceTokenRequest
import com.onlycoffee.app.MainActivity
import com.onlycoffee.app.OnlyCoffeeApplication
import dagger.hilt.android.qualifiers.ApplicationContext
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
    @ApplicationContext private val context: Context,
    private val notificationsApi: NotificationsApiService
) {
    companion object {
        private const val TAG = "PushNotificationManager"
        private const val PREFS_NAME = "push_notification_prefs"
        private const val KEY_TOKEN = "fcm_token"
        private const val KEY_TOKEN_SENT = "token_sent_to_backend"
    }

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val _deviceToken = MutableStateFlow<String?>(null)
    val deviceToken: StateFlow<String?> = _deviceToken.asStateFlow()

    private val _permissionGranted = MutableStateFlow(false)
    val permissionGranted: StateFlow<Boolean> = _permissionGranted.asStateFlow()

    init {
        checkPermissionStatus()
        loadSavedToken()
    }

    /**
     * Load saved FCM token from SharedPreferences
     */
    private fun loadSavedToken() {
        val savedToken = prefs.getString(KEY_TOKEN, null)
        _deviceToken.value = savedToken
    }

    /**
     * Save FCM token to SharedPreferences
     */
    private fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
        _deviceToken.value = token
    }

    /**
     * Mark token as sent to backend
     */
    private fun markTokenAsSent() {
        prefs.edit().putBoolean(KEY_TOKEN_SENT, true).apply()
    }

    /**
     * Check if token has been sent to backend
     */
    private fun isTokenSent(): Boolean {
        return prefs.getBoolean(KEY_TOKEN_SENT, false)
    }

    /**
     * Clear token sent flag (call when token changes)
     */
    private fun clearTokenSentFlag() {
        prefs.edit().putBoolean(KEY_TOKEN_SENT, false).apply()
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
     * Call this after permission is granted
     */
    suspend fun requestToken(): String? {
        return try {
            val token = FirebaseMessaging.getInstance().token.await()
            saveToken(token)

            Log.d(TAG, "📱 FCM Token obtained: ${token.take(20)}...")

            // Register token with backend
            registerTokenWithBackend(token)

            token
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to get FCM token: ${e.message}", e)
            null
        }
    }

    /**
     * Update token (called when token is refreshed)
     */
    suspend fun updateToken(token: String) {
        saveToken(token)
        clearTokenSentFlag()
        registerTokenWithBackend(token)
    }

    /**
     * Register device token with backend
     */
    private suspend fun registerTokenWithBackend(token: String) {
        try {
            // Skip if already sent
            if (isTokenSent()) {
                Log.d(TAG, "Token already registered with backend")
                return
            }

            val request = RegisterDeviceTokenRequest(
                deviceToken = token,
                platform = "android"
            )

            notificationsApi.registerDeviceToken(request)
            markTokenAsSent()

            Log.d(TAG, "✅ Device token registered with backend successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to register device token with backend: ${e.message}", e)
            // Don't throw - we'll retry later
        }
    }

    /**
     * Handle incoming FCM messages
     * NOTE: Firebase is not configured, this is a stub implementation
     */
    fun handleRemoteMessage(data: Map<String, String>) {
        Log.d(TAG, "📬 Received message")

        // Handle data payload
        if (data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: $data")
            handleDataPayload(data)
        }
    }

    /**
     * Handle data payload from FCM message
     */
    private fun handleDataPayload(data: Map<String, String>) {
        val notificationType = data["type"] ?: return

        when (notificationType) {
            "order_placed" -> {
                val orderId = data["orderId"]
                val title = data["title"] ?: "Order Placed"
                val body = data["body"] ?: "Your order has been placed successfully"
                Log.d(TAG, "Order placed notification: $orderId")
                showNotification(title, body, data)
            }

            "order_preparing" -> {
                val orderId = data["orderId"]
                val title = data["title"] ?: "Order Being Prepared"
                val body = data["body"] ?: "Your order is being prepared"
                Log.d(TAG, "Order preparing notification: $orderId")
                showNotification(title, body, data)
            }

            "order_ready" -> {
                val orderId = data["orderId"]
                val title = data["title"] ?: "Order Ready!"
                val body = data["body"] ?: "Your order is ready for pickup"
                Log.d(TAG, "Order ready notification: $orderId")
                showNotification(title, body, data)
            }

            "order_completed" -> {
                val orderId = data["orderId"]
                val title = data["title"] ?: "Order Completed"
                val body = data["body"] ?: "Thank you for your order!"
                Log.d(TAG, "Order completed notification: $orderId")
                showNotification(title, body, data)
            }

            "order_cancelled" -> {
                val orderId = data["orderId"]
                val title = data["title"] ?: "Order Cancelled"
                val body = data["body"] ?: "Your order has been cancelled"
                Log.d(TAG, "Order cancelled notification: $orderId")
                showNotification(title, body, data)
            }

            "coupon_expiring" -> {
                val couponId = data["couponId"]
                val hoursUntilExpiry = data["hoursUntilExpiry"]?.toIntOrNull() ?: 0
                Log.d(TAG, "Coupon expiring notification: $couponId in $hoursUntilExpiry hours")
            }

            "coupon_granted" -> {
                val couponLabel = data["couponLabel"]
                Log.d(TAG, "New coupon granted: $couponLabel")
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

        // Determine which channel to use based on notification type
        val channelId = when (data["type"]) {
            "order_placed", "order_preparing", "order_ready", "order_completed", "order_cancelled" ->
                OnlyCoffeeApplication.CHANNEL_ORDER_UPDATES
            "coupon_granted", "coupon_expiring" ->
                OnlyCoffeeApplication.CHANNEL_PROMOTIONS
            "loyalty_points", "tier_upgrade" ->
                OnlyCoffeeApplication.CHANNEL_REWARDS
            else -> OnlyCoffeeApplication.CHANNEL_ORDER_UPDATES
        }

        // Create intent for notification tap
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("notification_type", data["type"])
            data["orderId"]?.let { putExtra("order_id", it) }
            data["couponId"]?.let { putExtra("coupon_id", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .build()

        NotificationManagerCompat.from(context).notify(
            System.currentTimeMillis().toInt(),
            notification
        )

        Log.d(TAG, "✅ Notification shown: $title")
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
            prefs.edit().clear().apply()
            _deviceToken.value = null
            Log.d(TAG, "✅ FCM token deleted")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to delete FCM token: ${e.message}", e)
        }
    }

    /**
     * Check if user should be prompted for notification permission
     * Returns true if permission not granted and user hasn't been asked too many times
     */
    fun shouldRequestPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return false // No runtime permission needed
        }

        if (_permissionGranted.value) {
            return false // Already granted
        }

        // Check how many times we've asked
        val askCount = prefs.getInt("permission_ask_count", 0)
        val lastAskTime = prefs.getLong("permission_last_ask", 0)
        val now = System.currentTimeMillis()
        val daysSinceLastAsk = (now - lastAskTime) / (1000 * 60 * 60 * 24)

        // Don't ask more than 3 times, and wait at least 7 days between asks
        return askCount < 3 && (askCount == 0 || daysSinceLastAsk >= 7)
    }

    /**
     * Record that we asked for permission
     */
    fun recordPermissionRequest() {
        val askCount = prefs.getInt("permission_ask_count", 0)
        prefs.edit()
            .putInt("permission_ask_count", askCount + 1)
            .putLong("permission_last_ask", System.currentTimeMillis())
            .apply()
    }
}
