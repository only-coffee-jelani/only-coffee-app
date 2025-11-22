package com.onlycoffee.app.ui.screens.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.*
import com.onlycoffee.app.data.repository.CouponsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CartViewModel @Inject constructor(
    private val couponsRepository: CouponsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CartUiState())
    val uiState: StateFlow<CartUiState> = _uiState.asStateFlow()

    // Tax rate (8.75% for Texas)
    private val TAX_RATE = 0.0875

    /**
     * Add item to cart
     */
    fun addItem(menuItem: MenuItem, quantity: Int = 1, customizations: List<String>? = null) {
        _uiState.update { currentState ->
            val existingItem = currentState.items.find {
                it.menuItemId == menuItem.id && it.customizations == customizations
            }

            val updatedItems = if (existingItem != null) {
                currentState.items.map { item ->
                    if (item.menuItemId == menuItem.id && item.customizations == customizations) {
                        item.copy(quantity = item.quantity + quantity)
                    } else {
                        item
                    }
                }
            } else {
                currentState.items + OrderItem(
                    menuItemId = menuItem.id,
                    name = menuItem.name,
                    price = menuItem.basePrice,
                    quantity = quantity,
                    customizations = customizations
                )
            }

            currentState.copy(items = updatedItems).also { recalculateTotals(it) }
        }
    }

    /**
     * Remove item from cart
     */
    fun removeItem(item: OrderItem) {
        _uiState.update { currentState ->
            currentState.copy(
                items = currentState.items.filter { it != item }
            ).also { recalculateTotals(it) }
        }
    }

    /**
     * Update item quantity
     */
    fun updateItemQuantity(item: OrderItem, quantity: Int) {
        if (quantity <= 0) {
            removeItem(item)
            return
        }

        _uiState.update { currentState ->
            currentState.copy(
                items = currentState.items.map {
                    if (it == item) it.copy(quantity = quantity) else it
                }
            ).also { recalculateTotals(it) }
        }
    }

    /**
     * Apply a coupon to the order
     */
    fun applyCoupon(coupon: Coupon) {
        _uiState.update { currentState ->
            currentState.copy(
                selectedCoupon = coupon
            ).also { recalculateTotals(it) }
        }
    }

    /**
     * Remove applied coupon
     */
    fun removeCoupon() {
        _uiState.update { currentState ->
            currentState.copy(
                selectedCoupon = null,
                discountAmount = 0.0
            ).also { recalculateTotals(it) }
        }
    }

    /**
     * Clear the entire cart
     */
    fun clearCart() {
        _uiState.value = CartUiState()
    }

    /**
     * Recalculate totals including discount and tax
     */
    private fun recalculateTotals(state: CartUiState): CartUiState {
        val subtotal = state.items.sumOf { it.totalPrice }
        val discountAmount = calculateDiscount(state.selectedCoupon, state.items, subtotal)
        val taxableAmount = (subtotal - discountAmount).coerceAtLeast(0.0)
        val tax = taxableAmount * TAX_RATE
        val total = taxableAmount + tax

        return state.copy(
            subtotal = subtotal,
            discountAmount = discountAmount,
            tax = tax,
            total = total
        ).also { newState ->
            _uiState.value = newState
        }
    }

    /**
     * Calculate discount based on coupon type
     */
    private fun calculateDiscount(coupon: Coupon?, items: List<OrderItem>, subtotal: Double): Double {
        if (coupon == null || !coupon.isActive) return 0.0

        // Get eligible items based on include/exclude rules
        val eligibleItems = getEligibleItems(items, coupon.eligibleItems)
        if (eligibleItems.isEmpty()) return 0.0

        val eligibleSubtotal = eligibleItems.sumOf { it.totalPrice }

        val discount = when (coupon.type) {
            CouponType.PERCENT_OFF -> {
                val percentOff = coupon.percentOff ?: 0
                eligibleSubtotal * (percentOff / 100.0)
            }

            CouponType.FIXED_AMOUNT -> {
                val amountCents = coupon.valueCents ?: 0
                (amountCents / 100.0).coerceAtMost(eligibleSubtotal)
            }

            CouponType.FIXED_PRICE -> {
                val priceCents = coupon.priceOverrideCents ?: 0
                val targetPrice = priceCents / 100.0
                (eligibleSubtotal - targetPrice).coerceAtLeast(0.0)
            }

            CouponType.FREE_ITEM -> {
                // Free item = 100% off eligible items
                eligibleSubtotal
            }
        }

        // Ensure discount doesn't exceed subtotal
        return discount.coerceAtMost(subtotal)
    }

    /**
     * Filter items based on eligibility rules
     */
    private fun getEligibleItems(
        items: List<OrderItem>,
        eligibility: Coupon.EligibleItems?
    ): List<OrderItem> {
        if (eligibility == null) return items

        return items.filter { item ->
            val isIncluded = eligibility.include?.contains(item.menuItemId) != false
            val isExcluded = eligibility.exclude?.contains(item.menuItemId) == true
            isIncluded && !isExcluded
        }
    }

    /**
     * Create order from current cart state
     */
    fun createOrderRequest(storeId: String, specialInstructions: String? = null): CreateOrderRequest {
        val currentState = _uiState.value

        return CreateOrderRequest(
            storeId = storeId,
            items = currentState.items.map { item ->
                CreateOrderItem(
                    menuItemId = item.menuItemId,
                    quantity = item.quantity,
                    customizations = item.customizations
                )
            },
            channel = "app_only",
            specialInstructions = specialInstructions,
            couponId = currentState.selectedCoupon?.id
        )
    }

    /**
     * Load available coupons for selection
     */
    fun loadAvailableCoupons() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingCoupons = true, couponsError = null) }

            couponsRepository.getMyCoupons()
                .onSuccess { couponsData ->
                    _uiState.update {
                        it.copy(
                            availableCoupons = couponsData.active,
                            isLoadingCoupons = false
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoadingCoupons = false,
                            couponsError = error.message ?: "Failed to load coupons"
                        )
                    }
                }
        }
    }

    /**
     * Calculate estimated discount for a coupon preview
     */
    fun getEstimatedDiscount(coupon: Coupon): String {
        val currentState = _uiState.value
        val discount = calculateDiscount(coupon, currentState.items, currentState.subtotal)
        return String.format("-$%.2f", discount)
    }
}

data class CartUiState(
    val items: List<OrderItem> = emptyList(),
    val subtotal: Double = 0.0,
    val discountAmount: Double = 0.0,
    val tax: Double = 0.0,
    val total: Double = 0.0,
    val selectedCoupon: Coupon? = null,
    val availableCoupons: List<Coupon> = emptyList(),
    val isLoadingCoupons: Boolean = false,
    val couponsError: String? = null
) {
    val itemCount: Int
        get() = items.sumOf { it.quantity }

    val isEmpty: Boolean
        get() = items.isEmpty()

    val hasDiscount: Boolean
        get() = discountAmount > 0.0
}
