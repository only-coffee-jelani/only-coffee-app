package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.MenuApiService
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.utils.ErrorHandler
import com.onlycoffee.app.utils.NetworkResult
import com.onlycoffee.app.utils.safeApiCallWithRetry
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for menu-related data operations.
 * Handles API calls with error handling and retry logic.
 */
@Singleton
class MenuRepository @Inject constructor(
    private val menuApiService: MenuApiService,
    private val errorHandler: ErrorHandler
) {
    // In-memory cache for menu items
    private var cachedMenuItems: List<MenuItem>? = null
    private var cacheTimestamp: Long = 0
    private val cacheValidityDuration = 5 * 60 * 1000L // 5 minutes

    /**
     * Get all menu items with optional store filtering
     */
    suspend fun getAllMenuItems(storeId: String? = null, forceRefresh: Boolean = false): NetworkResult<List<MenuItem>> {
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && isCacheValid() && storeId == null) {
            cachedMenuItems?.let {
                return NetworkResult.Success(it)
            }
        }

        return safeApiCallWithRetry(errorHandler) {
            val dtoList = menuApiService.getAllMenuItems(storeId)
            val menuItems = dtoList.map { it.toMenuItem() }
            if (storeId == null) {
                cachedMenuItems = menuItems
                cacheTimestamp = System.currentTimeMillis()
            }
            menuItems
        }
    }

    /**
     * Get menu item by ID
     */
    suspend fun getMenuItemById(itemId: String): NetworkResult<MenuItem> {
        // Check cache first
        cachedMenuItems?.find { it.id == itemId }?.let {
            return NetworkResult.Success(it)
        }

        return safeApiCallWithRetry(errorHandler) {
            val dto = menuApiService.getMenuItemById(itemId)
            dto.toMenuItem()
        }
    }

    /**
     * Get menu items by category
     */
    suspend fun getMenuItemsByCategory(category: String, storeId: String? = null): NetworkResult<List<MenuItem>> {
        return safeApiCallWithRetry(errorHandler) {
            val dtoList = menuApiService.getMenuItemsByCategory(category, storeId)
            dtoList.map { it.toMenuItem() }
        }
    }

    /**
     * Get featured menu items
     */
    suspend fun getFeaturedItems(): NetworkResult<List<MenuItem>> {
        return safeApiCallWithRetry(errorHandler) {
            val dtoList = menuApiService.getFeaturedItems()
            dtoList.map { it.toMenuItem() }
        }
    }

    /**
     * Get popular menu items
     */
    suspend fun getPopularItems(): NetworkResult<List<MenuItem>> {
        return safeApiCallWithRetry(errorHandler) {
            val dtoList = menuApiService.getPopularItems()
            dtoList.map { it.toMenuItem() }
        }
    }

    /**
     * Clear the cache
     */
    fun clearCache() {
        cachedMenuItems = null
        cacheTimestamp = 0
    }

    /**
     * Check if cache is still valid
     */
    private fun isCacheValid(): Boolean {
        return cachedMenuItems != null && 
               (System.currentTimeMillis() - cacheTimestamp) < cacheValidityDuration
    }

    /**
     * Get cached items synchronously (for offline mode)
     */
    fun getCachedItems(): List<MenuItem>? = cachedMenuItems
}

