package com.onlycoffee.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Personalized offer model matching backend API
 */
data class PersonalizedOffer(
    val id: String,
    val title: String,
    val description: String,
    val offerType: OfferType,
    val discountValue: Double,
    val minPurchaseAmount: Double? = null,
    val maxDiscountAmount: Double? = null,
    val applicableMenuItemIds: List<String>? = null,
    val applicableCategories: List<String>? = null,
    val validFrom: String,
    val validUntil: String,
    val usageLimit: Int? = null,
    val usageCount: Int = 0,
    val source: OfferSource,
    val priority: Int = 0,
    val imageUrl: String? = null,
    val termsAndConditions: String? = null,
    val isActive: Boolean = true,
    val createdAt: String,
    val updatedAt: String
)

/**
 * Offer types
 */
enum class OfferType {
    @SerializedName("PERCENTAGE_OFF")
    PERCENTAGE_OFF,
    
    @SerializedName("FIXED_AMOUNT_OFF")
    FIXED_AMOUNT_OFF,
    
    @SerializedName("FREE_ITEM")
    FREE_ITEM,
    
    @SerializedName("BUY_ONE_GET_ONE")
    BUY_ONE_GET_ONE
}

/**
 * Offer sources
 */
enum class OfferSource {
    @SerializedName("ai_generated")
    AI_GENERATED,
    
    @SerializedName("manual")
    MANUAL,
    
    @SerializedName("geofence")
    GEOFENCE,
    
    @SerializedName("bandit")
    BANDIT,
    
    @SerializedName("trigger")
    TRIGGER
}

/**
 * Personalized offers response
 */
data class PersonalizedOffersResponse(
    val success: Boolean,
    val data: PersonalizedOffersData
)

data class PersonalizedOffersData(
    val offers: List<PersonalizedOffer>,
    val userSegment: String? = null,
    val churnRisk: Double? = null
)

/**
 * Extension functions for offer display
 */
fun PersonalizedOffer.getDisplayDiscount(): String {
    return when (offerType) {
        OfferType.PERCENTAGE_OFF -> "${discountValue.toInt()}% OFF"
        OfferType.FIXED_AMOUNT_OFF -> "$${discountValue.toInt()} OFF"
        OfferType.FREE_ITEM -> "FREE"
        OfferType.BUY_ONE_GET_ONE -> "BOGO"
    }
}

fun PersonalizedOffer.getSourceLabel(): String {
    return when (source) {
        OfferSource.AI_GENERATED -> "Personalized for You"
        OfferSource.MANUAL -> "Special Offer"
        OfferSource.GEOFENCE -> "Nearby Store Offer"
        OfferSource.BANDIT -> "Recommended"
        OfferSource.TRIGGER -> "Limited Time"
    }
}

fun PersonalizedOffer.isExpiringSoon(): Boolean {
    // Check if offer expires within 24 hours
    // TODO: Implement proper date parsing and comparison
    return false
}

fun PersonalizedOffer.canBeUsed(): Boolean {
    return isActive && (usageLimit == null || usageCount < usageLimit)
}

