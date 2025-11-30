package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.*
import retrofit2.http.*

/**
 * Payment API Service for Stripe payment processing
 */
interface PaymentApiService {
    
    /**
     * Create a payment intent for an order
     */
    @POST("payments/create-intent")
    suspend fun createPaymentIntent(
        @Body request: CreatePaymentIntentRequest
    ): PaymentIntentResponse
    
    /**
     * Confirm a payment after successful Stripe payment
     */
    @POST("payments/confirm")
    suspend fun confirmPayment(
        @Body request: ConfirmPaymentRequest
    ): ConfirmPaymentResponse
    
    /**
     * Get payment intent details
     */
    @GET("payments/intent/{paymentIntentId}")
    suspend fun getPaymentIntent(
        @Path("paymentIntentId") paymentIntentId: String
    ): PaymentIntentResponse
    
    /**
     * Cancel a payment intent
     */
    @DELETE("payments/intent/{paymentIntentId}")
    suspend fun cancelPaymentIntent(
        @Path("paymentIntentId") paymentIntentId: String
    ): PaymentIntentResponse
    
    /**
     * Get saved payment methods
     */
    @GET("payments/payment-methods")
    suspend fun getPaymentMethods(): PaymentMethodsResponse
    
    /**
     * Attach a payment method to customer
     */
    @POST("payments/payment-methods/attach")
    suspend fun attachPaymentMethod(
        @Body request: Map<String, String>
    ): PaymentMethodsResponse
    
    /**
     * Remove a payment method
     */
    @DELETE("payments/payment-methods/{paymentMethodId}")
    suspend fun detachPaymentMethod(
        @Path("paymentMethodId") paymentMethodId: String
    ): PaymentMethodsResponse
}

