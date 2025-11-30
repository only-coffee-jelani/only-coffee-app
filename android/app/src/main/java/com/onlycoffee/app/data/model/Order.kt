package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize
import java.util.*

@Parcelize
data class Order(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("store_id")
    val storeId: String,
    val items: List<OrderItem>,
    val subtotal: Double,
    val tax: Double,
    @SerializedName("discount_amount")
    val discountAmount: Double = 0.0,
    @SerializedName("applied_coupon_id")
    val appliedCouponId: String? = null,
    val total: Double,
    val status: OrderStatus,
    val channel: OrderChannel,
    @SerializedName("special_instructions")
    val specialInstructions: String? = null,
    @SerializedName("pickup_time")
    val pickupTime: Date? = null,
    @SerializedName("created_at")
    val createdAt: Date,
    @SerializedName("updated_at")
    val updatedAt: Date
) : Parcelable

@Parcelize
data class OrderItem(
    @SerializedName("menu_item_id")
    val menuItemId: String,
    val name: String,
    val price: Double,
    val quantity: Int,
    val customizations: List<String>? = null,
    // Add-ons for drinks
    @SerializedName("espresso_shot_count")
    val espressoShotCount: Int = 0,
    @SerializedName("selected_milk_option")
    val selectedMilkOption: String? = null, // "Whole Milk", "Oat Milk", etc.
    @SerializedName("extra_milk_shot")
    val extraMilkShot: Boolean = false
) : Parcelable {

    companion object {
        const val ESPRESSO_SHOT_PRICE = 1.50
        const val MILK_UPGRADE_PRICE = 0.50
        const val EXTRA_MILK_SHOT_PRICE = 0.50
        const val DEFAULT_MILK = "Whole Milk"
    }

    /**
     * Calculate add-ons price
     */
    val addOnsPrice: Double
        get() {
            var addOns = 0.0

            // Espresso shots
            addOns += espressoShotCount * ESPRESSO_SHOT_PRICE

            // Milk upgrade (alternative milks cost extra)
            if (selectedMilkOption != null && selectedMilkOption != DEFAULT_MILK) {
                addOns += MILK_UPGRADE_PRICE
            }

            // Extra milk shot
            if (extraMilkShot) {
                addOns += EXTRA_MILK_SHOT_PRICE
            }

            return addOns
        }

    /**
     * Calculate total price including base price, add-ons, and quantity
     */
    val totalPrice: Double
        get() = (price + addOnsPrice) * quantity

    /**
     * Get formatted customizations including add-ons
     */
    val formattedCustomizations: List<String>
        get() {
            val allCustomizations = mutableListOf<String>()

            // Add original customizations
            customizations?.let { allCustomizations.addAll(it) }

            // Add espresso shots
            if (espressoShotCount > 0) {
                allCustomizations.add("$espressoShotCount Extra Espresso Shot${if (espressoShotCount > 1) "s" else ""}")
            }

            // Add milk option
            if (selectedMilkOption != null && selectedMilkOption != DEFAULT_MILK) {
                allCustomizations.add(selectedMilkOption)
            }

            // Add extra milk shot
            if (extraMilkShot) {
                allCustomizations.add("Extra Milk Shot")
            }

            return allCustomizations
        }
}

enum class OrderStatus {
    @SerializedName("pending")
    PENDING,

    @SerializedName("confirmed")
    CONFIRMED,

    @SerializedName("preparing")
    PREPARING,

    @SerializedName("ready")
    READY,

    @SerializedName("completed")
    COMPLETED,

    @SerializedName("cancelled")
    CANCELLED,

    @SerializedName("payment_failed")
    PAYMENT_FAILED
}

enum class OrderChannel {
    @SerializedName("app_only")
    APP_ONLY,

    @SerializedName("in_store")
    IN_STORE
}

// Request/Response models
/**
 * Create Order Request - matches backend CreateOrderDto exactly
 * Enterprise-level: All field names must match backend DTO (camelCase)
 */
data class CreateOrderRequest(
    val storeId: String,  // camelCase to match backend
    val items: List<CreateOrderItem>,
    val orderType: String? = "PICKUP",  // Optional: pickup, delivery, etc.
    val pickupTime: String,  // Required: Either "ASAP" or ISO date string
    val specialInstructions: String? = null,
    val couponId: String? = null
)

/**
 * Create Order Item - matches backend OrderItemDto exactly
 * Enterprise-level: All required fields must be provided
 */
data class CreateOrderItem(
    val menuItemId: String,  // camelCase to match backend
    val itemName: String,  // Required: Item name
    val quantity: Int,  // Required: Quantity
    val basePrice: Double,  // Required: Base price per item
    val modifiersPrice: Double? = null,  // Optional: Additional modifiers cost
    val totalPrice: Double,  // Required: Total price (basePrice + modifiersPrice) * quantity
    val modifiers: List<OrderModifier>? = null,  // Optional: List of modifiers
    val specialInstructions: String? = null  // Optional: Item-specific instructions
)

/**
 * Order Modifier - for customizations
 */
data class OrderModifier(
    val name: String,
    val value: String,
    val price: Double
)

/**
 * Response from creating an order (matches backend response exactly)
 * Enterprise-level: Backend returns camelCase fields with numeric values as strings
 */
data class CreateOrderResponse(
    val orderId: String,
    val userId: String?,
    val storeId: String,
    val orderStatusId: String,
    val subtotal: String, // Backend returns numeric values as strings
    val tax: String,
    val discountTotal: String,
    val total: String,
    val pickupTime: String?,
    val paymentMethodId: String?,
    val placedAt: String,
    val createdAt: String,
    val updatedAt: String,
    val orderItems: List<CreateOrderItemResponse>
) {
    /**
     * Convert backend response to internal Order model
     */
    fun toOrder(): Order {
        return Order(
            id = orderId,
            userId = userId ?: "",
            storeId = storeId,
            items = orderItems.map { it.toOrderItem() },
            subtotal = subtotal.toDoubleOrNull() ?: 0.0,
            tax = tax.toDoubleOrNull() ?: 0.0,
            discountAmount = discountTotal.toDoubleOrNull() ?: 0.0,
            appliedCouponId = null,
            total = total.toDoubleOrNull() ?: 0.0,
            status = OrderStatus.PENDING,
            channel = OrderChannel.APP_ONLY,
            specialInstructions = null,
            pickupTime = null,
            createdAt = Date(),
            updatedAt = Date()
        )
    }
}

/**
 * Order item in create order response
 */
data class CreateOrderItemResponse(
    val orderItemId: String,
    val orderId: String,
    val menuItemId: String,
    val quantity: Int,
    val unitPrice: Double,
    val createdAt: String
) {
    fun toOrderItem(): OrderItem {
        return OrderItem(
            menuItemId = menuItemId,
            name = "",
            price = unitPrice,
            quantity = quantity,
            customizations = null
        )
    }
}

data class OrderResponse(
    val success: Boolean,
    val data: Order,
    val message: String? = null
)

data class OrdersListResponse(
    val success: Boolean,
    val data: List<Order>
)
