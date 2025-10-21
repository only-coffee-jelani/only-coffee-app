package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.LoyaltyApiService
import com.onlycoffee.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LoyaltyRepository @Inject constructor(
    private val apiService: LoyaltyApiService
) {

    // MARK: - Streak Methods

    suspend fun getMyStreak(): Result<UserStreak> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyStreak()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch streak data"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyVisits(
        startDate: String? = null,
        endDate: String? = null
    ): Result<List<StreakVisit>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyVisits(startDate, endDate)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch visits"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun hasVisitedToday(): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.hasVisitedToday()
            if (response.success) {
                Result.success(response.data.visited)
            } else {
                Result.failure(Exception("Failed to check visit status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // MARK: - Rewards Methods

    suspend fun getStreakRewards(): Result<List<StreakReward>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getStreakRewards()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch rewards"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getNextMilestone(): Result<NextMilestone> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getNextMilestone()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch next milestone"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // MARK: - Token Methods

    suspend fun getMyTokens(status: String? = null): Result<List<StreakSaverToken>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyTokens(status)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch tokens"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAvailableTokenCount(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAvailableTokenCount()
            if (response.success) {
                Result.success(response.data.count)
            } else {
                Result.failure(Exception("Failed to fetch token count"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun useToken(missedDate: String): Result<UseTokenResponse> = withContext(Dispatchers.IO) {
        try {
            val request = UseTokenRequest(missedDate)
            val response = apiService.useToken(request)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // MARK: - Tier Methods

    suspend fun getMyTier(): Result<TierProgress> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyTier()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch tier progress"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyTierPerks(): Result<List<TierPerk>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyTierPerks()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch tier perks"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // MARK: - Anniversary Methods

    suspend fun getMyAnniversaries(): Result<List<AnniversaryReward>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyAnniversaries()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch anniversaries"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getNextAnniversary(): Result<NextAnniversary> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getNextAnniversary()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch next anniversary"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // MARK: - Dashboard Method

    suspend fun getDashboard(): Result<LoyaltyDashboard> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getDashboard()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch loyalty dashboard"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
