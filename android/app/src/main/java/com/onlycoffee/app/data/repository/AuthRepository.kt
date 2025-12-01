package com.onlycoffee.app.data.repository

import com.onlycoffee.app.data.api.AuthApiService
import com.onlycoffee.app.data.model.*
import com.onlycoffee.app.managers.SecureStorageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApiService: AuthApiService,
    private val secureStorage: SecureStorageManager
) {
    
    suspend fun login(email: String, password: String): Result<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val request = LoginRequest(email, password)
            val response = authApiService.login(request)

            // Save tokens
            secureStorage.saveAccessToken(response.accessToken)
            secureStorage.saveRefreshToken(response.refreshToken)
            secureStorage.saveUserId(response.user.id)
            secureStorage.saveUserEmail(response.user.email)

            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun register(
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        phone: String? = null,
        birthDate: String? = null
    ): Result<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val request = RegisterRequest(email, password, firstName, lastName, phone, birthDate)
            val response = authApiService.register(request)

            // Save tokens
            secureStorage.saveAccessToken(response.accessToken)
            secureStorage.saveRefreshToken(response.refreshToken)
            secureStorage.saveUserId(response.user.id)
            secureStorage.saveUserEmail(response.user.email)

            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun refreshToken(): Result<TokenPair> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = secureStorage.getRefreshToken()
                ?: return@withContext Result.failure(Exception("No refresh token found"))
            
            val request = RefreshTokenRequest(refreshToken)
            val response = authApiService.refreshToken(request)
            
            // Save new tokens
            secureStorage.saveAccessToken(response.tokens.accessToken)
            secureStorage.saveRefreshToken(response.tokens.refreshToken)
            
            Result.success(response.tokens)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            authApiService.logout()
            secureStorage.clearAll()
            Result.success(Unit)
        } catch (e: Exception) {
            // Clear local storage even if API call fails
            secureStorage.clearAll()
            Result.success(Unit)
        }
    }
    
    suspend fun getCurrentUser(): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = authApiService.getCurrentUser()
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateProfile(request: UpdateProfileRequest): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = authApiService.updateProfile(request)
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun sendVerificationCode(phone: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val request = SendVerificationCodeRequest(phone)
            val response = authApiService.sendVerificationCode(request)
            Result.success(response.message)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun verifyPhone(phone: String, code: String): Result<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val request = VerifyPhoneRequest(phone, code)
            val response = authApiService.verifyPhone(request)

            // Save tokens
            secureStorage.saveAccessToken(response.accessToken)
            secureStorage.saveRefreshToken(response.refreshToken)
            secureStorage.saveUserId(response.user.id)
            secureStorage.saveUserEmail(response.user.email)

            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun isLoggedIn(): Boolean {
        return secureStorage.isLoggedIn()
    }
    
    fun getStoredUserId(): String? {
        return secureStorage.getUserId()
    }
}

