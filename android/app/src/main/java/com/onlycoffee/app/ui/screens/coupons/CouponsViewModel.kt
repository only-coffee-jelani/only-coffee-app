package com.onlycoffee.app.ui.screens.coupons

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.Coupon
import com.onlycoffee.app.data.repository.CouponsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class CouponsViewModel @Inject constructor(
    private val couponsRepository: CouponsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CouponsUiState())
    val uiState: StateFlow<CouponsUiState> = _uiState.asStateFlow()

    init {
        loadCoupons()
    }

    fun loadCoupons() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            couponsRepository.getMyCoupons()
                .onSuccess { couponsData ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        activeCoupons = couponsData.active,
                        expiredCoupons = couponsData.expired
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load coupons"
                    )
                }
        }
    }

    fun redeemPromoCode(code: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isSubmittingPromoCode = true,
                promoCodeResult = null
            )

            val idempotencyKey = UUID.randomUUID().toString()
            couponsRepository.redeemPromoCode(code, idempotencyKey)
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(
                        isSubmittingPromoCode = false,
                        promoCodeResult = PromoCodeResult(
                            success = response.success,
                            message = response.message,
                            grantedCoupons = response.data ?: emptyList()
                        )
                    )

                    // Reload coupons if successful
                    if (response.success) {
                        loadCoupons()
                    }
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isSubmittingPromoCode = false,
                        promoCodeResult = PromoCodeResult(
                            success = false,
                            message = error.message ?: "Failed to redeem promo code",
                            grantedCoupons = emptyList()
                        )
                    )
                }
        }
    }

    fun clearPromoCodeResult() {
        _uiState.value = _uiState.value.copy(promoCodeResult = null)
    }

    fun setSelectedTab(tab: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = tab)
    }
}

data class CouponsUiState(
    val isLoading: Boolean = false,
    val activeCoupons: List<Coupon> = emptyList(),
    val expiredCoupons: List<Coupon> = emptyList(),
    val selectedTab: Int = 0,
    val errorMessage: String? = null,
    val isSubmittingPromoCode: Boolean = false,
    val promoCodeResult: PromoCodeResult? = null
)

data class PromoCodeResult(
    val success: Boolean,
    val message: String,
    val grantedCoupons: List<Coupon>
)
