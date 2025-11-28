package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.CarouselItem
import retrofit2.http.GET

/**
 * API service for carousel images
 * Fetches promotional carousel images from the backend
 */
interface CarouselApiService {
    /**
     * Get all active carousel images for the home screen
     * Public endpoint - no authentication required
     * Backend returns array directly, not wrapped in response object
     */
    @GET("carousel/active")
    suspend fun getActiveCarouselImages(): List<CarouselItem>
}

