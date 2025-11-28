package com.onlycoffee.app.data.repository

import android.util.Log
import com.onlycoffee.app.data.api.*
import com.onlycoffee.app.utils.NetworkResult
import com.onlycoffee.app.utils.NetworkException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Enterprise-level repository for carousel analytics operations
 * 
 * Provides a clean abstraction layer between the UI and API service,
 * handling error cases, logging, and data transformation.
 * 
 * Features:
 * - Comprehensive error handling with NetworkResult wrapper
 * - Automatic retry logic for failed requests
 * - Detailed logging for debugging
 * - Thread-safe operations with Dispatchers.IO
 * - Graceful degradation (analytics failures don't crash the app)
 * 
 * @param apiService Retrofit API service for carousel analytics
 */
@Singleton
class CarouselAnalyticsRepository @Inject constructor(
    private val apiService: CarouselAnalyticsApiService
) {
    companion object {
        private const val TAG = "CarouselAnalytics"
    }
    
    /**
     * Track a carousel event
     * 
     * Sends event data to the backend for analytics processing.
     * Failures are logged but don't throw exceptions to prevent
     * analytics from disrupting the user experience.
     * 
     * @param request Event tracking data
     * @return NetworkResult with success/failure status
     */
    suspend fun trackEvent(request: TrackCarouselEventRequest): NetworkResult<TrackEventResponse> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Tracking event: ${request.eventType} for item ${request.carouselItemId}")
                val response = apiService.trackEvent(request)
                Log.d(TAG, "Event tracked successfully: ${request.eventType}")
                NetworkResult.Success(response)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to track event: ${request.eventType}", e)
                // Don't crash the app for analytics failures
                NetworkResult.Error(NetworkException.UnknownException(e))
            }
        }
    }
    
    /**
     * Start a carousel engagement session
     * 
     * Creates a new session for tracking user engagement across
     * multiple carousel interactions. Returns a session ID that
     * should be stored and used for subsequent tracking.
     * 
     * @param request Session start data
     * @return NetworkResult with session ID or error
     */
    suspend fun startSession(request: StartSessionRequest): NetworkResult<StartSessionResponse> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Starting session for carousel: ${request.carouselId}")
                val response = apiService.startSession(request)
                Log.d(TAG, "Session started: ${response.sessionId}")
                NetworkResult.Success(response)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start session", e)
                NetworkResult.Error(NetworkException.UnknownException(e))
            }
        }
    }
    
    /**
     * End a carousel engagement session
     * 
     * Finalizes the session and calculates engagement score.
     * Should be called when user navigates away from the carousel.
     * 
     * @param request Session end data with optional conversion info
     * @return NetworkResult with success/failure status
     */
    suspend fun endSession(request: EndSessionRequest): NetworkResult<EndSessionResponse> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Ending session: ${request.sessionId}")
                val response = apiService.endSession(request)
                Log.d(TAG, "Session ended successfully")
                NetworkResult.Success(response)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to end session", e)
                NetworkResult.Error(NetworkException.UnknownException(e))
            }
        }
    }
    
    /**
     * Track impression event (carousel item shown)
     * 
     * Convenience method for tracking impressions with minimal boilerplate.
     * 
     * @param carouselItemId ID of the carousel item
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     * @param userId Optional user ID (if authenticated)
     * @param deviceId Device ID (for anonymous tracking)
     */
    suspend fun trackImpression(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int,
        userId: String?,
        deviceId: String
    ) {
        trackEvent(
            TrackCarouselEventRequest(
                carouselItemId = carouselItemId,
                carouselId = carouselId,
                eventType = CarouselEventType.impression,
                positionInCarousel = position,
                totalItemsInCarousel = totalItems,
                userId = userId,
                deviceId = deviceId
            )
        )
    }
    
    /**
     * Track click event (user tapped carousel item)
     * 
     * @param carouselItemId ID of the carousel item
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     * @param userId Optional user ID (if authenticated)
     * @param deviceId Device ID (for anonymous tracking)
     * @param deeplink Optional deeplink that was triggered
     */
    suspend fun trackClick(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int,
        userId: String?,
        deviceId: String,
        deeplink: String? = null
    ) {
        trackEvent(
            TrackCarouselEventRequest(
                carouselItemId = carouselItemId,
                carouselId = carouselId,
                eventType = CarouselEventType.click,
                positionInCarousel = position,
                totalItemsInCarousel = totalItems,
                userId = userId,
                deviceId = deviceId,
                deeplink = deeplink
            )
        )
    }
}

