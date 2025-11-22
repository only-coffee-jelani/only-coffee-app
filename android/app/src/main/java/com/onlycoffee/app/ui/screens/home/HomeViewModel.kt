package com.onlycoffee.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.model.Store
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val menuApiService: com.onlycoffee.app.data.api.MenuApiService,
    private val storeApiService: com.onlycoffee.app.data.api.StoreApiService,
    private val authManager: com.onlycoffee.app.managers.AuthenticationManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    private fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                // Fetch data in parallel
                val user = authManager.currentUser.value
                val featuredItemsResponse = menuApiService.getFeaturedItems()
                val nearbyStoresResponse = storeApiService.getNearbyStores(
                    latitude = 29.9584, // Default to New Orleans French Quarter
                    longitude = -90.0644,
                    radius = 10.0
                )

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    userName = user?.firstName ?: "Coffee Lover",
                    loyaltyPoints = user?.loyaltyPoints ?: 0,
                    nearbyStores = nearbyStoresResponse.data,
                    featuredItems = featuredItemsResponse.data
                )
            } catch (e: Exception) {
                // Fallback to sample data if API fails
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    userName = "Coffee Lover",
                    loyaltyPoints = 0,
                    nearbyStores = Store.sampleStores,
                    featuredItems = MenuItem.sampleItems.filter { it.isFeatured },
                    error = "Using offline data. ${e.message}"
                )
            }
        }
    }
    
    fun addToCart(menuItem: MenuItem) {
        viewModelScope.launch {
            // TODO: Implement cart functionality
            // For now, just show a success message or navigate to customization
        }
    }
    
    fun refreshData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            loadHomeData()
        }
    }
}

data class HomeUiState(
    val isLoading: Boolean = true,
    val userName: String = "",
    val loyaltyPoints: Int = 0,
    val nearbyStores: List<Store> = emptyList(),
    val featuredItems: List<MenuItem> = emptyList(),
    val error: String? = null
)
