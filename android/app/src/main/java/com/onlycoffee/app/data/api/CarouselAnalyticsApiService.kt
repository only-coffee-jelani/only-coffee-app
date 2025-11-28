package com.onlycoffee.app.data.api

import retrofit2.http.*

/**
 * Enterprise-level API service for carousel analytics tracking
 * 
 * Provides comprehensive event tracking, session management, and analytics retrieval
 * for carousel interactions. Supports both authenticated and anonymous users.
 * 
 * @see CarouselAnalyticsRepository for usage examples
 */
interface CarouselAnalyticsApiService {
    
    /**
     * Track a comprehensive carousel event
     * 
     * Supports 9 event types: impression, click, swipe_left, swipe_right, 
     * auto_advance, manual_advance, view_complete, order, add_to_cart
     * 
     * @param request Event tracking data with all metadata
     * @return Success response
     */
    @POST("carousel/events/track")
    suspend fun trackEvent(@Body request: TrackCarouselEventRequest): TrackEventResponse
    
    /**
     * Start a new carousel engagement session
     * 
     * Sessions track user engagement across multiple carousel interactions.
     * Call this when the carousel is first displayed to the user.
     * 
     * @param request Session start data
     * @return Session ID for subsequent tracking
     */
    @POST("carousel/sessions/start")
    suspend fun startSession(@Body request: StartSessionRequest): StartSessionResponse
    
    /**
     * End a carousel engagement session
     * 
     * Calculates engagement score (0-100) based on user interactions.
     * Call this when user navigates away from the carousel.
     * 
     * @param request Session end data with optional order information
     * @return Success response
     */
    @POST("carousel/sessions/end")
    suspend fun endSession(@Body request: EndSessionRequest): EndSessionResponse
}

/**
 * Request DTO for tracking carousel events
 * 
 * Comprehensive event tracking with device metadata, position tracking,
 * interaction metrics, and conversion data.
 */
data class TrackCarouselEventRequest(
    // Required fields
    val carouselItemId: String,
    val carouselId: String,
    val eventType: CarouselEventType,
    val positionInCarousel: Int,
    val totalItemsInCarousel: Int,
    
    // User identification (at least one required)
    val userId: String? = null,
    val deviceId: String? = null,
    
    // Optional context
    val storeId: String? = null,
    val segmentId: String? = null,
    val experimentGroup: String? = null,
    
    // Interaction metrics
    val timeOnSlideSeconds: Float? = null,
    val swipeVelocity: Float? = null,
    
    // Navigation
    val deeplink: String? = null,
    
    // Conversion tracking
    val orderId: String? = null,
    val revenueAmount: Float? = null,
    
    // Device metadata
    val appVersion: String? = null,
    val osType: String = "android",
    val deviceModel: String? = null,
    val screenWidth: Int? = null,
    val screenHeight: Int? = null,
    val connectionType: String? = null
)

/**
 * Carousel event types
 * 
 * Comprehensive event taxonomy for tracking all user interactions
 * with carousel components.
 */
enum class CarouselEventType {
    /** Carousel item shown to user */
    impression,
    
    /** User tapped carousel item */
    click,
    
    /** User swiped left */
    swipe_left,
    
    /** User swiped right */
    swipe_right,
    
    /** Carousel auto-scrolled */
    auto_advance,
    
    /** User manually advanced carousel */
    manual_advance,
    
    /** User viewed item for full duration */
    view_complete,
    
    /** User placed order from carousel */
    order,
    
    /** User added item to cart from carousel */
    add_to_cart
}

/**
 * Request DTO for starting a carousel session
 */
data class StartSessionRequest(
    val carouselId: String,
    val userId: String? = null,
    val deviceId: String? = null,
    val storeId: String? = null
)

/**
 * Request DTO for ending a carousel session
 */
data class EndSessionRequest(
    val sessionId: String,
    val orderId: String? = null,
    val revenueAmount: Float? = null
)

/**
 * Response DTOs
 */
data class TrackEventResponse(
    val success: Boolean
)

data class StartSessionResponse(
    val sessionId: String
)

data class EndSessionResponse(
    val success: Boolean
)

