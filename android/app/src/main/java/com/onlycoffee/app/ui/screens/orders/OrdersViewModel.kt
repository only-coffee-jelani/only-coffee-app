package com.onlycoffee.app.ui.screens.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.Store
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrdersViewModel @Inject constructor(
    // TODO: Inject repositories when backend is ready
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(OrdersUiState())
    val uiState: StateFlow<OrdersUiState> = _uiState.asStateFlow()
    
    private var allStores: List<Store> = emptyList()
    
    init {
        loadStores()
    }
    
    private fun loadStores() {
        viewModelScope.launch {
            // TODO: Replace with actual API call
            allStores = Store.sampleStores
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                stores = allStores,
                filteredStores = allStores
            )
        }
    }
    
    fun searchStores(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query
        )
        filterStores()
    }
    
    fun toggleOrderType() {
        val currentType = _uiState.value.orderType
        val newType = if (currentType == OrderType.PICKUP) OrderType.DELIVERY else OrderType.PICKUP
        _uiState.value = _uiState.value.copy(
            orderType = newType
        )
    }
    
    fun selectStore(store: Store) {
        _uiState.value = _uiState.value.copy(
            selectedStore = store
        )
    }
    
    fun toggleMapView() {
        _uiState.value = _uiState.value.copy(
            showMapView = !_uiState.value.showMapView
        )
    }
    
    fun selectTab(tab: StoreTab) {
        _uiState.value = _uiState.value.copy(
            selectedTab = tab
        )
        filterStores()
    }
    
    private fun filterStores() {
        val currentState = _uiState.value
        val filtered = allStores.filter { store ->
            // Search filter
            val searchMatch = currentState.searchQuery.isEmpty() ||
                             store.name.contains(currentState.searchQuery, ignoreCase = true) ||
                             store.address.city.contains(currentState.searchQuery, ignoreCase = true) ||
                             store.address.zipCode.contains(currentState.searchQuery, ignoreCase = true)
            
            // Tab filter
            val tabMatch = when (currentState.selectedTab) {
                StoreTab.NEARBY -> true // Show all for now, would filter by distance in real app
                StoreTab.PREVIOUS -> false // Would show previously visited stores
                StoreTab.FAVORITES -> currentState.favoriteStoreIds.contains(store.id)
            }
            
            searchMatch && tabMatch
        }
        
        _uiState.value = currentState.copy(
            filteredStores = filtered
        )
    }
    
    fun updateUserLocation(latitude: Double, longitude: Double) {
        _uiState.value = _uiState.value.copy(
            userLatitude = latitude,
            userLongitude = longitude
        )
        // TODO: Update store distances based on user location
    }

    fun toggleFavorite(storeId: String) {
        val currentState = _uiState.value
        val currentFavorites = currentState.favoriteStoreIds
        val newFavorites = if (currentFavorites.contains(storeId)) {
            currentFavorites - storeId
        } else {
            currentFavorites + storeId
        }
        _uiState.value = currentState.copy(favoriteStoreIds = newFavorites)
        filterStores()
    }

    fun isFavorite(storeId: String): Boolean {
        return _uiState.value.favoriteStoreIds.contains(storeId)
    }

    fun saveSelectedStore(store: Store) {
        _uiState.value = _uiState.value.copy(
            selectedStore = store
        )
        // TODO: Save to SharedPreferences or local storage
        // For now, just update the state
    }
}

data class OrdersUiState(
    val isLoading: Boolean = true,
    val searchQuery: String = "",
    val orderType: OrderType = OrderType.PICKUP,
    val selectedStore: Store? = null,
    val stores: List<Store> = emptyList(),
    val filteredStores: List<Store> = emptyList(),
    val showMapView: Boolean = false,
    val selectedTab: StoreTab = StoreTab.NEARBY,
    val userLatitude: Double? = null,
    val userLongitude: Double? = null,
    val favoriteStoreIds: Set<String> = emptySet(),
    val error: String? = null
)

enum class OrderType(val displayName: String) {
    PICKUP("Pickup"),
    DELIVERY("Delivery")
}

enum class StoreTab(val displayName: String) {
    NEARBY("Nearby"),
    PREVIOUS("Previous"),
    FAVORITES("Favorites")
}
