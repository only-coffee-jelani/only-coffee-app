package com.onlycoffee.app.ui.screens.auth

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.User
import com.onlycoffee.app.managers.AuthenticationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val currentUser: User? = null,
    val errorMessage: String? = null,
    val verificationCodeSent: Boolean = false,
    val isInitializing: Boolean = false
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authManager: AuthenticationManager
) : ViewModel() {

    companion object {
        private const val TAG = "AuthViewModel"
    }

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        // CRITICAL: Initialize state immediately with current values from AuthManager
        // This prevents navigation loops when screens are created while already authenticated
        _uiState.value = _uiState.value.copy(
            isAuthenticated = authManager.isAuthenticated.value,
            currentUser = authManager.currentUser.value,
            isLoading = authManager.isLoading.value,
            errorMessage = authManager.errorMessage.value,
            isInitializing = authManager.isInitializing.value
        )

        // Observe auth manager state changes
        viewModelScope.launch {
            authManager.isAuthenticated.collect { isAuth ->
                _uiState.value = _uiState.value.copy(isAuthenticated = isAuth)
            }
        }

        viewModelScope.launch {
            authManager.currentUser.collect { user ->
                _uiState.value = _uiState.value.copy(currentUser = user)
            }
        }

        viewModelScope.launch {
            authManager.isLoading.collect { loading ->
                _uiState.value = _uiState.value.copy(isLoading = loading)
            }
        }

        viewModelScope.launch {
            authManager.errorMessage.collect { error ->
                _uiState.value = _uiState.value.copy(errorMessage = error)
            }
        }

        viewModelScope.launch {
            authManager.isInitializing.collect { initializing ->
                _uiState.value = _uiState.value.copy(isInitializing = initializing)
            }
        }
    }

    fun login(email: String, password: String) {
        Log.d(TAG, "AuthViewModel.login called for email: $email")
        viewModelScope.launch {
            val success = authManager.login(email, password)
            Log.d(TAG, "AuthViewModel.login completed - success: $success, isAuthenticated: ${_uiState.value.isAuthenticated}")
        }
    }

    fun register(
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        phone: String? = null,
        birthDate: String? = null
    ) {
        Log.d(TAG, "AuthViewModel.register called for email: $email")
        viewModelScope.launch {
            val success = authManager.register(email, password, firstName, lastName, phone, birthDate)
            Log.d(TAG, "AuthViewModel.register completed - success: $success, isAuthenticated: ${_uiState.value.isAuthenticated}")
        }
    }

    fun sendVerificationCode(phone: String) {
        viewModelScope.launch {
            val success = authManager.sendVerificationCode(phone)
            _uiState.value = _uiState.value.copy(verificationCodeSent = success)
        }
    }

    fun verifyPhone(phone: String, code: String) {
        viewModelScope.launch {
            authManager.verifyPhone(phone, code)
        }
    }

    fun logout() {
        viewModelScope.launch {
            authManager.logout()
        }
    }

    fun clearError() {
        authManager.clearError()
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun loadCurrentUser() {
        viewModelScope.launch {
            authManager.loadCurrentUser()
        }
    }
}

