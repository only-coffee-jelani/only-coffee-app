package com.onlycoffee.app.utils

import android.content.Context
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Centralized error handler for the application.
 * Converts exceptions to user-friendly NetworkException types.
 */
@Singleton
class ErrorHandler @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val TAG = "ErrorHandler"
    }

    /**
     * Handle any throwable and convert to NetworkException
     */
    fun handleException(throwable: Throwable): NetworkException {
        Log.e(TAG, "Handling exception: ${throwable.message}", throwable)
        
        return when (throwable) {
            is NetworkException -> throwable
            is UnknownHostException -> NetworkException.NoInternetException()
            is SocketTimeoutException -> NetworkException.TimeoutException()
            is IOException -> NetworkException.NoInternetException()
            is HttpException -> handleHttpException(throwable)
            else -> NetworkException.UnknownException(throwable)
        }
    }

    /**
     * Handle HTTP exceptions based on status code
     */
    private fun handleHttpException(exception: HttpException): NetworkException {
        return when (exception.code()) {
            400 -> {
                val message = parseErrorMessage(exception) ?: "Invalid request"
                NetworkException.BadRequestException(message)
            }
            401, 403 -> NetworkException.UnauthorizedException()
            404 -> NetworkException.NotFoundException()
            409 -> {
                val message = parseErrorMessage(exception) ?: "Resource already exists"
                NetworkException.ConflictException(message)
            }
            in 500..599 -> {
                val message = parseErrorMessage(exception) ?: "Server error"
                NetworkException.ServerException(exception.code(), message)
            }
            else -> NetworkException.UnknownException(exception)
        }
    }

    /**
     * Parse error message from HTTP exception response
     */
    private fun parseErrorMessage(exception: HttpException): String? {
        return try {
            exception.response()?.errorBody()?.string()?.let { errorBody ->
                // Try to parse JSON error message
                try {
                    val jsonObject = org.json.JSONObject(errorBody)
                    val message = jsonObject.optString("message")
                    if (message.isNotEmpty()) message else null
                } catch (e: Exception) {
                    // If JSON parsing fails, return raw error body (limited)
                    errorBody.take(200)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse error message", e)
            null
        }
    }

    /**
     * Get user-friendly error message
     */
    fun getUserFriendlyMessage(exception: NetworkException): String {
        return when (exception) {
            is NetworkException.NoInternetException ->
                "No internet connection. Please check your network settings."
            is NetworkException.TimeoutException ->
                "Request timed out. Please try again."
            is NetworkException.UnauthorizedException ->
                "Your session has expired. Please log in again."
            is NetworkException.NotFoundException ->
                "The requested item was not found."
            is NetworkException.BadRequestException ->
                exception.message ?: "Invalid request. Please check your input."
            is NetworkException.ConflictException ->
                exception.message ?: "This resource already exists."
            is NetworkException.ServerException ->
                "Server error. Please try again later."
            is NetworkException.UnknownException ->
                "An unexpected error occurred. Please try again."
        }
    }

    /**
     * Check if error is recoverable (user can retry)
     */
    fun isRecoverable(exception: NetworkException): Boolean {
        return when (exception) {
            is NetworkException.NoInternetException -> true
            is NetworkException.TimeoutException -> true
            is NetworkException.ServerException -> true
            is NetworkException.UnauthorizedException -> false
            is NetworkException.NotFoundException -> false
            is NetworkException.BadRequestException -> false
            is NetworkException.ConflictException -> false
            is NetworkException.UnknownException -> true
        }
    }

    /**
     * Check if error requires re-authentication
     */
    fun requiresReauth(exception: NetworkException): Boolean {
        return exception is NetworkException.UnauthorizedException
    }
}

/**
 * Extension function to safely execute a suspend function and return NetworkResult
 */
suspend fun <T> safeApiCall(
    errorHandler: ErrorHandler,
    apiCall: suspend () -> T
): NetworkResult<T> {
    return try {
        NetworkResult.Success(apiCall())
    } catch (throwable: Throwable) {
        val exception = errorHandler.handleException(throwable)
        NetworkResult.Error(exception)
    }
}

/**
 * Extension function with retry logic
 */
suspend fun <T> safeApiCallWithRetry(
    errorHandler: ErrorHandler,
    maxRetries: Int = 3,
    initialDelayMillis: Long = 1000,
    maxDelayMillis: Long = 10000,
    factor: Double = 2.0,
    apiCall: suspend () -> T
): NetworkResult<T> {
    var currentDelay = initialDelayMillis
    repeat(maxRetries) { attempt ->
        val result = safeApiCall(errorHandler, apiCall)
        
        if (result is NetworkResult.Success) {
            return result
        }
        
        if (result is NetworkResult.Error && !errorHandler.isRecoverable(result.exception)) {
            return result
        }
        
        if (attempt < maxRetries - 1) {
            kotlinx.coroutines.delay(currentDelay)
            currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelayMillis)
        }
    }
    
    // Final attempt
    return safeApiCall(errorHandler, apiCall)
}

