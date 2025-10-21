package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.*
import retrofit2.http.*

interface LoyaltyApiService {

    // MARK: - Streak Endpoints

    /**
     * Get current user's streak data
     */
    @GET("v1/loyalty/streak")
    suspend fun getMyStreak(): StreakResponse

    /**
     * Get user's visit history
     */
    @GET("v1/loyalty/visits")
    suspend fun getMyVisits(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): VisitsResponse

    /**
     * Check if user visited today
     */
    @GET("v1/loyalty/visited-today")
    suspend fun hasVisitedToday(): VisitedTodayResponse

    // MARK: - Rewards Endpoints

    /**
     * Get all streak rewards (milestone rewards)
     */
    @GET("v1/loyalty/rewards")
    suspend fun getStreakRewards(): RewardsResponse

    /**
     * Get next milestone reward for current user
     */
    @GET("v1/loyalty/rewards/next-milestone")
    suspend fun getNextMilestone(): NextMilestoneResponse

    /**
     * Get user's granted streak rewards
     */
    @GET("v1/loyalty/rewards/mine")
    suspend fun getMyStreakRewards(): RewardsResponse

    // MARK: - Streak Saver Token Endpoints

    /**
     * Get current user's tokens
     */
    @GET("v1/loyalty/tokens")
    suspend fun getMyTokens(
        @Query("status") status: String? = null
    ): TokensResponse

    /**
     * Get available token count
     */
    @GET("v1/loyalty/tokens/available-count")
    suspend fun getAvailableTokenCount(): TokenCountResponse

    /**
     * Check if user can use a token
     */
    @GET("v1/loyalty/tokens/can-use")
    suspend fun canUseToken(): UseTokenResponse

    /**
     * Use a streak saver token
     */
    @POST("v1/loyalty/tokens/use")
    suspend fun useToken(
        @Body request: UseTokenRequest
    ): UseTokenResponse

    // MARK: - Tier Endpoints

    /**
     * Get current user's tier info
     */
    @GET("v1/loyalty/tier")
    suspend fun getMyTier(): TierProgressResponse

    /**
     * Get tier requirements
     */
    @GET("v1/loyalty/tier/requirements")
    suspend fun getTierRequirements(): Map<String, Any>

    /**
     * Get perks for current user's tier
     */
    @GET("v1/loyalty/tier/perks")
    suspend fun getMyTierPerks(): TierPerksResponse

    /**
     * Get tier history for current user
     */
    @GET("v1/loyalty/tier/history")
    suspend fun getMyTierHistory(): List<Any> // UserTierHistory

    // MARK: - Anniversary Endpoints

    /**
     * Get current user's anniversaries
     */
    @GET("v1/loyalty/anniversaries")
    suspend fun getMyAnniversaries(): AnniversariesResponse

    /**
     * Get next anniversary info
     */
    @GET("v1/loyalty/anniversaries/next")
    suspend fun getNextAnniversary(): NextAnniversaryResponse

    /**
     * Check for upcoming anniversary
     */
    @GET("v1/loyalty/anniversaries/upcoming")
    suspend fun hasUpcomingAnniversary(): Map<String, Any>

    // MARK: - Dashboard Endpoint

    /**
     * Get complete loyalty dashboard for current user
     */
    @GET("v1/loyalty/dashboard")
    suspend fun getDashboard(): DashboardResponse
}
