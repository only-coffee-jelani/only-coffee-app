package com.onlycoffee.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable

@Parcelize
@Serializable
data class Promotion(
    val id: String,
    val title: String,
    val description: String? = null,
    val promotionType: PromotionType,
    val imageUrl: String,
    val targetMenuItemId: String? = null,
    val targetUrl: String? = null,
    val startDate: String,
    val endDate: String,
    val isActive: Boolean = true,
    val displayDuration: Int = 3, // in seconds
    val sortOrder: Int = 0
) : Parcelable

@Parcelize
@Serializable
enum class PromotionType(val displayName: String) : Parcelable {
    LAUNCH_MODAL("Launch Modal"),
    BANNER("Banner"),
    CARD("Card")
}
