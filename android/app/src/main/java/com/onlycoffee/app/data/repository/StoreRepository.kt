package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.StoreApiService
import com.onlycoffee.app.data.model.Store
import com.onlycoffee.app.utils.ErrorHandler
import com.onlycoffee.app.utils.NetworkResult
import com.onlycoffee.app.utils.safeApiCallWithRetry
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for store-related data operations.
 * Handles API calls with error handling and retry logic.
 */
@Singleton
class StoreRepository @Inject constructor(
    private val storeApiService: StoreApiService,
    private val errorHandler: ErrorHandler
) {
    // In-memory cache for stores
    private var cachedStores: List<Store>? = null
    private var cacheTimestamp: Long = 0
    private val cacheValidityDuration = 10 * 60 * 1000L // 10 minutes

    /**
     * Get all stores
     */
    suspend fun getAllStores(forceRefresh: Boolean = false): NetworkResult<List<Store>> {
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && isCacheValid()) {
            cachedStores?.let {
                return NetworkResult.Success(it)
            }
        }

        return safeApiCallWithRetry(errorHandler) {
            val response = storeApiService.getAllStores()
            cachedStores = response.data
            cacheTimestamp = System.currentTimeMillis()
            response.data
        }
    }

    /**
     * Get store by ID
     */
    suspend fun getStoreById(storeId: String): NetworkResult<Store> {
        // Check cache first
        cachedStores?.find { it.id == storeId }?.let {
            return NetworkResult.Success(it)
        }

        return safeApiCallWithRetry(errorHandler) {
            val response = storeApiService.getStoreById(storeId)
            response.data
        }
    }

    /**
     * Get nearby stores based on location
     */
    suspend fun getNearbyStores(
        latitude: Double,
        longitude: Double,
        radius: Double = 10.0
    ): NetworkResult<List<Store>> {
        return safeApiCallWithRetry(errorHandler) {
            val response = storeApiService.getNearbyStores(latitude, longitude, radius)
            response.data
        }
    }

    /**
     * Search stores by query
     */
    suspend fun searchStores(query: String): NetworkResult<List<Store>> {
        return safeApiCallWithRetry(errorHandler) {
            val response = storeApiService.searchStores(query)
            response.data
        }
    }

    /**
     * Clear the cache
     */
    fun clearCache() {
        cachedStores = null
        cacheTimestamp = 0
    }

    /**
     * Check if cache is still valid
     */
    private fun isCacheValid(): Boolean {
        return cachedStores != null && 
               (System.currentTimeMillis() - cacheTimestamp) < cacheValidityDuration
    }

    /**
     * Get cached stores synchronously (for offline mode)
     */
    fun getCachedStores(): List<Store>? = cachedStores
}

