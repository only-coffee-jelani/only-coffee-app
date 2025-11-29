package com.onlycoffee.app.data.api

import kotlinx.serialization.Serializable

/**
 * Generic API Response Wrapper - Enterprise Level
 * 
 * All backend API endpoints return responses in this standardized format:
 * {
 *   "success": true/false,
 *   "data": T (single object or array),
 *   "count": number (optional, for list responses),
 *   "message": string (optional, for error messages)
 * }
 * 
 * This wrapper provides type-safe deserialization and error handling.
 * 
 * @param T The type of data being returned
 * @property success Whether the request was successful
 * @property data The actual response data
 * @property count Number of items (for list responses)
 * @property message Optional message (typically for errors)
 */
@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T,
    val count: Int? = null,
    val message: String? = null
) {
    /**
     * Check if response is successful and has data
     */
    fun isSuccessful(): Boolean = success
    
    /**
     * Get data or throw exception if not successful
     */
    fun getDataOrThrow(): T {
        if (!success) {
            throw ApiException(message ?: "API request failed")
        }
        return data
    }
}

/**
 * API Response for list data
 * Convenience type alias for better readability
 */
typealias ApiListResponse<T> = ApiResponse<List<T>>

/**
 * API Response for single object data
 * Convenience type alias for better readability
 */
typealias ApiSingleResponse<T> = ApiResponse<T>

/**
 * Custom exception for API errors
 * 
 * @property message Error message from API or client
 * @property statusCode HTTP status code (if available)
 * @property errorCode Application-specific error code (if available)
 */
class ApiException(
    message: String,
    val statusCode: Int? = null,
    val errorCode: String? = null,
    cause: Throwable? = null
) : Exception(message, cause) {
    
    companion object {
        /**
         * Create ApiException from HTTP status code
         */
        fun fromStatusCode(statusCode: Int, message: String? = null): ApiException {
            val errorMessage = message ?: when (statusCode) {
                400 -> "Bad request - Invalid parameters"
                401 -> "Unauthorized - Please log in"
                403 -> "Forbidden - Access denied"
                404 -> "Not found - Resource does not exist"
                408 -> "Request timeout - Please try again"
                429 -> "Too many requests - Please slow down"
                500 -> "Internal server error - Please try again later"
                502 -> "Bad gateway - Service temporarily unavailable"
                503 -> "Service unavailable - Please try again later"
                504 -> "Gateway timeout - Please try again"
                else -> "Request failed with status $statusCode"
            }
            return ApiException(errorMessage, statusCode)
        }
        
        /**
         * Create ApiException from network error
         */
        fun fromNetworkError(cause: Throwable): ApiException {
            return ApiException(
                message = "Network error - Please check your connection",
                cause = cause
            )
        }
        
        /**
         * Create ApiException from parsing error
         */
        fun fromParsingError(cause: Throwable): ApiException {
            return ApiException(
                message = "Failed to parse response - Please try again",
                cause = cause
            )
        }
    }
    
    /**
     * Check if error is due to network connectivity
     */
    fun isNetworkError(): Boolean {
        return cause is java.net.UnknownHostException ||
               cause is java.net.SocketTimeoutException ||
               cause is java.net.ConnectException ||
               statusCode == null
    }
    
    /**
     * Check if error is due to server issues (5xx)
     */
    fun isServerError(): Boolean {
        return statusCode != null && statusCode >= 500
    }
    
    /**
     * Check if error is due to client issues (4xx)
     */
    fun isClientError(): Boolean {
        return statusCode != null && statusCode in 400..499
    }
    
    /**
     * Get user-friendly error message
     */
    fun getUserMessage(): String {
        return when {
            isNetworkError() -> "Unable to connect. Please check your internet connection."
            isServerError() -> "Server error. Please try again later."
            statusCode == 401 -> "Please log in to continue."
            statusCode == 403 -> "You don't have permission to access this."
            statusCode == 404 -> "The requested resource was not found."
            else -> message ?: "Something went wrong. Please try again."
        }
    }
}

/**
 * Result wrapper for API calls
 * Provides a type-safe way to handle success and failure cases
 */
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val exception: ApiException) : ApiResult<Nothing>()
    object Loading : ApiResult<Nothing>()
    
    /**
     * Check if result is successful
     */
    fun isSuccess(): Boolean = this is Success
    
    /**
     * Check if result is error
     */
    fun isError(): Boolean = this is Error
    
    /**
     * Check if result is loading
     */
    fun isLoading(): Boolean = this is Loading
    
    /**
     * Get data or null
     */
    fun getOrNull(): T? = when (this) {
        is Success -> data
        else -> null
    }
    
    /**
     * Get data or throw exception
     */
    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Error -> throw exception
        is Loading -> throw IllegalStateException("Cannot get data while loading")
    }
    
    /**
     * Map success data to another type
     */
    fun <R> map(transform: (T) -> R): ApiResult<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
        is Loading -> this
    }
}

