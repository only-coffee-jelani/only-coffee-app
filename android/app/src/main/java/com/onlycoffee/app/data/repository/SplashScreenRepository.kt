package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.SplashScreenApi
import com.onlycoffee.app.data.model.SplashScreen
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for splash screen data
 * Handles fetching splash screen information from the API
 */
@Singleton
class SplashScreenRepository @Inject constructor(
    private val splashScreenApi: SplashScreenApi
) {
    /**
     * Get the current active splash screen from the API
     * Returns null if no active splash screen is available
     */
    suspend fun getCurrentSplashScreen(): SplashScreen? {
        return try {
            splashScreenApi.getCurrentSplashScreen()
        } catch (e: Exception) {
            // Log error and return null if API call fails
            e.printStackTrace()
            null
        }
    }
}

