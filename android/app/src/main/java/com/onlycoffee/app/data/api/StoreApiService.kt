package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.StoreResponse
import retrofit2.http.*

/**
 * Store API Service - Enterprise Level
 *
 * Retrofit interface for store-related API endpoints.
 * All endpoints return responses wrapped in ApiResponse format.
 *
 * Base URL: /api/v1/stores
 *
 * Error Handling:
 * - Network errors: Retrofit will throw IOException
 * - HTTP errors: Retrofit will throw HttpException
 * - Parsing errors: Retrofit will throw JsonException
 *
 * All methods are suspend functions for coroutine support.
 */
interface StoreApiService {

    /**
     * Get all stores
     *
     * Endpoint: GET /api/v1/stores
     * Returns: List of all active stores ordered by creation date (newest first)
     *
     * Response includes:
     * - Store details (name, address, contact info)
     * - Store type (coffee_shop, kiosk, food_truck, popup)
     * - Operating hours for each day
     * - Current open/closed status (timezone-aware)
     * - Formatted hours by day name
     *
     * @return ApiListResponse containing list of stores
     * @throws IOException on network errors
     * @throws HttpException on HTTP errors (4xx, 5xx)
     */
    @GET("stores")
    suspend fun getAllStores(): ApiListResponse<StoreResponse>

    /**
     * Get store by ID
     *
     * Endpoint: GET /api/v1/stores/{id}
     * Returns: Single store details
     *
     * @param storeId Store UUID
     * @return ApiSingleResponse containing store details
     * @throws IOException on network errors
     * @throws HttpException on HTTP errors (404 if not found)
     */
    @GET("stores/{id}")
    suspend fun getStoreById(
        @Path("id") storeId: String
    ): ApiSingleResponse<StoreResponse>

    /**
     * Get nearby stores
     *
     * Endpoint: GET /api/v1/stores/nearby
     * Returns: List of stores within specified radius, sorted by distance
     *
     * Uses Haversine formula to calculate distances.
     * Response includes distance field in miles.
     *
     * @param latitude User's latitude coordinate
     * @param longitude User's longitude coordinate
     * @param radius Search radius in miles (default: 10.0)
     * @return ApiListResponse containing nearby stores with distance
     * @throws IOException on network errors
     * @throws HttpException on HTTP errors (400 for invalid coordinates)
     */
    @GET("stores/nearby")
    suspend fun getNearbyStores(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Double = 10.0
    ): ApiListResponse<StoreResponse>

    /**
     * Get stores by type
     *
     * Endpoint: GET /api/v1/stores/type/{typeId}
     * Returns: List of stores of specified type
     *
     * @param typeId Store type UUID
     * @return ApiListResponse containing stores of specified type
     * @throws IOException on network errors
     * @throws HttpException on HTTP errors (404 if type not found)
     */
    @GET("stores/type/{typeId}")
    suspend fun getStoresByType(
        @Path("typeId") typeId: String
    ): ApiListResponse<StoreResponse>

    /**
     * Search stores by query
     *
     * Endpoint: GET /api/v1/stores
     * Returns: List of stores matching the search query
     *
     * Searches in store name, address, and phone number.
     *
     * @param query Search query string
     * @return ApiListResponse containing matching stores
     * @throws IOException on network errors
     * @throws HttpException on HTTP errors
     */
    @GET("stores")
    suspend fun searchStores(
        @Query("search") query: String
    ): ApiListResponse<StoreResponse>
}

