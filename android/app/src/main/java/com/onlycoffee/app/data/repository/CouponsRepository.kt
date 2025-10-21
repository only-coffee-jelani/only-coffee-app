package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.CouponsApiService
import com.onlycoffee.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CouponsRepository @Inject constructor(
    private val apiService: CouponsApiService
) {

    /**
     * Fetch user's coupons (active and expired)
     */
    suspend fun getMyCoupons(): Result<CouponsData> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyCoupons()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch coupons"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Redeem a promo code
     */
    suspend fun redeemPromoCode(
        code: String,
        idempotencyKey: String? = null
    ): Result<RedeemPromoCodeResponse> = withContext(Dispatchers.IO) {
        try {
            val request = RedeemPromoCodeRequest(
                code = code.trim().uppercase(),
                idempotencyKey = idempotencyKey
            )
            val response = apiService.redeemPromoCode(request, idempotencyKey)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get a specific coupon by ID
     */
    suspend fun getCoupon(couponId: String): Result<Coupon> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getCoupon(couponId)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch coupon"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Redeem a coupon on an order
     */
    suspend fun redeemCoupon(
        couponId: String,
        orderId: String
    ): Result<Coupon> = withContext(Dispatchers.IO) {
        try {
            val request = RedeemCouponRequest(
                couponId = couponId,
                orderId = orderId
            )
            val response = apiService.redeemCoupon(request)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to redeem coupon"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
