package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.PaymentApiService
import com.onlycoffee.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for handling payment operations with Stripe
 */
@Singleton
class PaymentRepository @Inject constructor(
    private val paymentApiService: PaymentApiService
) {
    
    /**
     * Create a payment intent for an order
     * Enterprise-level: Backend returns raw PaymentIntentResponse (not wrapped)
     * @param orderId The order ID to create payment for
     * @param amount Amount in cents (e.g., 1050 for $10.50)
     * @param description Optional payment description
     * @return Result containing PaymentIntentResponse with clientSecret
     */
    suspend fun createPaymentIntent(
        orderId: String,
        amount: Int,
        description: String? = null
    ): Result<PaymentIntentResponse> = withContext(Dispatchers.IO) {
        try {
            val request = CreatePaymentIntentRequest(
                orderId = orderId,
                amount = amount,
                description = description
            )
            val response = paymentApiService.createPaymentIntent(request)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Confirm a payment after successful Stripe payment
     * Enterprise-level: Backend returns raw ConfirmPaymentResponse (not wrapped)
     * @param paymentIntentId The Stripe payment intent ID
     * @param orderId The order ID
     * @return Result containing ConfirmPaymentResponse
     */
    suspend fun confirmPayment(
        paymentIntentId: String,
        orderId: String
    ): Result<ConfirmPaymentResponse> = withContext(Dispatchers.IO) {
        try {
            val request = ConfirmPaymentRequest(
                paymentIntentId = paymentIntentId,
                orderId = orderId
            )
            val response = paymentApiService.confirmPayment(request)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Get payment intent details
     * Enterprise-level: Returns Stripe PaymentIntent object directly
     * Note: This method is not currently used in the app
     */
    suspend fun getPaymentIntent(paymentIntentId: String): Result<Any> =
        withContext(Dispatchers.IO) {
            try {
                val response = paymentApiService.getPaymentIntent(paymentIntentId)
                Result.success(response)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Cancel a payment intent
     * Enterprise-level: Returns Stripe PaymentIntent object directly
     * Note: This method is not currently used in the app
     */
    suspend fun cancelPaymentIntent(paymentIntentId: String): Result<Any> =
        withContext(Dispatchers.IO) {
            try {
                val response = paymentApiService.cancelPaymentIntent(paymentIntentId)
                Result.success(response)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    
    /**
     * Get saved payment methods
     */
    suspend fun getPaymentMethods(): Result<List<PaymentMethod>> = withContext(Dispatchers.IO) {
        try {
            val response = paymentApiService.getPaymentMethods()
            
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to get payment methods"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Attach a payment method to customer
     */
    suspend fun attachPaymentMethod(paymentMethodId: String): Result<List<PaymentMethod>> = 
        withContext(Dispatchers.IO) {
            try {
                val request = mapOf("paymentMethodId" to paymentMethodId)
                val response = paymentApiService.attachPaymentMethod(request)
                
                if (response.success) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.message ?: "Failed to attach payment method"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}

