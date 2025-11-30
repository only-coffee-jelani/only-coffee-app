package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.OrderApiService
import com.onlycoffee.app.data.model.CreateOrderRequest
import com.onlycoffee.app.data.model.Order
import com.onlycoffee.app.utils.ErrorHandler
import com.onlycoffee.app.utils.NetworkResult
import com.onlycoffee.app.utils.safeApiCallWithRetry
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for order-related data operations.
 * Handles API calls with error handling and retry logic.
 */
@Singleton
class OrderRepository @Inject constructor(
    private val orderApiService: OrderApiService,
    private val errorHandler: ErrorHandler
) {
    // In-memory cache for orders
    private var cachedOrders: List<Order>? = null
    private var cacheTimestamp: Long = 0
    private val cacheValidityDuration = 2 * 60 * 1000L // 2 minutes (orders change frequently)

    /**
     * Get user's orders
     */
    suspend fun getMyOrders(forceRefresh: Boolean = false): NetworkResult<List<Order>> {
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && isCacheValid()) {
            cachedOrders?.let {
                return NetworkResult.Success(it)
            }
        }

        return safeApiCallWithRetry(errorHandler) {
            val response = orderApiService.getMyOrders()
            cachedOrders = response.data.sortedByDescending { it.createdAt }
            cacheTimestamp = System.currentTimeMillis()
            cachedOrders!!
        }
    }

    /**
     * Get order by ID
     */
    suspend fun getOrderById(orderId: String): NetworkResult<Order> {
        // Check cache first
        cachedOrders?.find { it.id == orderId }?.let {
            return NetworkResult.Success(it)
        }

        return safeApiCallWithRetry(errorHandler) {
            val response = orderApiService.getOrderById(orderId)
            response.data
        }
    }

    /**
     * Create a new order
     * Enterprise-level: Converts backend CreateOrderResponse to internal Order model
     */
    suspend fun createOrder(request: CreateOrderRequest): NetworkResult<Order> {
        val result = safeApiCallWithRetry(errorHandler) {
            val response = orderApiService.createOrder(request)
            // Convert CreateOrderResponse to Order
            response.toOrder()
        }

        // Invalidate cache on successful order creation
        if (result is NetworkResult.Success) {
            clearCache()
        }

        return result
    }

    /**
     * Cancel an order
     */
    suspend fun cancelOrder(orderId: String): NetworkResult<Order> {
        val result = safeApiCallWithRetry(errorHandler) {
            val response = orderApiService.cancelOrder(orderId)
            response.data
        }
        
        // Invalidate cache on successful cancellation
        if (result is NetworkResult.Success) {
            clearCache()
        }
        
        return result
    }

    /**
     * Reorder a previous order
     */
    suspend fun reorder(orderId: String): NetworkResult<Order> {
        val result = safeApiCallWithRetry(errorHandler) {
            val response = orderApiService.reorder(orderId)
            response.data
        }
        
        // Invalidate cache on successful reorder
        if (result is NetworkResult.Success) {
            clearCache()
        }
        
        return result
    }

    /**
     * Clear the cache
     */
    fun clearCache() {
        cachedOrders = null
        cacheTimestamp = 0
    }

    /**
     * Check if cache is still valid
     */
    private fun isCacheValid(): Boolean {
        return cachedOrders != null && 
               (System.currentTimeMillis() - cacheTimestamp) < cacheValidityDuration
    }

    /**
     * Get cached orders synchronously (for offline mode)
     */
    fun getCachedOrders(): List<Order>? = cachedOrders
}

