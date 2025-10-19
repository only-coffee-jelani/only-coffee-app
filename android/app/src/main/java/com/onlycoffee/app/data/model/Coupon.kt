package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize
import java.text.SimpleDateFormat
import java.util.*

@Parcelize
data class Coupon(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("promo_code_id")
    val promoCodeId: String? = null,
    val type: CouponType,
    val label: String,
    val description: String? = null,
    @SerializedName("value_cents")
    val valueCents: Int? = null,
    @SerializedName("percent_off")
    val percentOff: Int? = null,
    @SerializedName("price_override_cents")
    val priceOverrideCents: Int? = null,
    @SerializedName("eligible_items")
    val eligibleItems: EligibleItems? = null,
    val channels: String = "both",
    @SerializedName("expires_at")
    val expiresAt: Date,
    @SerializedName("redeemed_at")
    val redeemedAt: Date? = null,
    @SerializedName("redeemed_order_id")
    val redeemedOrderId: String? = null,
    val status: CouponStatus,
    val source: String,
    val metadata: Map<String, String>? = null,
    @SerializedName("created_at")
    val createdAt: Date
) : Parcelable {

    @Parcelize
    data class EligibleItems(
        val exclude: List<String>? = null,
        val include: List<String>? = null
    ) : Parcelable

    val isExpired: Boolean
        get() = Date().after(expiresAt)

    val isActive: Boolean
        get() = status == CouponStatus.ACTIVE && !isExpired

    val isExpiringSoon: Boolean
        get() {
            if (!isActive) return false
            val now = Date()
            val diffInMillis = expiresAt.time - now.time
            val hoursUntilExpiry = diffInMillis / (1000 * 60 * 60)
            return hoursUntilExpiry in 1..24
        }

    val displayValue: String
        get() = when (type) {
            CouponType.PERCENT_OFF -> "${percentOff}% OFF"
            CouponType.FIXED_PRICE -> {
                val price = (priceOverrideCents ?: 0) / 100.0
                String.format("$%.2f", price)
            }
            CouponType.FIXED_AMOUNT -> {
                val amount = (valueCents ?: 0) / 100.0
                String.format("$%.2f OFF", amount)
            }
            CouponType.FREE_ITEM -> "FREE"
        }

    val expiryText: String
        get() {
            val now = Date()
            if (now.after(expiresAt)) {
                return "Expired"
            }

            val diffInMillis = expiresAt.time - now.time
            val days = diffInMillis / (1000 * 60 * 60 * 24)
            val hours = (diffInMillis / (1000 * 60 * 60)) % 24

            return when {
                days > 1 -> "Expires in $days days"
                days == 1L -> "Expires in 1 day"
                hours > 1 -> "Expires in $hours hours"
                hours == 1L -> "Expires in 1 hour"
                else -> "Expires soon"
            }
        }

    val formattedExpiryDate: String
        get() {
            val format = SimpleDateFormat("MMM dd, yyyy 'at' hh:mm a", Locale.getDefault())
            return format.format(expiresAt)
        }

    val channelText: String
        get() = when (channels) {
            "app_only" -> "App Only"
            "store_only" -> "In-Store Only"
            else -> "App & In-Store"
        }
}

enum class CouponType {
    @SerializedName("percent_off")
    PERCENT_OFF,

    @SerializedName("fixed_price")
    FIXED_PRICE,

    @SerializedName("fixed_amount")
    FIXED_AMOUNT,

    @SerializedName("free_item")
    FREE_ITEM
}

enum class CouponStatus {
    @SerializedName("active")
    ACTIVE,

    @SerializedName("redeemed")
    REDEEMED,

    @SerializedName("expired")
    EXPIRED,

    @SerializedName("cancelled")
    CANCELLED
}

// API Response models
data class CouponsResponse(
    val success: Boolean,
    val data: CouponsData
)

data class CouponsData(
    val active: List<Coupon>,
    val expired: List<Coupon>
)

data class RedeemPromoCodeResponse(
    val success: Boolean,
    val message: String,
    val data: List<Coupon>?
)

data class RedeemPromoCodeRequest(
    val code: String,
    @SerializedName("idempotency_key")
    val idempotencyKey: String? = null
)

data class RedeemCouponRequest(
    @SerializedName("coupon_id")
    val couponId: String,
    @SerializedName("order_id")
    val orderId: String
)

data class CouponResponse(
    val success: Boolean,
    val data: Coupon
)
