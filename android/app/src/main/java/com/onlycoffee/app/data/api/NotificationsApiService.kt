package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.*
import retrofit2.http.*

/**
 * Notifications API Service
 * Handles push notification registration and preferences
 */
interface NotificationsApiService {
    
    /**
     * Register device token for push notifications
     * Endpoint: POST /api/v1/notifications/register-device
     */
    @POST("api/v1/notifications/register-device")
    suspend fun registerDeviceToken(
        @Body request: RegisterDeviceTokenRequest
    ): RegisterDeviceTokenResponse
    
    /**
     * Get user's notification preferences
     * Endpoint: GET /api/v1/notifications/preferences
     */
    @GET("api/v1/notifications/preferences")
    suspend fun getNotificationPreferences(): NotificationPreferencesResponse
    
    /**
     * Update user's notification preferences
     * Endpoint: PATCH /api/v1/notifications/preferences
     */
    @PATCH("api/v1/notifications/preferences")
    suspend fun updateNotificationPreferences(
        @Body request: UpdateNotificationPreferencesRequest
    ): NotificationPreferencesResponse
}

