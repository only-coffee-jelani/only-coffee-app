package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize
import java.util.Date

@Parcelize
data class User(
    val id: String,
    val email: String,
    @SerializedName("first_name")
    val firstName: String,
    @SerializedName("last_name")
    val lastName: String,
    val phone: String? = null,
    val role: UserRole = UserRole.CUSTOMER,
    @SerializedName("loyalty_points")
    val loyaltyPoints: Int = 0,
    @SerializedName("loyalty_tier")
    val loyaltyTier: UserTier = UserTier.BRONZE,
    @SerializedName("stripe_customer_id")
    val stripeCustomerId: String? = null,
    @SerializedName("is_active")
    val isActive: Boolean = true,
    @SerializedName("email_verified")
    val emailVerified: Boolean = false,
    @SerializedName("phone_verified")
    val phoneVerified: Boolean = false,
    @SerializedName("marketing_opt_in")
    val marketingOptIn: Boolean = false,
    @SerializedName("profile_completed")
    val profileCompleted: Boolean = false,
    @SerializedName("is_loyalty_member")
    val isLoyaltyMember: Boolean = false,
    @SerializedName("notifications_enabled")
    val notificationsEnabled: Boolean = true,
    @SerializedName("last_login_at")
    val lastLoginAt: Date? = null,
    @SerializedName("created_at")
    val createdAt: Date,
    @SerializedName("updated_at")
    val updatedAt: Date
) : Parcelable {
    val fullName: String
        get() = "$firstName $lastName"
}

enum class UserRole {
    @SerializedName("customer")
    CUSTOMER,
    
    @SerializedName("admin")
    ADMIN
}

// Auth Request/Response Models
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("first_name")
    val firstName: String,
    @SerializedName("last_name")
    val lastName: String,
    val phone: String? = null,
    @SerializedName("birth_date")
    val birthDate: String? = null
)

data class AuthResponse(
    val user: User,
    val tokens: TokenPair
)

data class TokenPair(
    @SerializedName("access_token")
    val accessToken: String,
    @SerializedName("refresh_token")
    val refreshToken: String
)

data class RefreshTokenRequest(
    @SerializedName("refresh_token")
    val refreshToken: String
)

data class RefreshTokenResponse(
    val tokens: TokenPair
)

// Phone Auth Models
data class SendVerificationCodeRequest(
    val phone: String
)

data class VerifyPhoneRequest(
    val phone: String,
    val code: String
)

// Profile Update Models
data class UpdateProfileRequest(
    @SerializedName("first_name")
    val firstName: String? = null,
    @SerializedName("last_name")
    val lastName: String? = null,
    val phone: String? = null,
    @SerializedName("birth_date")
    val birthDate: String? = null,
    @SerializedName("marketing_opt_in")
    val marketingOptIn: Boolean? = null,
    @SerializedName("notifications_enabled")
    val notificationsEnabled: Boolean? = null
)

data class UserResponse(
    val success: Boolean,
    val data: User
)

data class MessageResponse(
    val success: Boolean,
    val message: String
)

