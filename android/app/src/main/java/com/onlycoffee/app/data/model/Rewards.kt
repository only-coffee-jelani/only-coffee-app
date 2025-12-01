package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize
import java.util.Date

/**
 * Rewards Summary Model
 * Contains user's loyalty points, tier information, and benefits
 * 
 * Enterprise-level data model with proper serialization and validation
 */
@Parcelize
data class RewardsSummary(
    @SerializedName("currentPoints")
    val currentPoints: Int,
    
    @SerializedName("currentTier")
    val currentTier: String,
    
    @SerializedName("nextTier")
    val nextTier: String?,
    
    @SerializedName("pointsToNextTier")
    val pointsToNextTier: Int?,
    
    @SerializedName("expiringPointsNext30Days")
    val expiringPointsNext30Days: Int,
    
    @SerializedName("redemptionValue")
    val redemptionValue: Double,
    
    @SerializedName("tierBenefits")
    val tierBenefits: List<String>
) : Parcelable {
    /**
     * Calculate progress percentage to next tier
     */
    val progressToNextTier: Float
        get() {
            if (pointsToNextTier == null || pointsToNextTier == 0) return 1.0f
            val tierThreshold = getTierThreshold(nextTier ?: "")
            val currentTierThreshold = getTierThreshold(currentTier)
            val totalPointsNeeded = tierThreshold - currentTierThreshold
            val pointsEarned = currentPoints - currentTierThreshold
            return if (totalPointsNeeded > 0) {
                (pointsEarned.toFloat() / totalPointsNeeded).coerceIn(0f, 1f)
            } else 1.0f
        }
    
    /**
     * Check if user has points expiring soon
     */
    val hasExpiringPoints: Boolean
        get() = expiringPointsNext30Days > 0
    
    /**
     * Get tier threshold points
     */
    private fun getTierThreshold(tier: String): Int {
        return when (tier.lowercase()) {
            "bronze" -> 0
            "silver" -> 500
            "gold" -> 1500
            "platinum" -> 3000
            "black" -> 5000
            else -> 0
        }
    }
}

/**
 * Loyalty Ledger Entry Model
 * Represents a single transaction in the loyalty ledger
 */
@Parcelize
data class LoyaltyLedgerEntry(
    @SerializedName("loyaltyLedgerId")
    val loyaltyLedgerId: String,
    
    @SerializedName("userId")
    val userId: String,
    
    @SerializedName("pointsDelta")
    val pointsDelta: Int,
    
    @SerializedName("reason")
    val reason: String?,
    
    @SerializedName("orderId")
    val orderId: String?,
    
    @SerializedName("createdAt")
    val createdAt: Date
) : Parcelable {
    /**
     * Check if this is a points earned transaction
     */
    val isEarned: Boolean
        get() = pointsDelta > 0
    
    /**
     * Get formatted points display
     */
    val formattedPoints: String
        get() = if (pointsDelta > 0) "+$pointsDelta" else "$pointsDelta"
    
    /**
     * Get display reason with fallback
     */
    val displayReason: String
        get() = reason ?: if (isEarned) "Points earned" else "Points redeemed"
}

/**
 * Rewards History Response Model
 */
data class RewardsHistoryResponse(
    @SerializedName("history")
    val history: List<LoyaltyLedgerEntry>,
    
    @SerializedName("totalCount")
    val totalCount: Int
)

/**
 * Redeem Points Request Model
 */
data class RedeemPointsRequest(
    @SerializedName("points")
    val points: Int,
    
    @SerializedName("orderId")
    val orderId: String? = null,
    
    @SerializedName("description")
    val description: String? = null
)

/**
 * Redeem Points Response Model
 */
data class RedeemPointsResponse(
    @SerializedName("ledgerEntry")
    val ledgerEntry: LoyaltyLedgerEntry,
    
    @SerializedName("discountAmount")
    val discountAmount: Double
)

