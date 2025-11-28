package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.SplashScreen
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * API interface for splash screen endpoints
 */
interface SplashScreenApi {
    /**
     * Get the current active splash screen
     * This endpoint is public and doesn't require authentication
     */
    @GET("splash-screen/current")
    suspend fun getCurrentSplashScreen(): SplashScreen?

    /**
     * Track a splash screen event (impression, click, skip, complete, order)
     * This endpoint is public and doesn't require authentication
     */
    @POST("splash-screen/events/track")
    suspend fun trackEvent(@Body request: TrackSplashEventRequest): TrackSplashEventResponse

    /**
     * Start a splash screen session
     * This endpoint is public and doesn't require authentication
     */
    @POST("splash-screen/sessions/start")
    suspend fun startSession(@Body request: StartSplashSessionRequest): StartSplashSessionResponse

    /**
     * End a splash screen session
     * This endpoint is public and doesn't require authentication
     */
    @POST("splash-screen/sessions/end")
    suspend fun endSession(@Body request: EndSplashSessionRequest): EndSplashSessionResponse
}

/**
 * Request body for tracking splash events
 */
data class TrackSplashEventRequest(
    val splashId: String,
    val eventType: String, // "impression", "click", "skip", "complete", "order"
    val userId: String? = null,
    val deviceId: String? = null,
    val storeId: String? = null,
    val segmentId: String? = null,
    val orderId: String? = null,
    val viewTimeSeconds: Int? = null,
    val revenueAmount: Double? = null,
    val experimentGroup: String? = null,
    val appVersion: String? = null,
    val osType: String? = "android",
    val deviceModel: String? = null
)

/**
 * Response from tracking splash events
 */
data class TrackSplashEventResponse(
    val success: Boolean,
    val eventId: String
)

/**
 * Request body for starting a splash session
 */
data class StartSplashSessionRequest(
    val splashId: String,
    val userId: String? = null,
    val deviceId: String? = null,
    val storeId: String? = null,
    val segmentId: String? = null,
    val experimentGroup: String? = null,
    val appVersion: String? = null,
    val osType: String? = "android",
    val deviceModel: String? = null
)

/**
 * Response from starting a splash session
 */
data class StartSplashSessionResponse(
    val success: Boolean,
    val sessionId: String
)

/**
 * Request body for ending a splash session
 */
data class EndSplashSessionRequest(
    val sessionId: String,
    val wasSkipped: Boolean? = false,
    val wasClicked: Boolean? = false,
    val wasConverted: Boolean? = false,
    val viewTimeSeconds: Int? = null,
    val revenueAmount: Double? = null
)

/**
 * Response from ending a splash session
 */
data class EndSplashSessionResponse(
    val success: Boolean
)

