package com.onlycoffee.app.ui.screens.offers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.api.OffersApiService
import com.onlycoffee.app.data.model.PersonalizedOffer
import com.onlycoffee.app.managers.AuthenticationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OffersUiState(
    val offers: List<PersonalizedOffer> = emptyList(),
    val userSegment: String? = null,
    val churnRisk: Double? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isAuthenticated: Boolean = false
)

@HiltViewModel
class OffersViewModel @Inject constructor(
    private val offersApiService: OffersApiService,
    private val authManager: AuthenticationManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(OffersUiState())
    val uiState: StateFlow<OffersUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            authManager.isAuthenticated.collect { isAuth ->
                _uiState.value = _uiState.value.copy(isAuthenticated = isAuth)
                if (isAuth) {
                    loadOffers()
                }
            }
        }
    }

    fun loadOffers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val response = offersApiService.getPersonalizedOffers()
                _uiState.value = _uiState.value.copy(
                    offers = response.data.offers,
                    userSegment = response.data.userSegment,
                    churnRisk = response.data.churnRisk,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Failed to load offers"
                )
            }
        }
    }

    fun trackOfferView(offerId: String) {
        viewModelScope.launch {
            try {
                offersApiService.trackOfferView(offerId)
            } catch (e: Exception) {
                // Silent fail for tracking
            }
        }
    }

    fun trackOfferClick(offerId: String) {
        viewModelScope.launch {
            try {
                offersApiService.trackOfferClick(offerId)
            } catch (e: Exception) {
                // Silent fail for tracking
            }
        }
    }

    fun refresh() {
        loadOffers()
    }
}

