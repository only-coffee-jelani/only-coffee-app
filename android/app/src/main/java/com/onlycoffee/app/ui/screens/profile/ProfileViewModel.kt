package com.onlycoffee.app.ui.screens.profile

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.LoyaltyLedgerEntry
import com.onlycoffee.app.data.model.RewardsSummary
import com.onlycoffee.app.data.model.User
import com.onlycoffee.app.data.repository.RewardsRepository
import com.onlycoffee.app.managers.AuthenticationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Profile ViewModel
 * 
 * Enterprise-level ViewModel for profile screen
 * Manages user profile state, rewards data, and user actions
 * 
 * Features:
 * - Reactive state management with StateFlow
 * - Comprehensive error handling
 * - Loading states for all operations
 * - Automatic data refresh on authentication changes
 * - Proper logging for debugging
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authManager: AuthenticationManager,
    private val rewardsRepository: RewardsRepository
) : ViewModel() {

    companion object {
        private const val TAG = "ProfileViewModel"
    }

    // UI State
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        Log.d(TAG, "ProfileViewModel initialized")

        // CRITICAL: Initialize state immediately with current values from AuthManager
        // This prevents showing "Sign In" button when user is already authenticated
        _uiState.value = _uiState.value.copy(
            isAuthenticated = authManager.isAuthenticated.value,
            currentUser = authManager.currentUser.value,
            isInitializing = authManager.isInitializing.value
        )

        Log.d(TAG, "Initial state - isAuthenticated: ${authManager.isAuthenticated.value}, " +
                "currentUser: ${authManager.currentUser.value?.email}, " +
                "isInitializing: ${authManager.isInitializing.value}")

        // Load rewards data immediately if already authenticated
        if (authManager.isAuthenticated.value && !authManager.isInitializing.value) {
            Log.d(TAG, "User already authenticated, loading rewards data")
            loadRewardsData()
        }

        // Observe authentication state changes
        viewModelScope.launch {
            authManager.isAuthenticated.collect { isAuthenticated ->
                Log.d(TAG, "Authentication state changed: $isAuthenticated")
                val previousAuth = _uiState.value.isAuthenticated

                _uiState.value = _uiState.value.copy(
                    isAuthenticated = isAuthenticated,
                    currentUser = if (isAuthenticated) authManager.currentUser.value else null
                )

                // Load rewards data when user becomes authenticated (login/register)
                // Don't reload if already authenticated (prevents duplicate calls)
                if (isAuthenticated && !previousAuth) {
                    Log.d(TAG, "User just authenticated, loading rewards data")
                    loadRewardsData()
                } else if (!isAuthenticated && previousAuth) {
                    // User logged out - clear rewards data
                    Log.d(TAG, "User logged out, clearing rewards data")
                    _uiState.value = _uiState.value.copy(
                        rewardsSummary = null,
                        recentActivity = emptyList(),
                        rewardsError = null
                    )
                }
            }
        }

        // Observe current user changes
        viewModelScope.launch {
            authManager.currentUser.collect { user ->
                Log.d(TAG, "Current user changed: ${user?.email}")
                _uiState.value = _uiState.value.copy(currentUser = user)
            }
        }

        // Observe initialization state changes
        viewModelScope.launch {
            authManager.isInitializing.collect { isInitializing ->
                Log.d(TAG, "Initialization state changed: $isInitializing")
                val wasInitializing = _uiState.value.isInitializing
                _uiState.value = _uiState.value.copy(isInitializing = isInitializing)

                // When initialization completes and user is authenticated, load rewards
                if (wasInitializing && !isInitializing && authManager.isAuthenticated.value) {
                    Log.d(TAG, "Initialization complete, user authenticated, loading rewards data")
                    loadRewardsData()
                }
            }
        }
    }

    /**
     * Load rewards data (summary and recent history)
     */
    fun loadRewardsData() {
        viewModelScope.launch {
            Log.d(TAG, "Loading rewards data")
            _uiState.value = _uiState.value.copy(isLoadingRewards = true, rewardsError = null)
            
            try {
                // Load rewards summary
                val summaryResult = rewardsRepository.getLoyaltySummary()
                if (summaryResult.isSuccess) {
                    _uiState.value = _uiState.value.copy(
                        rewardsSummary = summaryResult.getOrNull()
                    )
                    Log.d(TAG, "Successfully loaded rewards summary")
                } else {
                    val error = summaryResult.exceptionOrNull()?.message ?: "Failed to load rewards"
                    Log.e(TAG, "Failed to load rewards summary: $error")
                    _uiState.value = _uiState.value.copy(rewardsError = error)
                }
                
                // Load recent history (last 10 entries)
                val historyResult = rewardsRepository.getRewardsHistory(limit = 10)
                if (historyResult.isSuccess) {
                    _uiState.value = _uiState.value.copy(
                        recentActivity = historyResult.getOrNull() ?: emptyList()
                    )
                    Log.d(TAG, "Successfully loaded rewards history")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception while loading rewards data", e)
                _uiState.value = _uiState.value.copy(
                    rewardsError = "Failed to load rewards: ${e.message}"
                )
            } finally {
                _uiState.value = _uiState.value.copy(isLoadingRewards = false)
            }
        }
    }

    /**
     * Refresh all profile data
     */
    fun refresh() {
        Log.d(TAG, "Refreshing profile data")
        loadRewardsData()
    }

    /**
     * Sign out current user
     */
    fun signOut() {
        Log.d(TAG, "Signing out user")
        viewModelScope.launch {
            authManager.logout()
        }
    }

    /**
     * Clear rewards error
     */
    fun clearRewardsError() {
        _uiState.value = _uiState.value.copy(rewardsError = null)
    }
}

/**
 * Profile UI State
 * 
 * Immutable data class representing the complete UI state
 */
data class ProfileUiState(
    val isAuthenticated: Boolean = false,
    val isInitializing: Boolean = false,
    val currentUser: User? = null,
    val rewardsSummary: RewardsSummary? = null,
    val recentActivity: List<LoyaltyLedgerEntry> = emptyList(),
    val isLoadingRewards: Boolean = false,
    val rewardsError: String? = null
)

