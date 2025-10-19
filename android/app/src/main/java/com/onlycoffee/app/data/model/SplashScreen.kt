package com.onlycoffee.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable

@Parcelize
@Serializable
data class SplashScreen(
    val id: String,
    val title: String,
    val description: String? = null,
    val imageUrl: String,
    val displayDuration: Int = 3, // in seconds
    val targetMenuItemId: String? = null,
    val targetUrl: String? = null,
    val isActive: Boolean = true,
    val startDate: String? = null,
    val endDate: String? = null,
    val impressions: Int = 0,
    val clicks: Int = 0,
    val skips: Int = 0,
    val ctr: String = "0.00",
    val skipRate: String = "0.00",
    val associatedOrders: Int = 0,
    val associatedRevenue: String = "0.00",
    val conversionRate: String = "0.00",
    val averageOrderValue: String = "0.00",
    val uniqueUsersShown: Int = 0,
    val uniqueUsersClicked: Int = 0,
    val averageViewTime: String = "0.00",
    val lastImpressionAt: String? = null,
    val lastClickAt: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val replacedAt: String? = null,
    val replacedById: String? = null,
    val createdById: String? = null
) : Parcelable

