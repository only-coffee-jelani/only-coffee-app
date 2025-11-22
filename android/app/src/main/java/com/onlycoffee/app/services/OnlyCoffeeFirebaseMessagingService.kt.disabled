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
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "📱 New FCM token: $token")

        serviceScope.launch {
            pushNotificationManager.requestToken()
        }
    }

    /**
     * Called when a message is received
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "📬 FCM message received from: ${remoteMessage.from}")

        pushNotificationManager.handleRemoteMessage(remoteMessage)
    }

    /**
     * Called when messages are deleted on the server
     */
    override fun onDeletedMessages() {
        super.onDeletedMessages()
        Log.d(TAG, "FCM messages deleted on server")
    }

    /**
     * Called when a message couldn't be sent
     */
    override fun onMessageSent(msgId: String) {
        super.onMessageSent(msgId)
        Log.d(TAG, "FCM message sent: $msgId")
    }

    /**
     * Called when a message failed to send
     */
    override fun onSendError(msgId: String, exception: Exception) {
        super.onSendError(msgId, exception)
        Log.e(TAG, "FCM send error for message $msgId: ${exception.message}", exception)
    }
}
