package com.onlycoffee.app.ui.screens.cart

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Discount
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.Coupon
import com.onlycoffee.app.ui.theme.*

@Composable
fun CheckoutScreen(
    navController: NavController,
    viewModel: CartViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showCouponSelector by remember { mutableStateOf(false) }
    var specialInstructions by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadAvailableCoupons()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Checkout", style = OnlyCoffeeTextStyles.H2) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundPrimary,
                    titleContentColor = TextPrimary
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundSecondary),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Order summary
            item {
                OrderSummaryCard(uiState = uiState)
            }

            // Coupon section
            item {
                CouponSectionCard(
                    selectedCoupon = uiState.selectedCoupon,
                    discountAmount = uiState.discountAmount,
                    onSelectCoupon = { showCouponSelector = true },
                    onRemoveCoupon = { viewModel.removeCoupon() }
                )
            }

            // Special instructions
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Special Instructions",
                            style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        OutlinedTextField(
                            value = specialInstructions,
                            onValueChange = { specialInstructions = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("Any special requests?") },
                            maxLines = 3,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandPrimary,
                                unfocusedBorderColor = TextTertiary
                            )
                        )
                    }
                }
            }

            // Payment summary
            item {
                PaymentSummaryCard(
                    subtotal = uiState.subtotal,
                    discount = uiState.discountAmount,
                    tax = uiState.tax,
                    total = uiState.total
                )
            }

            // Place order button
            item {
                Button(
                    onClick = {
                        // TODO: Implement order placement
                        // val request = viewModel.createOrderRequest(
                        //     storeId = selectedStoreId,
                        //     specialInstructions = specialInstructions.ifBlank { null }
                        // )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                    shape = RoundedCornerShape(28.dp)
                ) {
                    Text(
                        "Place Order",
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                }
            }
        }
    }

    // Coupon selector bottom sheet
    if (showCouponSelector) {
        CouponSelectorBottomSheet(
            coupons = uiState.availableCoupons,
            selectedCoupon = uiState.selectedCoupon,
            isLoading = uiState.isLoadingCoupons,
            onCouponSelected = { coupon ->
                viewModel.applyCoupon(coupon)
                showCouponSelector = false
            },
            onDismiss = { showCouponSelector = false },
            getEstimatedDiscount = { coupon ->
                viewModel.getEstimatedDiscount(coupon)
            }
        )
    }
}

@Composable
fun OrderSummaryCard(uiState: CartUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                "Order Summary",
                style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(bottom = 12.dp)
            )

            uiState.items.forEach { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "${item.quantity}x ${item.name}",
                        style = OnlyCoffeeTextStyles.Body,
                        color = TextSecondary
                    )
                    Text(
                        String.format("$%.2f", item.totalPrice),
                        style = OnlyCoffeeTextStyles.Body,
                        color = TextSecondary
                    )
                }
            }
        }
    }
}

@Composable
fun CouponSectionCard(
    selectedCoupon: Coupon?,
    discountAmount: Double,
    onSelectCoupon: () -> Unit,
    onRemoveCoupon: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onSelectCoupon),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (selectedCoupon != null) SuccessLight else Color.White
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Discount,
                    contentDescription = null,
                    tint = if (selectedCoupon != null) SuccessDark else BrandPrimary
                )

                if (selectedCoupon != null) {
                    Column {
                        Text(
                            selectedCoupon.displayValue,
                            style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                            color = SuccessDark
                        )
                        Text(
                            selectedCoupon.label,
                            style = OnlyCoffeeTextStyles.Caption,
                            color = SuccessDark
                        )
                    }
                } else {
                    Text(
                        "Add a coupon",
                        style = OnlyCoffeeTextStyles.Body,
                        color = BrandPrimary
                    )
                }
            }

            if (selectedCoupon != null) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        String.format("-$%.2f", discountAmount),
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        color = SuccessDark
                    )

                    TextButton(onClick = onRemoveCoupon) {
                        Text("Change", color = SuccessDark)
                    }
                }
            }
        }
    }
}

@Composable
fun PaymentSummaryCard(
    subtotal: Double,
    discount: Double,
    tax: Double,
    total: Double
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                "Payment Summary",
                style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // Subtotal
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Subtotal", style = OnlyCoffeeTextStyles.Body, color = TextSecondary)
                Text(String.format("$%.2f", subtotal), style = OnlyCoffeeTextStyles.Body)
            }

            // Discount
            if (discount > 0) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Discount", style = OnlyCoffeeTextStyles.Body, color = SuccessDark)
                    Text(
                        String.format("-$%.2f", discount),
                        style = OnlyCoffeeTextStyles.Body,
                        color = SuccessDark
                    )
                }
            }

            // Tax
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Tax (8.75%)", style = OnlyCoffeeTextStyles.Body, color = TextSecondary)
                Text(String.format("$%.2f", tax), style = OnlyCoffeeTextStyles.Body)
            }

            Divider(modifier = Modifier.padding(vertical = 12.dp))

            // Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Total", style = OnlyCoffeeTextStyles.H3)
                Text(
                    String.format("$%.2f", total),
                    style = OnlyCoffeeTextStyles.H3,
                    color = BrandPrimary
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CouponSelectorBottomSheet(
    coupons: List<Coupon>,
    selectedCoupon: Coupon?,
    isLoading: Boolean,
    onCouponSelected: (Coupon) -> Unit,
    onDismiss: () -> Unit,
    getEstimatedDiscount: (Coupon) -> String
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp)
        ) {
            Text(
                "Select a Coupon",
                style = OnlyCoffeeTextStyles.H2,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            when {
                isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = BrandPrimary)
                    }
                }

                coupons.isEmpty() -> {
                    Text(
                        "No coupons available",
                        style = OnlyCoffeeTextStyles.Body,
                        color = TextSecondary,
                        modifier = Modifier.padding(32.dp)
                    )
                }

                else -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(coupons) { coupon ->
                            CouponSelectorItem(
                                coupon = coupon,
                                isSelected = coupon.id == selectedCoupon?.id,
                                estimatedDiscount = getEstimatedDiscount(coupon),
                                onClick = { onCouponSelected(coupon) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CouponSelectorItem(
    coupon: Coupon,
    isSelected: Boolean,
    estimatedDiscount: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) SuccessLight else BackgroundSecondary
        ),
        border = if (isSelected) CardDefaults.outlinedCardBorder() else null
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        coupon.displayValue,
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        color = if (isSelected) SuccessDark else BrandPrimary
                    )

                    if (isSelected) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Selected",
                            tint = SuccessDark,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Text(
                    coupon.label,
                    style = OnlyCoffeeTextStyles.Caption,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 4.dp)
                )

                Text(
                    coupon.expiryText,
                    style = OnlyCoffeeTextStyles.Caption,
                    color = if (coupon.isExpiringSoon) WarningDark else TextTertiary,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Text(
                estimatedDiscount,
                style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                color = if (isSelected) SuccessDark else SuccessDark
            )
        }
    }
}
