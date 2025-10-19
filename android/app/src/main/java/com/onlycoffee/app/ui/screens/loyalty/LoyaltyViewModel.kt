package com.onlycoffee.app.ui.screens.loyalty

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.LoyaltyDashboard
import com.onlycoffee.app.data.repository.LoyaltyRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoyaltyViewModel @Inject constructor(
    private val loyaltyRepository: LoyaltyRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoyaltyUiState())
    val uiState: StateFlow<LoyaltyUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            try {
                // Load dashboard and visited today status in parallel
                val dashboardResult = loyaltyRepository.getDashboard()
                val visitedResult = loyaltyRepository.hasVisitedToday()

                dashboardResult.fold(
                    onSuccess = { dashboard ->
                        visitedResult.fold(
                            onSuccess = { visited ->
                                _uiState.value = _uiState.value.copy(
                                    isLoading = false,
                                    dashboard = dashboard,
                                    visitedToday = visited,
                                    error = null
                                )
                            },
                            onFailure = { error ->
                                // Dashboard loaded but visited status failed - still show dashboard
                                _uiState.value = _uiState.value.copy(
                                    isLoading = false,
                                    dashboard = dashboard,
                                    visitedToday = false,
                                    error = null
                                )
                            }
                        )
                    },
                    onFailure = { error ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = error.message ?: "Failed to load loyalty data"
                        )
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "An unexpected error occurred"
                )
            }
        }
    }

    fun refreshData() {
        loadDashboard()
    }
}

data class LoyaltyUiState(
    val isLoading: Boolean = true,
    val dashboard: LoyaltyDashboard? = null,
    val visitedToday: Boolean = false,
    val error: String? = null
)
