package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.RedeemPointsRequest
import com.onlycoffee.app.data.model.RedeemPointsResponse
import com.onlycoffee.app.data.model.RewardsHistoryResponse
import com.onlycoffee.app.data.model.RewardsSummary
import retrofit2.Response
import retrofit2.http.*

/**
 * Rewards API Service
 * 
 * Enterprise-level API interface for rewards and loyalty operations
 * All endpoints require authentication via Bearer token
 * 
 * Base URL: /api/v1/rewards
 */
interface RewardsApiService {
    
    /**
     * Get loyalty summary for current user
     * 
     * Returns current points, tier information, and benefits
     * 
     * @return RewardsSummary containing loyalty information
     * @throws 401 if not authenticated
     * @throws 404 if user not found
     */
    @GET("summary")
    suspend fun getLoyaltySummary(): Response<RewardsSummary>
    
    /**
     * Get rewards history for current user
     * 
     * Returns paginated list of loyalty ledger entries
     * 
     * @param limit Maximum number of entries to return (default: 50)
     * @return RewardsHistoryResponse containing ledger entries
     * @throws 401 if not authenticated
     */
    @GET("history")
    suspend fun getRewardsHistory(
        @Query("limit") limit: Int = 50
    ): Response<RewardsHistoryResponse>
    
    /**
     * Redeem points for discount
     * 
     * Converts loyalty points into a discount code
     * Points must be redeemed in multiples of 500
     * 
     * @param request RedeemPointsRequest containing points to redeem
     * @return RedeemPointsResponse with discount information
     * @throws 400 if insufficient points or invalid amount
     * @throws 401 if not authenticated
     */
    @POST("redeem")
    suspend fun redeemPoints(
        @Body request: RedeemPointsRequest
    ): Response<RedeemPointsResponse>
}

