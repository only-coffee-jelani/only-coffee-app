package com.onlycoffee.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Request to register device token for push notifications
 */
data class RegisterDeviceTokenRequest(
    @SerializedName("deviceToken")
    val deviceToken: String,
    @SerializedName("platform")
    val platform: String // "android" or "ios"
)

/**
 * Response from registering device token
 */
data class RegisterDeviceTokenResponse(
    val success: Boolean,
    val message: String
)

/**
 * Notification preferences for a user
 */
data class NotificationPreferences(
    @SerializedName("push_enabled")
    val pushEnabled: Boolean = true,
    @SerializedName("email_enabled")
    val emailEnabled: Boolean = true,
    @SerializedName("sms_enabled")
    val smsEnabled: Boolean = false,
    @SerializedName("order_updates")
    val orderUpdates: Boolean = true,
    @SerializedName("promotions")
    val promotions: Boolean = true,
    @SerializedName("loyalty_rewards")
    val loyaltyRewards: Boolean = true
)

/**
 * Request to update notification preferences
 */
data class UpdateNotificationPreferencesRequest(
    @SerializedName("push_enabled")
    val pushEnabled: Boolean? = null,
    @SerializedName("email_enabled")
    val emailEnabled: Boolean? = null,
    @SerializedName("sms_enabled")
    val smsEnabled: Boolean? = null,
    @SerializedName("order_updates")
    val orderUpdates: Boolean? = null,
    @SerializedName("promotions")
    val promotions: Boolean? = null,
    @SerializedName("loyalty_rewards")
    val loyaltyRewards: Boolean? = null
)

/**
 * Response containing notification preferences
 */
data class NotificationPreferencesResponse(
    val success: Boolean,
    val data: NotificationPreferences
)

