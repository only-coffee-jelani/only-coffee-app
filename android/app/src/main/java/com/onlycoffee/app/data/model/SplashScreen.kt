package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize

/**
 * SplashScreen model matching backend API response
 * Backend returns: splashId, title, subtitle, imageAsset, durationSeconds, etc.
 */
@Parcelize
data class SplashScreen(
    @SerializedName("splashId")
    val id: String,

    @SerializedName("title")
    val title: String? = null,

    @SerializedName("subtitle")
    val description: String? = null,

    @SerializedName("imageAsset")
    val imageAsset: ImageAsset? = null,

    @SerializedName("durationSeconds")
    val displayDuration: Int = 3,

    @SerializedName("deeplink")
    val targetUrl: String? = null,

    @SerializedName("isActive")
    val isActive: Boolean = true,

    @SerializedName("startAt")
    val startDate: String? = null,

    @SerializedName("endAt")
    val endDate: String? = null,

    @SerializedName("createdAt")
    val createdAt: String? = null,

    @SerializedName("updatedAt")
    val updatedAt: String? = null
) : Parcelable {
    /**
     * Get the image URL from the nested imageAsset object
     */
    val imageUrl: String
        get() = imageAsset?.url ?: ""
}

/**
 * ImageAsset model for nested imageAsset in splash screen response
 */
@Parcelize
data class ImageAsset(
    @SerializedName("assetId")
    val id: String,

    @SerializedName("url")
    val url: String,

    @SerializedName("altText")
    val altText: String? = null,

    @SerializedName("type")
    val type: String = "image"
) : Parcelable

