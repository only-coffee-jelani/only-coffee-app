package com.onlycoffee.app.managers

import android.content.Context
import android.os.Build
import android.util.DisplayMetrics
import android.util.Log
import com.onlycoffee.app.BuildConfig
import com.onlycoffee.app.data.api.*
import com.onlycoffee.app.data.repository.CarouselAnalyticsRepository
import com.onlycoffee.app.utils.DeviceIdManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Enterprise-level manager for carousel analytics tracking
 * 
 * Provides a high-level API for tracking carousel interactions with:
 * - Automatic device metadata collection
 * - Session lifecycle management
 * - User identification (authenticated + anonymous)
 * - Time-on-slide tracking
 * - Swipe velocity calculation
 * - Graceful error handling
 * 
 * Usage:
 * ```
 * // In ViewModel or Screen
 * carouselAnalyticsManager.startCarouselSession(carouselId)
 * carouselAnalyticsManager.trackImpression(carouselItem, position, totalItems)
 * carouselAnalyticsManager.trackClick(carouselItem, position, totalItems)
 * carouselAnalyticsManager.endCarouselSession()
 * ```
 * 
 * @param context Application context for device metadata
 * @param repository Analytics repository for API calls
 * @param secureStorage Secure storage for user authentication
 */
@Singleton
class CarouselAnalyticsManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: CarouselAnalyticsRepository,
    private val secureStorage: SecureStorageManager
) {
    companion object {
        private const val TAG = "CarouselAnalyticsMgr"
    }
    
    // Coroutine scope for async operations
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    // Session tracking
    private var currentSessionId: String? = null
    private var currentCarouselId: String? = null
    
    // Time tracking for view_complete events
    private val itemViewStartTimes = mutableMapOf<String, Long>()
    
    // Device metadata (cached)
    private val deviceId: String by lazy { DeviceIdManager.getDeviceId(context) }
    private val appVersion: String by lazy { BuildConfig.VERSION_NAME }
    private val deviceModel: String by lazy { "${Build.MANUFACTURER} ${Build.MODEL}" }
    private val screenWidth: Int by lazy { calculateScreenWidth() }
    private val screenHeight: Int by lazy { calculateScreenHeight() }
    
    /**
     * Start a new carousel engagement session
     * 
     * Call this when the carousel is first displayed to the user.
     * Automatically handles user identification (authenticated or anonymous).
     * 
     * @param carouselId ID of the carousel being displayed
     * @param storeId Optional store ID for location-based analytics
     */
    fun startCarouselSession(carouselId: String, storeId: String? = null) {
        scope.launch {
            try {
                Log.d(TAG, "Starting carousel session for: $carouselId")
                
                val userId = secureStorage.getUserId()
                val request = StartSessionRequest(
                    carouselId = carouselId,
                    userId = userId,
                    deviceId = deviceId,
                    storeId = storeId
                )
                
                val result = repository.startSession(request)
                if (result is com.onlycoffee.app.utils.NetworkResult.Success) {
                    currentSessionId = result.data.sessionId
                    currentCarouselId = carouselId
                    Log.d(TAG, "Session started: ${result.data.sessionId}")
                } else {
                    Log.e(TAG, "Failed to start session: $result")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception starting session", e)
            }
        }
    }
    
    /**
     * End the current carousel engagement session
     * 
     * Call this when user navigates away from the carousel.
     * Calculates final engagement score.
     * 
     * @param orderId Optional order ID if user made a purchase
     * @param revenueAmount Optional revenue amount from purchase
     */
    fun endCarouselSession(orderId: String? = null, revenueAmount: Float? = null) {
        scope.launch {
            try {
                val sessionId = currentSessionId ?: run {
                    Log.w(TAG, "No active session to end")
                    return@launch
                }
                
                Log.d(TAG, "Ending carousel session: $sessionId")
                
                val request = EndSessionRequest(
                    sessionId = sessionId,
                    orderId = orderId,
                    revenueAmount = revenueAmount
                )
                
                repository.endSession(request)
                
                // Clear session state
                currentSessionId = null
                currentCarouselId = null
                itemViewStartTimes.clear()
                
                Log.d(TAG, "Session ended successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Exception ending session", e)
            }
        }
    }
    
    /**
     * Track carousel item impression
     * 
     * Call this when a carousel item becomes visible to the user.
     * Automatically starts time tracking for view_complete events.
     * 
     * @param carouselItemId ID of the carousel item
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     */
    fun trackImpression(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int
    ) {
        scope.launch {
            try {
                // Start time tracking for this item
                itemViewStartTimes[carouselItemId] = System.currentTimeMillis()
                
                val userId = secureStorage.getUserId()
                repository.trackEvent(
                    createEventRequest(
                        carouselItemId = carouselItemId,
                        carouselId = carouselId,
                        eventType = CarouselEventType.impression,
                        position = position,
                        totalItems = totalItems,
                        userId = userId
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception tracking impression", e)
            }
        }
    }
    
    /**
     * Track carousel item click
     *
     * Call this when user taps a carousel item.
     * Automatically calculates time-on-slide if impression was tracked.
     *
     * @param carouselItemId ID of the carousel item
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     * @param deeplink Optional deeplink that was triggered
     */
    fun trackClick(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int,
        deeplink: String? = null
    ) {
        scope.launch {
            try {
                val userId = secureStorage.getUserId()
                val timeOnSlide = calculateTimeOnSlide(carouselItemId)

                repository.trackEvent(
                    createEventRequest(
                        carouselItemId = carouselItemId,
                        carouselId = carouselId,
                        eventType = CarouselEventType.click,
                        position = position,
                        totalItems = totalItems,
                        userId = userId,
                        timeOnSlideSeconds = timeOnSlide,
                        deeplink = deeplink
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception tracking click", e)
            }
        }
    }

    /**
     * Track swipe left event
     *
     * @param carouselItemId ID of the carousel item being swiped away from
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     * @param velocity Swipe velocity (pixels per second)
     */
    fun trackSwipeLeft(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int,
        velocity: Float? = null
    ) {
        scope.launch {
            try {
                val userId = secureStorage.getUserId()
                val timeOnSlide = calculateTimeOnSlide(carouselItemId)

                repository.trackEvent(
                    createEventRequest(
                        carouselItemId = carouselItemId,
                        carouselId = carouselId,
                        eventType = CarouselEventType.swipe_left,
                        position = position,
                        totalItems = totalItems,
                        userId = userId,
                        timeOnSlideSeconds = timeOnSlide,
                        swipeVelocity = velocity
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception tracking swipe left", e)
            }
        }
    }

    /**
     * Track swipe right event
     *
     * @param carouselItemId ID of the carousel item being swiped away from
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     * @param velocity Swipe velocity (pixels per second)
     */
    fun trackSwipeRight(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int,
        velocity: Float? = null
    ) {
        scope.launch {
            try {
                val userId = secureStorage.getUserId()
                val timeOnSlide = calculateTimeOnSlide(carouselItemId)

                repository.trackEvent(
                    createEventRequest(
                        carouselItemId = carouselItemId,
                        carouselId = carouselId,
                        eventType = CarouselEventType.swipe_right,
                        position = position,
                        totalItems = totalItems,
                        userId = userId,
                        timeOnSlideSeconds = timeOnSlide,
                        swipeVelocity = velocity
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception tracking swipe right", e)
            }
        }
    }

    /**
     * Track auto-advance event (carousel automatically scrolled)
     *
     * @param carouselItemId ID of the carousel item being advanced from
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     */
    fun trackAutoAdvance(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int
    ) {
        scope.launch {
            try {
                val userId = secureStorage.getUserId()
                val timeOnSlide = calculateTimeOnSlide(carouselItemId)

                repository.trackEvent(
                    createEventRequest(
                        carouselItemId = carouselItemId,
                        carouselId = carouselId,
                        eventType = CarouselEventType.auto_advance,
                        position = position,
                        totalItems = totalItems,
                        userId = userId,
                        timeOnSlideSeconds = timeOnSlide
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception tracking auto advance", e)
            }
        }
    }

    /**
     * Track manual advance event (user manually scrolled carousel)
     *
     * @param carouselItemId ID of the carousel item being advanced from
     * @param carouselId ID of the parent carousel
     * @param position Position in carousel (0-indexed)
     * @param totalItems Total number of items in carousel
     */
    fun trackManualAdvance(
        carouselItemId: String,
        carouselId: String,
        position: Int,
        totalItems: Int
    ) {
        scope.launch {
            try {
                val userId = secureStorage.getUserId()
                val timeOnSlide = calculateTimeOnSlide(carouselItemId)

                repository.trackEvent(
                    createEventRequest(
                        carouselItemId = carouselItemId,
                        carouselId = carouselId,
                        eventType = CarouselEventType.manual_advance,
                        position = position,
                        totalItems = totalItems,
                        userId = userId,
                        timeOnSlideSeconds = timeOnSlide
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception tracking manual advance", e)
            }
        }
    }

    /**
     * Calculate time spent on a carousel item
     *
     * @param carouselItemId ID of the carousel item
     * @return Time in seconds, or null if no start time recorded
     */
    private fun calculateTimeOnSlide(carouselItemId: String): Float? {
        val startTime = itemViewStartTimes[carouselItemId] ?: return null
        val endTime = System.currentTimeMillis()
        val durationMs = endTime - startTime
        return durationMs / 1000f
    }

    /**
     * Create a comprehensive event request with all metadata
     */
    private fun createEventRequest(
        carouselItemId: String,
        carouselId: String,
        eventType: CarouselEventType,
        position: Int,
        totalItems: Int,
        userId: String?,
        timeOnSlideSeconds: Float? = null,
        swipeVelocity: Float? = null,
        deeplink: String? = null,
        orderId: String? = null,
        revenueAmount: Float? = null
    ): TrackCarouselEventRequest {
        return TrackCarouselEventRequest(
            carouselItemId = carouselItemId,
            carouselId = carouselId,
            eventType = eventType,
            positionInCarousel = position,
            totalItemsInCarousel = totalItems,
            userId = userId,
            deviceId = deviceId,
            timeOnSlideSeconds = timeOnSlideSeconds,
            swipeVelocity = swipeVelocity,
            deeplink = deeplink,
            orderId = orderId,
            revenueAmount = revenueAmount,
            appVersion = appVersion,
            osType = "android",
            deviceModel = deviceModel,
            screenWidth = screenWidth,
            screenHeight = screenHeight,
            connectionType = null // Could be enhanced with ConnectivityManager
        )
    }

    private fun calculateScreenWidth(): Int {
        val displayMetrics = context.resources.displayMetrics
        return displayMetrics.widthPixels
    }

    private fun calculateScreenHeight(): Int {
        val displayMetrics = context.resources.displayMetrics
        return displayMetrics.heightPixels
    }
}

