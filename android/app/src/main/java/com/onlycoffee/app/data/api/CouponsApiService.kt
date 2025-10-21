package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.*
import retrofit2.http.*

interface CouponsApiService {

    /**
     * Get user's coupons (active and expired)
     */
    @GET("v1/coupons/my-coupons")
    suspend fun getMyCoupons(): CouponsResponse

    /**
     * Redeem a promo code to receive coupons
     */
    @POST("v1/coupons/redeem-code")
    suspend fun redeemPromoCode(
        @Body request: RedeemPromoCodeRequest,
        @Header("idempotency-key") idempotencyKey: String? = null
    ): RedeemPromoCodeResponse

    /**
     * Get a specific coupon by ID
     */
    @GET("v1/coupons/{id}")
    suspend fun getCoupon(@Path("id") couponId: String): CouponResponse

    /**
     * Redeem a coupon on an order
     */
    @POST("v1/coupons/redeem")
    suspend fun redeemCoupon(
        @Body request: RedeemCouponRequest
    ): CouponResponse
}
