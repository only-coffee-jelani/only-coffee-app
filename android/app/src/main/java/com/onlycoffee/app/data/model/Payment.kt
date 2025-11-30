package com.onlycoffee.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Payment Intent Request
 * Enterprise-level: Field names must match backend DTO exactly (camelCase)
 */
data class CreatePaymentIntentRequest(
    val orderId: String,  // camelCase to match backend
    val amount: Int, // Amount in cents
    val paymentMethodId: String? = null,  // camelCase to match backend
    val description: String? = null
)

/**
 * Payment Intent Response
 * Enterprise-level: Backend returns raw object (not wrapped in success/data)
 */
data class PaymentIntentResponse(
    val clientSecret: String,  // camelCase from backend
    val paymentIntentId: String,  // camelCase from backend
    val publishableKey: String? = null  // camelCase from backend
)

/**
 * Confirm Payment Request
 * Enterprise-level: Field names must match backend DTO exactly (camelCase)
 */
data class ConfirmPaymentRequest(
    val paymentIntentId: String,  // camelCase to match backend
    val orderId: String,  // camelCase to match backend
    val paymentMethodId: String? = null  // camelCase to match backend
)

/**
 * Confirm Payment Response
 * Enterprise-level: Backend returns raw object (not wrapped in success/data)
 */
data class ConfirmPaymentResponse(
    val orderId: String,  // camelCase from backend
    val paymentIntentId: String,  // camelCase from backend
    val status: String,
    val order: Order? = null
)

/**
 * Payment Method
 */
data class PaymentMethod(
    val id: String,
    val type: String,
    val card: CardDetails? = null,
    @SerializedName("created_at")
    val createdAt: String
)

data class CardDetails(
    val brand: String,
    @SerializedName("last4")
    val last4: String,
    @SerializedName("exp_month")
    val expMonth: Int,
    @SerializedName("exp_year")
    val expYear: Int
)

/**
 * Payment Methods List Response
 */
data class PaymentMethodsResponse(
    val success: Boolean,
    val data: List<PaymentMethod>,
    val message: String? = null
)

/**
 * Payment Status
 */
enum class PaymentStatus {
    @SerializedName("pending")
    PENDING,
    
    @SerializedName("processing")
    PROCESSING,
    
    @SerializedName("succeeded")
    SUCCEEDED,
    
    @SerializedName("failed")
    FAILED,
    
    @SerializedName("canceled")
    CANCELED
}

