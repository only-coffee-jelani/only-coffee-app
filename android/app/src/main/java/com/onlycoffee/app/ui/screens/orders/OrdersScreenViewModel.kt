package com.onlycoffee.app.ui.screens.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.api.OrderApiService
import com.onlycoffee.app.data.model.Order
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrdersUiState(
    val orders: List<Order> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class OrdersScreenViewModel @Inject constructor(
    private val orderApiService: OrderApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrdersUiState())
    val uiState: StateFlow<OrdersUiState> = _uiState.asStateFlow()

    fun loadOrders() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val response = orderApiService.getMyOrders()
                _uiState.value = _uiState.value.copy(
                    orders = response.data.sortedByDescending { it.createdAt },
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Failed to load orders"
                )
            }
        }
    }

    fun reorderOrder(orderId: String) {
        viewModelScope.launch {
            try {
                orderApiService.reorder(orderId)
                // Navigate to cart or show success message
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to reorder: ${e.message}"
                )
            }
        }
    }
}

