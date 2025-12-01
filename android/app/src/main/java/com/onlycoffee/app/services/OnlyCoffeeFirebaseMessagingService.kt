package com.onlycoffee.app.services

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.onlycoffee.app.managers.PushNotificationManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Firebase Cloud Messaging Service
 * Handles incoming push notifications and token refresh
 */
@AndroidEntryPoint
class OnlyCoffeeFirebaseMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var pushNotificationManager: PushNotificationManager

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    companion object {
        private const val TAG = "FCMService"
    }

    /**
     * Called when a new FCM token is generated
     * This happens on app install, reinstall, or when token is refreshed
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "📱 New FCM token generated: ${token.take(20)}...")

        // Register the new token with backend
        serviceScope.launch {
            pushNotificationManager.updateToken(token)
        }
    }

    /**
     * Called when a message is received
     * Handles both notification and data messages
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "📬 FCM message received from: ${remoteMessage.from}")

        // Handle notification payload
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Notification title: ${notification.title}")
            Log.d(TAG, "Notification body: ${notification.body}")
            
            pushNotificationManager.showNotification(
                title = notification.title ?: "Only Coffee",
                body = notification.body ?: "",
                data = remoteMessage.data
            )
        }

        // Handle data payload (always present for background messages)
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            pushNotificationManager.handleRemoteMessage(remoteMessage.data)
        }
    }

    /**
     * Called when messages are deleted on the server
     * This can happen when too many messages are queued
     */
    override fun onDeletedMessages() {
        super.onDeletedMessages()
        Log.w(TAG, "⚠️ FCM messages deleted on server - too many queued messages")
    }

    /**
     * Called when a message is successfully sent
     */
    override fun onMessageSent(msgId: String) {
        super.onMessageSent(msgId)
        Log.d(TAG, "✅ FCM message sent successfully: $msgId")
    }

    /**
     * Called when a message failed to send
     */
    override fun onSendError(msgId: String, exception: Exception) {
        super.onSendError(msgId, exception)
        Log.e(TAG, "❌ FCM send error for message $msgId: ${exception.message}", exception)
    }
}

