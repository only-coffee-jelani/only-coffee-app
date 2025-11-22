package com.onlycoffee.app.ui.screens.auth

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
    val verificationCodeSent: Boolean = false
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authManager: AuthenticationManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        // Observe auth manager state
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
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            authManager.login(email, password)
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
        viewModelScope.launch {
            authManager.register(email, password, firstName, lastName, phone, birthDate)
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

