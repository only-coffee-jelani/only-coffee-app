package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.SplashScreen
import retrofit2.http.GET

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
}

