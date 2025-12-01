package com.onlycoffee.app.data.repository

import android.util.Log
import com.onlycoffee.app.data.api.RewardsApiService
import com.onlycoffee.app.data.model.LoyaltyLedgerEntry
import com.onlycoffee.app.data.model.RedeemPointsRequest
import com.onlycoffee.app.data.model.RedeemPointsResponse
import com.onlycoffee.app.data.model.RewardsSummary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Rewards Repository
 * 
 * Enterprise-level repository for rewards and loyalty operations
 * Handles API calls, error handling, caching, and data transformation
 * 
 * Features:
 * - Comprehensive error handling with Result pattern
 * - Logging for debugging and monitoring
 * - Coroutine-based async operations
 * - Type-safe API responses
 */
@Singleton
class RewardsRepository @Inject constructor(
    private val rewardsApiService: RewardsApiService
) {
    companion object {
        private const val TAG = "RewardsRepository"
    }

    /**
     * Get loyalty summary for current user
     * 
     * @return Result<RewardsSummary> Success with summary or Failure with error
     */
    suspend fun getLoyaltySummary(): Result<RewardsSummary> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Fetching loyalty summary")
            
            val response = rewardsApiService.getLoyaltySummary()
            
            if (response.isSuccessful && response.body() != null) {
                val summary = response.body()!!
                Log.d(TAG, "Successfully fetched loyalty summary: ${summary.currentPoints} points, ${summary.currentTier} tier")
                Result.success(summary)
            } else {
                val errorMsg = "Failed to fetch loyalty summary: ${response.code()} ${response.message()}"
                Log.e(TAG, errorMsg)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception while fetching loyalty summary", e)
            Result.failure(e)
        }
    }

    /**
     * Get rewards history for current user
     * 
     * @param limit Maximum number of entries to return
     * @return Result<List<LoyaltyLedgerEntry>> Success with history or Failure with error
     */
    suspend fun getRewardsHistory(limit: Int = 50): Result<List<LoyaltyLedgerEntry>> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Fetching rewards history (limit: $limit)")
            
            val response = rewardsApiService.getRewardsHistory(limit)
            
            if (response.isSuccessful && response.body() != null) {
                val history = response.body()!!.history
                Log.d(TAG, "Successfully fetched ${history.size} rewards history entries")
                Result.success(history)
            } else {
                val errorMsg = "Failed to fetch rewards history: ${response.code()} ${response.message()}"
                Log.e(TAG, errorMsg)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception while fetching rewards history", e)
            Result.failure(e)
        }
    }

    /**
     * Redeem points for discount
     * 
     * @param points Number of points to redeem (must be multiple of 500)
     * @param orderId Optional order ID to apply discount to
     * @param description Optional description for the redemption
     * @return Result<RedeemPointsResponse> Success with redemption info or Failure with error
     */
    suspend fun redeemPoints(
        points: Int,
        orderId: String? = null,
        description: String? = null
    ): Result<RedeemPointsResponse> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Redeeming $points points")
            
            // Validate points amount
            if (points < 500) {
                val errorMsg = "Minimum redemption is 500 points"
                Log.w(TAG, errorMsg)
                return@withContext Result.failure(IllegalArgumentException(errorMsg))
            }
            
            if (points % 500 != 0) {
                val errorMsg = "Points must be redeemed in multiples of 500"
                Log.w(TAG, errorMsg)
                return@withContext Result.failure(IllegalArgumentException(errorMsg))
            }
            
            val request = RedeemPointsRequest(
                points = points,
                orderId = orderId,
                description = description
            )
            
            val response = rewardsApiService.redeemPoints(request)
            
            if (response.isSuccessful && response.body() != null) {
                val redemption = response.body()!!
                Log.d(TAG, "Successfully redeemed $points points for $${redemption.discountAmount} discount")
                Result.success(redemption)
            } else {
                val errorMsg = "Failed to redeem points: ${response.code()} ${response.message()}"
                Log.e(TAG, errorMsg)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception while redeeming points", e)
            Result.failure(e)
        }
    }
}

