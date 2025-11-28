package com.onlycoffee.app.data.repository

import android.util.Log
import com.onlycoffee.app.data.api.*
import com.onlycoffee.app.data.model.SplashScreen
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for splash screen data
 * Handles fetching splash screen information from the API and tracking events
 */
@Singleton
class SplashScreenRepository @Inject constructor(
    private val splashScreenApi: SplashScreenApi
) {
    companion object {
        private const val TAG = "SplashScreenRepository"
    }

    /**
     * Get the current active splash screen from the API
     * Returns null if no active splash screen is available
     */
    suspend fun getCurrentSplashScreen(): SplashScreen? {
        return try {
            splashScreenApi.getCurrentSplashScreen()
        } catch (e: Exception) {
            // Log error and return null if API call fails
            Log.e(TAG, "Failed to get current splash screen", e)
            null
        }
    }

    /**
     * Track a splash screen event (impression, click, skip, complete, order)
     */
    suspend fun trackEvent(
        splashId: String,
        eventType: String,
        userId: String? = null,
        deviceId: String? = null,
        storeId: String? = null,
        viewTimeSeconds: Int? = null,
        revenueAmount: Double? = null,
        orderId: String? = null
    ): Boolean {
        return try {
            val request = TrackSplashEventRequest(
                splashId = splashId,
                eventType = eventType,
                userId = userId,
                deviceId = deviceId,
                storeId = storeId,
                viewTimeSeconds = viewTimeSeconds,
                revenueAmount = revenueAmount,
                orderId = orderId,
                osType = "android",
                appVersion = "1.0.0" // TODO: Get from BuildConfig
            )
            Log.d(TAG, "Tracking event: $eventType with deviceId: $deviceId")
            val response = splashScreenApi.trackEvent(request)
            Log.d(TAG, "Tracked splash event: $eventType for splash $splashId (eventId: ${response.eventId})")
            response.success
        } catch (e: Exception) {
            Log.e(TAG, "Failed to track splash event: $eventType", e)
            false
        }
    }

    /**
     * Start a splash screen session
     */
    suspend fun startSession(
        splashId: String,
        userId: String? = null,
        deviceId: String? = null,
        storeId: String? = null
    ): String? {
        return try {
            val request = StartSplashSessionRequest(
                splashId = splashId,
                userId = userId,
                deviceId = deviceId,
                storeId = storeId,
                osType = "android",
                appVersion = "1.0.0" // TODO: Get from BuildConfig
            )
            val response = splashScreenApi.startSession(request)
            Log.d(TAG, "Started splash session for splash $splashId (sessionId: ${response.sessionId})")
            response.sessionId
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start splash session", e)
            null
        }
    }

    /**
     * End a splash screen session
     */
    suspend fun endSession(
        sessionId: String,
        wasSkipped: Boolean = false,
        wasClicked: Boolean = false,
        wasConverted: Boolean = false,
        viewTimeSeconds: Int? = null,
        revenueAmount: Double? = null
    ): Boolean {
        return try {
            val request = EndSplashSessionRequest(
                sessionId = sessionId,
                wasSkipped = wasSkipped,
                wasClicked = wasClicked,
                wasConverted = wasConverted,
                viewTimeSeconds = viewTimeSeconds,
                revenueAmount = revenueAmount
            )
            val response = splashScreenApi.endSession(request)
            Log.d(TAG, "Ended splash session $sessionId")
            response.success
        } catch (e: Exception) {
            Log.e(TAG, "Failed to end splash session", e)
            false
        }
    }
}

