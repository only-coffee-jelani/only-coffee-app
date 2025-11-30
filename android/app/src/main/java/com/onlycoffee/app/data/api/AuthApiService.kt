package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.*
import retrofit2.http.*

interface AuthApiService {
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): RefreshTokenResponse

    @POST("auth/logout")
    suspend fun logout(): MessageResponse

    @POST("auth/send-code")
    suspend fun sendVerificationCode(@Body request: SendVerificationCodeRequest): MessageResponse

    @POST("auth/verify-code")
    suspend fun verifyPhone(@Body request: VerifyPhoneRequest): AuthResponse
    
    @GET("users/me")
    suspend fun getCurrentUser(): UserResponse
    
    @PATCH("users/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): UserResponse
    
    @DELETE("users/me")
    suspend fun deleteAccount(): MessageResponse
}

