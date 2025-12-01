package com.onlycoffee.app.managers

import com.onlycoffee.app.data.model.UpdateProfileRequest
import com.onlycoffee.app.data.model.User
import com.onlycoffee.app.data.repository.AuthRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Central authentication manager for the app
 * Manages user authentication state and provides auth operations
 *
 * Enterprise-level implementation with proper error handling,
 * lifecycle management, and state synchronization
 */
@Singleton
class AuthenticationManager @Inject constructor(
    private val authRepository: AuthRepository
) {
    // Use a supervisor job so that failures in one coroutine don't cancel others
    // Note: Since this is a Singleton, the scope lives for the app lifetime
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // Track if we're initializing (loading user data on app start)
    private val _isInitializing = MutableStateFlow(false)
    val isInitializing: StateFlow<Boolean> = _isInitializing.asStateFlow()

    init {
        // Check if user is already logged in and load their profile
        if (authRepository.isLoggedIn()) {
            _isAuthenticated.value = true
            _isInitializing.value = true

            // Load current user data in background with proper error handling
            scope.launch {
                try {
                    val success = loadCurrentUser()

                    if (!success) {
                        // Failed to load user - tokens might be expired
                        _isAuthenticated.value = false
                        _currentUser.value = null
                        // Clear stored tokens since they're likely invalid
                        authRepository.logout()
                    }
                } catch (e: Exception) {
                    // Clear auth state on error
                    _isAuthenticated.value = false
                    _currentUser.value = null
                    _errorMessage.value = "Failed to load user data. Please sign in again."
                } finally {
                    _isInitializing.value = false
                }
            }
        }
    }

    suspend fun login(email: String, password: String): Boolean {
        _isLoading.value = true
        _errorMessage.value = null

        val result = authRepository.login(email, password)

        return if (result.isSuccess) {
            val authResponse = result.getOrNull()
            _currentUser.value = authResponse?.user
            _isAuthenticated.value = true
            _isLoading.value = false
            true
        } else {
            val error = result.exceptionOrNull()?.message ?: "Login failed"
            _errorMessage.value = error
            _isLoading.value = false
            false
        }
    }

    suspend fun register(
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        phone: String? = null,
        birthDate: String? = null
    ): Boolean {
        _isLoading.value = true
        _errorMessage.value = null

        val result = authRepository.register(email, password, firstName, lastName, phone, birthDate)

        return if (result.isSuccess) {
            val authResponse = result.getOrNull()
            _currentUser.value = authResponse?.user
            _isAuthenticated.value = true
            _isLoading.value = false
            true
        } else {
            val error = result.exceptionOrNull()?.message ?: "Registration failed"
            _errorMessage.value = error
            _isLoading.value = false
            false
        }
    }

    suspend fun logout() {
        _isLoading.value = true
        authRepository.logout()
        _currentUser.value = null
        _isAuthenticated.value = false
        _isLoading.value = false
    }

    suspend fun loadCurrentUser(): Boolean {
        if (!authRepository.isLoggedIn()) {
            return false
        }

        _isLoading.value = true
        val result = authRepository.getCurrentUser()

        return if (result.isSuccess) {
            val user = result.getOrNull()

            // Enterprise-level validation: If API returns success but user is null,
            // the session is invalid (expired token, deleted account, etc.)
            if (user == null) {
                _currentUser.value = null
                _isAuthenticated.value = false
                _isLoading.value = false
                // Clear stored tokens since session is invalid
                authRepository.logout()
                return false
            }

            _currentUser.value = user
            _isAuthenticated.value = true
            _isLoading.value = false
            true
        } else {
            _isLoading.value = false
            false
        }
    }

    suspend fun updateProfile(request: UpdateProfileRequest): Boolean {
        _isLoading.value = true
        _errorMessage.value = null

        val result = authRepository.updateProfile(request)
        
        return if (result.isSuccess) {
            _currentUser.value = result.getOrNull()
            _isLoading.value = false
            true
        } else {
            _errorMessage.value = result.exceptionOrNull()?.message ?: "Update failed"
            _isLoading.value = false
            false
        }
    }

    suspend fun sendVerificationCode(phone: String): Boolean {
        _isLoading.value = true
        _errorMessage.value = null

        val result = authRepository.sendVerificationCode(phone)
        
        _isLoading.value = false
        return if (result.isSuccess) {
            true
        } else {
            _errorMessage.value = result.exceptionOrNull()?.message ?: "Failed to send code"
            false
        }
    }

    suspend fun verifyPhone(phone: String, code: String): Boolean {
        _isLoading.value = true
        _errorMessage.value = null

        val result = authRepository.verifyPhone(phone, code)
        
        return if (result.isSuccess) {
            val authResponse = result.getOrNull()
            _currentUser.value = authResponse?.user
            _isAuthenticated.value = true
            _isLoading.value = false
            true
        } else {
            _errorMessage.value = result.exceptionOrNull()?.message ?: "Verification failed"
            _isLoading.value = false
            false
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }
}

