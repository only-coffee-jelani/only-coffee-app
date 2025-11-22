package com.onlycoffee.app.ui.screens.stores

import androidx.lifecycle.ViewModel
import com.onlycoffee.app.data.model.Store
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

data class StoreUiState(
    val selectedStore: Store? = null
)

@HiltViewModel
class StoreViewModel @Inject constructor() : ViewModel() {
    private val _uiState = MutableStateFlow(StoreUiState())
    val uiState: StateFlow<StoreUiState> = _uiState.asStateFlow()

    fun selectStore(store: Store) {
        _uiState.value = _uiState.value.copy(selectedStore = store)
    }
}

