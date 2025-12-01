package com.onlycoffee.app.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize
import java.util.Date

@Parcelize
data class User(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String? = null,
    val role: UserRole = UserRole.CUSTOMER,
    val loyaltyPoints: Int = 0,
    // Enterprise-level: Make nullable to handle backend responses where tier might be null
    // Default to BRONZE if null for new users
    val loyaltyTier: UserTier? = UserTier.BRONZE,
    val stripeCustomerId: String? = null,
    val isActive: Boolean = true,
    val emailVerified: Boolean = false,
    val phoneVerified: Boolean = false,
    val marketingOptIn: Boolean = false,
    val profileCompleted: Boolean = false,
    val isLoyaltyMember: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val lastLoginAt: Date? = null,
    val createdAt: Date,
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
    val firstName: String,
    val lastName: String,
    val phone: String? = null,
    val birthDate: String? = null
)

data class AuthResponse(
    val user: User,
    val accessToken: String,
    val refreshToken: String
)

data class TokenPair(
    val accessToken: String,
    val refreshToken: String
)

data class RefreshTokenRequest(
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
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    val birthDate: String? = null,
    val marketingOptIn: Boolean? = null,
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

