package com.onlycoffee.app.utils

/**
 * A sealed class representing the result of a network operation.
 * Provides type-safe error handling and success states.
 */
sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val exception: NetworkException) : NetworkResult<Nothing>()
    object Loading : NetworkResult<Nothing>()
}

/**
 * Custom exception types for network operations
 */
sealed class NetworkException(message: String, cause: Throwable? = null) : Exception(message, cause) {
    class NoInternetException : NetworkException("No internet connection. Please check your network settings.")
    class TimeoutException : NetworkException("Request timed out. Please try again.")
    class ServerException(val code: Int, message: String) : NetworkException("Server error ($code): $message")
    class UnauthorizedException : NetworkException("Session expired. Please log in again.")
    class NotFoundException : NetworkException("The requested resource was not found.")
    class BadRequestException(message: String) : NetworkException("Invalid request: $message")
    class ConflictException(message: String) : NetworkException(message)
    class UnknownException(cause: Throwable) : NetworkException("An unexpected error occurred: ${cause.message}", cause)
}

/**
 * Extension function to convert NetworkResult to a simple Result type
 */
fun <T> NetworkResult<T>.toResult(): Result<T> = when (this) {
    is NetworkResult.Success -> Result.success(data)
    is NetworkResult.Error -> Result.failure(exception)
    is NetworkResult.Loading -> Result.failure(IllegalStateException("Operation still in progress"))
}

/**
 * Extension function to map success data
 */
fun <T, R> NetworkResult<T>.map(transform: (T) -> R): NetworkResult<R> = when (this) {
    is NetworkResult.Success -> NetworkResult.Success(transform(data))
    is NetworkResult.Error -> NetworkResult.Error(exception)
    is NetworkResult.Loading -> NetworkResult.Loading
}

/**
 * Extension function to handle success and error cases
 */
inline fun <T> NetworkResult<T>.onSuccess(action: (T) -> Unit): NetworkResult<T> {
    if (this is NetworkResult.Success) {
        action(data)
    }
    return this
}

inline fun <T> NetworkResult<T>.onError(action: (NetworkException) -> Unit): NetworkResult<T> {
    if (this is NetworkResult.Error) {
        action(exception)
    }
    return this
}

inline fun <T> NetworkResult<T>.onLoading(action: () -> Unit): NetworkResult<T> {
    if (this is NetworkResult.Loading) {
        action()
    }
    return this
}

/**
 * Get data or null
 */
fun <T> NetworkResult<T>.getOrNull(): T? = when (this) {
    is NetworkResult.Success -> data
    else -> null
}

/**
 * Get data or default value
 */
fun <T> NetworkResult<T>.getOrDefault(default: T): T = when (this) {
    is NetworkResult.Success -> data
    else -> default
}

/**
 * Get data or throw exception
 */
fun <T> NetworkResult<T>.getOrThrow(): T = when (this) {
    is NetworkResult.Success -> data
    is NetworkResult.Error -> throw exception
    is NetworkResult.Loading -> throw IllegalStateException("Operation still in progress")
}

