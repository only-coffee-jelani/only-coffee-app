package com.onlycoffee.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.CarouselItem
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.model.StoreResponse
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
    private val carouselApiService: com.onlycoffee.app.data.api.CarouselApiService,
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

            // Fetch user data
            val user = authManager.currentUser.value

            // Fetch featured items with fallback
            val featuredItems = try {
                menuApiService.getFeaturedItems().map { it.toMenuItem() }
            } catch (e: Exception) {
                MenuItem.sampleItems.filter { it.isFeatured }
            }

            // Fetch nearby stores with fallback
            val nearbyStores = try {
                storeApiService.getNearbyStores(
                    latitude = 29.9584, // Default to New Orleans French Quarter
                    longitude = -90.0644,
                    radius = 10.0
                ).data
            } catch (e: Exception) {
                emptyList() // No fallback to sample data - use real backend data only
            }

            // Fetch carousel images from backend with fallback
            val carouselItems = try {
                carouselApiService.getActiveCarouselImages()
            } catch (e: Exception) {
                emptyList()
            }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                userName = user?.firstName ?: "Coffee Lover",
                loyaltyPoints = user?.loyaltyPoints ?: 0,
                nearbyStores = nearbyStores,
                featuredItems = featuredItems,
                carouselItems = carouselItems,
                error = null
            )
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
    val nearbyStores: List<StoreResponse> = emptyList(),
    val featuredItems: List<MenuItem> = emptyList(),
    val carouselItems: List<CarouselItem> = emptyList(),
    val error: String? = null
)
