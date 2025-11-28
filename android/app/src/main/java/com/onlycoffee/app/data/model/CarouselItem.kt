package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize

/**
 * CarouselItem model matching backend API response
 * Backend returns: carouselItemId, title, subtitle, imageAsset, sortOrder, etc.
 */
@Parcelize
data class CarouselItem(
    @SerializedName("carouselItemId")
    val id: String,

    @SerializedName("carouselId")
    val carouselId: String,

    @SerializedName("title")
    val title: String? = null,

    @SerializedName("subtitle")
    val subtitle: String? = null,

    @SerializedName("imageAsset")
    val imageAsset: ImageAsset? = null,

    @SerializedName("deeplink")
    val deeplink: String? = null,

    @SerializedName("sortOrder")
    val sortOrder: Int = 0,

    @SerializedName("isActive")
    val isActive: Boolean = true,

    @SerializedName("startAt")
    val startAt: String? = null,

    @SerializedName("endAt")
    val endAt: String? = null,

    @SerializedName("createdAt")
    val createdAt: String? = null,

    @SerializedName("updatedAt")
    val updatedAt: String? = null,

    @SerializedName("carousel")
    val carousel: Carousel? = null
) : Parcelable {
    /**
     * Get the image URL from the nested imageAsset object
     */
    val imageUrl: String
        get() = imageAsset?.url ?: ""
}

/**
 * Carousel container model
 */
@Parcelize
data class Carousel(
    @SerializedName("carouselId")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("placement")
    val placement: String,

    @SerializedName("isActive")
    val isActive: Boolean = true
) : Parcelable

