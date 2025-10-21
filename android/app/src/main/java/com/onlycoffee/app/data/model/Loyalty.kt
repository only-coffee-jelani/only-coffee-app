package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize
import java.util.*

// MARK: - User Tier Enum
enum class UserTier {
    @SerializedName("bronze")
    BRONZE,

    @SerializedName("silver")
    SILVER,

    @SerializedName("gold")
    GOLD,

    @SerializedName("platinum")
    PLATINUM,

    @SerializedName("black")
    BLACK;

    val displayName: String
        get() = name.lowercase().replaceFirstChar { it.uppercase() }
}

// MARK: - User Streak Model
@Parcelize
data class UserStreak(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("consecutive_days")
    val consecutiveDays: Int,
    @SerializedName("current_streak")
    val currentStreak: Int,
    @SerializedName("longest_streak")
    val longestStreak: Int,
    @SerializedName("last_visit_date")
    val lastVisitDate: Date? = null,
    @SerializedName("first_qualifying_purchase_date")
    val firstQualifyingPurchaseDate: Date? = null,
    @SerializedName("streak_start_date")
    val streakStartDate: Date? = null,
    @SerializedName("monthly_points")
    val monthlyPoints: Int,
    @SerializedName("tier_xp")
    val tierXP: Int,
    @SerializedName("monthly_visits")
    val monthlyVisits: Int,
    @SerializedName("annual_spend")
    val annualSpend: Double,
    @SerializedName("seven_day_streak_count")
    val sevenDayStreakCount: Int,
    @SerializedName("last_monthly_reset")
    val lastMonthlyReset: Date? = null,
    @SerializedName("created_at")
    val createdAt: Date,
    @SerializedName("updated_at")
    val updatedAt: Date
) : Parcelable

// MARK: - Streak Visit Model
@Parcelize
data class StreakVisit(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("order_id")
    val orderId: String,
    @SerializedName("visit_date")
    val visitDate: Date,
    @SerializedName("order_amount")
    val orderAmount: Double,
    @SerializedName("is_morning_rush")
    val isMorningRush: Boolean,
    @SerializedName("points_earned")
    val pointsEarned: Int,
    @SerializedName("xp_earned")
    val xpEarned: Int,
    @SerializedName("base_points")
    val basePoints: Int,
    @SerializedName("base_xp")
    val baseXP: Int,
    val multiplier: Int,
    @SerializedName("streak_day_at_visit")
    val streakDayAtVisit: Int,
    @SerializedName("created_at")
    val createdAt: Date
) : Parcelable {
    val multiplierText: String
        get() = if (isMorningRush) "2x MORNING RUSH" else "1x"
}

// MARK: - Streak Saver Token Status
enum class TokenStatus {
    @SerializedName("available")
    AVAILABLE,

    @SerializedName("used")
    USED,

    @SerializedName("expired")
    EXPIRED
}

// MARK: - Streak Saver Token Model
@Parcelize
data class StreakSaverToken(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    val status: TokenStatus,
    @SerializedName("granted_at")
    val grantedAt: Date,
    @SerializedName("used_at")
    val usedAt: Date? = null,
    @SerializedName("applied_to_date")
    val appliedToDate: Date? = null,
    @SerializedName("expires_at")
    val expiresAt: Date? = null,
    val metadata: Map<String, String>? = null,
    @SerializedName("created_at")
    val createdAt: Date
) : Parcelable {
    val isAvailable: Boolean
        get() = status == TokenStatus.AVAILABLE && !isExpired

    val isExpired: Boolean
        get() = expiresAt?.let { Date().after(it) } ?: false

    val expiryText: String
        get() {
            val expiresAt = this.expiresAt ?: return "No expiry"
            val format = java.text.SimpleDateFormat("MMM d", Locale.getDefault())
            return "Expires ${format.format(expiresAt)}"
        }
}

// MARK: - Streak Reward Model
@Parcelize
data class StreakReward(
    val id: String,
    @SerializedName("streak_day")
    val streakDay: Int,
    @SerializedName("reward_type")
    val rewardType: String,
    @SerializedName("coupon_type")
    val couponType: CouponType,
    val label: String,
    val description: String? = null,
    @SerializedName("value_cents")
    val valueCents: Int? = null,
    @SerializedName("max_value_cents")
    val maxValueCents: Int? = null,
    @SerializedName("expiry_days")
    val expiryDays: Int,
    val channels: String,
    @SerializedName("eligible_items")
    val eligibleItems: Map<String, String>? = null,
    @SerializedName("is_active")
    val isActive: Boolean,
    @SerializedName("display_order")
    val displayOrder: Int,
    val metadata: Map<String, String>? = null,
    @SerializedName("created_at")
    val createdAt: Date,
    @SerializedName("updated_at")
    val updatedAt: Date
) : Parcelable {
    val displayValue: String
        get() = when (couponType) {
            CouponType.PERCENT_OFF -> "${valueCents ?: 0}% OFF"
            CouponType.FIXED_AMOUNT -> {
                val amount = (valueCents ?: 0) / 100.0
                String.format("$%.2f OFF", amount)
            }
            CouponType.FREE_ITEM -> {
                maxValueCents?.let {
                    val max = it / 100.0
                    String.format("FREE (up to $%.2f)", max)
                } ?: "FREE"
            }
            CouponType.FIXED_PRICE -> {
                val price = (valueCents ?: 0) / 100.0
                String.format("$%.2f", price)
            }
        }
}

// MARK: - Tier Progress Model
@Parcelize
data class TierProgress(
    @SerializedName("current_tier")
    val currentTier: UserTier,
    @SerializedName("next_tier")
    val nextTier: UserTier? = null,
    val progress: Progress,
    @SerializedName("meets_requirements")
    val meetsRequirements: Boolean
) : Parcelable {
    @Parcelize
    data class Progress(
        @SerializedName("monthly_visits")
        val monthlyVisits: Metric,
        @SerializedName("tier_xp")
        val tierXP: Metric,
        @SerializedName("seven_day_streaks")
        val sevenDayStreaks: Metric,
        @SerializedName("annual_spend")
        val annualSpend: Metric
    ) : Parcelable {
        @Parcelize
        data class Metric(
            val current: Int,
            val required: Int
        ) : Parcelable {
            val percentage: Float
                get() = if (required > 0) (current.toFloat() / required).coerceAtMost(1.0f) else 0f
        }
    }
}

// MARK: - Tier Perk Model
@Parcelize
data class TierPerk(
    val id: String,
    val tier: UserTier,
    @SerializedName("perk_type")
    val perkType: String,
    @SerializedName("perk_name")
    val perkName: String,
    val description: String,
    @SerializedName("is_active")
    val isActive: Boolean,
    @SerializedName("display_order")
    val displayOrder: Int,
    val configuration: Map<String, String>? = null,
    @SerializedName("icon_name")
    val iconName: String? = null,
    val metadata: Map<String, String>? = null,
    @SerializedName("created_at")
    val createdAt: Date,
    @SerializedName("updated_at")
    val updatedAt: Date
) : Parcelable

// MARK: - Next Milestone Model
@Parcelize
data class NextMilestone(
    @SerializedName("next_milestone")
    val nextMilestone: Int? = null,
    @SerializedName("days_until_milestone")
    val daysUntilMilestone: Int? = null,
    val reward: StreakReward? = null
) : Parcelable

// MARK: - Anniversary Badge Enum
enum class AnniversaryBadge {
    @SerializedName("year_1_anniversary")
    YEAR_1,

    @SerializedName("year_2_anniversary")
    YEAR_2,

    @SerializedName("year_3_anniversary")
    YEAR_3,

    @SerializedName("year_5_anniversary")
    YEAR_5,

    @SerializedName("year_10_anniversary")
    YEAR_10
}

// MARK: - Anniversary Reward Model
@Parcelize
data class AnniversaryReward(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("anniversary_year")
    val anniversaryYear: Int,
    @SerializedName("anniversary_date")
    val anniversaryDate: Date,
    @SerializedName("is_granted")
    val isGranted: Boolean,
    @SerializedName("granted_at")
    val grantedAt: Date? = null,
    @SerializedName("coupon_id")
    val couponId: String? = null,
    @SerializedName("badge_awarded")
    val badgeAwarded: AnniversaryBadge? = null,
    @SerializedName("is_redeemed")
    val isRedeemed: Boolean,
    @SerializedName("redeemed_at")
    val redeemedAt: Date? = null,
    @SerializedName("custom_message")
    val customMessage: String? = null,
    val metadata: Map<String, String>? = null,
    @SerializedName("created_at")
    val createdAt: Date
) : Parcelable

// MARK: - Next Anniversary Model
@Parcelize
data class NextAnniversary(
    @SerializedName("next_anniversary_year")
    val nextAnniversaryYear: Int? = null,
    @SerializedName("next_anniversary_date")
    val nextAnniversaryDate: Date? = null,
    @SerializedName("days_until_anniversary")
    val daysUntilAnniversary: Int? = null,
    val badge: AnniversaryBadge? = null
) : Parcelable

// MARK: - Loyalty Dashboard Model
@Parcelize
data class LoyaltyDashboard(
    val streak: StreakInfo,
    val tier: TierProgress,
    @SerializedName("next_milestone")
    val nextMilestone: NextMilestone,
    @SerializedName("streak_saver_tokens")
    val streakSaverTokens: Int,
    @SerializedName("next_anniversary")
    val nextAnniversary: NextAnniversary,
    val perks: List<TierPerk>
) : Parcelable {
    @Parcelize
    data class StreakInfo(
        @SerializedName("consecutive_days")
        val consecutiveDays: Int,
        @SerializedName("longest_streak")
        val longestStreak: Int,
        @SerializedName("monthly_points")
        val monthlyPoints: Int,
        @SerializedName("tier_xp")
        val tierXP: Int,
        @SerializedName("monthly_visits")
        val monthlyVisits: Int
    ) : Parcelable
}

// MARK: - API Response Models
data class StreakResponse(
    val success: Boolean,
    val data: UserStreak
)

data class VisitsResponse(
    val success: Boolean,
    val data: List<StreakVisit>
)

data class TokensResponse(
    val success: Boolean,
    val data: List<StreakSaverToken>
)

data class TokenCountResponse(
    val success: Boolean,
    val data: TokenCount
) {
    data class TokenCount(
        val count: Int
    )
}

data class RewardsResponse(
    val success: Boolean,
    val data: List<StreakReward>
)

data class NextMilestoneResponse(
    val success: Boolean,
    val data: NextMilestone
)

data class TierProgressResponse(
    val success: Boolean,
    val data: TierProgress
)

data class TierPerksResponse(
    val success: Boolean,
    val data: List<TierPerk>
)

data class AnniversariesResponse(
    val success: Boolean,
    val data: List<AnniversaryReward>
)

data class NextAnniversaryResponse(
    val success: Boolean,
    val data: NextAnniversary
)

data class DashboardResponse(
    val success: Boolean,
    val data: LoyaltyDashboard
)

data class UseTokenResponse(
    val success: Boolean,
    val message: String,
    val data: StreakSaverToken?
)

data class VisitedTodayResponse(
    val success: Boolean,
    val data: VisitedToday
) {
    data class VisitedToday(
        val visited: Boolean
    )
}

data class UseTokenRequest(
    @SerializedName("missed_date")
    val missedDate: String
)
