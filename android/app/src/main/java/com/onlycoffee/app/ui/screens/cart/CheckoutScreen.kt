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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.Coupon
import com.onlycoffee.app.ui.screens.auth.AuthViewModel
import com.onlycoffee.app.ui.screens.auth.PhoneAuthDialog
import com.onlycoffee.app.ui.theme.*
import com.onlycoffee.app.utils.StripeHelper
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult
import com.stripe.android.paymentsheet.rememberPaymentSheet

@Composable
fun CheckoutScreen(
    navController: NavController,
    viewModel: CartViewModel = hiltViewModel(),
    authViewModel: AuthViewModel = hiltViewModel(),
    stripeHelper: StripeHelper = hiltViewModel<CartViewModel>().getStripeHelper()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val paymentState by viewModel.paymentState.collectAsState()
    val authUiState by authViewModel.uiState.collectAsState()
    var showCouponSelector by remember { mutableStateOf(false) }
    var showPhoneAuthDialog by remember { mutableStateOf(false) }
    var specialInstructions by remember { mutableStateOf("") }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var successOrderId by remember { mutableStateOf<String?>(null) }

    // Stripe Payment Sheet - use method reference to avoid recomposition issues
    val paymentSheetCallback: (PaymentSheetResult) -> Unit = remember {
        { result ->
            when (result) {
                is PaymentSheetResult.Completed -> {
                    // Payment successful, confirm with backend
                    val readyState = paymentState as? PaymentState.PaymentSheetReady
                    readyState?.let {
                        viewModel.confirmPayment(it.paymentIntentId, it.orderId)
                    }
                }
                is PaymentSheetResult.Canceled -> {
                    viewModel.onPaymentCanceled()
                }
                is PaymentSheetResult.Failed -> {
                    viewModel.resetPaymentState()
                }
            }
        }
    }
    val paymentSheet = rememberPaymentSheet(paymentSheetCallback)

    LaunchedEffect(Unit) {
        viewModel.loadAvailableCoupons()
    }

    // Handle payment state changes
    LaunchedEffect(paymentState) {
        when (val state = paymentState) {
            is PaymentState.AuthenticationRequired -> {
                // Show phone authentication dialog
                showPhoneAuthDialog = true
            }
            is PaymentState.PaymentSheetReady -> {
                // Present payment sheet with Google Pay enabled
                // Enterprise-level: Use StripeHelper to get production-ready configuration
                val configuration = stripeHelper.createPaymentSheetConfiguration(
                    merchantDisplayName = "Only Coffee",
                    merchantCountryCode = "US"
                )
                paymentSheet.presentWithPaymentIntent(
                    paymentIntentClientSecret = state.clientSecret,
                    configuration = configuration
                )
            }
            is PaymentState.Success -> {
                // Enterprise-level: Handle navigation based on authentication status
                if (authUiState.isAuthenticated) {
                    // Authenticated users: Navigate to Orders screen to see their order
                    navController.navigate("orders") {
                        popUpTo("cart") { inclusive = true }
                        launchSingleTop = true
                    }
                } else {
                    // Guest users: Show success dialog, then navigate to home
                    successOrderId = state.orderId
                    showSuccessDialog = true
                }
                viewModel.resetPaymentState()
            }
            is PaymentState.Error -> {
                // Show error message (handled in UI)
            }
            else -> {
                // Other states handled in UI
            }
        }
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
                val isProcessing = paymentState is PaymentState.CreatingOrder ||
                        paymentState is PaymentState.CreatingPaymentIntent ||
                        paymentState is PaymentState.ConfirmingPayment

                Button(
                    onClick = {
                        // Get store ID from cart state
                        val storeId = uiState.currentStoreId
                        if (storeId != null) {
                            viewModel.placeOrder(
                                storeId = storeId,
                                specialInstructions = specialInstructions.ifBlank { null }
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    enabled = !isProcessing && uiState.currentStoreId != null,
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                    shape = RoundedCornerShape(28.dp)
                ) {
                    if (isProcessing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            when (paymentState) {
                                is PaymentState.CreatingOrder -> "Creating Order..."
                                is PaymentState.CreatingPaymentIntent -> "Preparing Payment..."
                                is PaymentState.ConfirmingPayment -> "Confirming..."
                                else -> "Processing..."
                            },
                            style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    } else {
                        Text(
                            "Place Order",
                            style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    }
                }

                // Show error message if payment failed
                if (paymentState is PaymentState.Error) {
                    val errorMessage = (paymentState as PaymentState.Error).message
                    Column(
                        modifier = Modifier.padding(top = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = errorMessage,
                            color = MaterialTheme.colorScheme.error,
                            style = OnlyCoffeeTextStyles.Caption
                        )
                        TextButton(
                            onClick = { viewModel.retryPayment() },
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Text(
                                "Retry Payment",
                                color = BrandPrimary,
                                style = OnlyCoffeeTextStyles.Caption.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                    }
                }

                // Show canceled message
                if (paymentState is PaymentState.Canceled) {
                    Text(
                        text = "Payment canceled. Please try again.",
                        color = TextSecondary,
                        style = OnlyCoffeeTextStyles.Caption,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }

    // Phone authentication dialog
    if (showPhoneAuthDialog) {
        PhoneAuthDialog(
            authenticationManager = viewModel.getAuthenticationManager(),
            onDismiss = {
                showPhoneAuthDialog = false
                viewModel.resetPaymentState()
            },
            onAuthSuccess = {
                showPhoneAuthDialog = false
                // Retry placing order after successful authentication
                val storeId = uiState.currentStoreId
                if (storeId != null) {
                    viewModel.placeOrder(storeId, specialInstructions.ifBlank { null })
                }
            }
        )
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

    // Success dialog for guest users
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = {
                showSuccessDialog = false
                navController.navigate("home") {
                    popUpTo("cart") { inclusive = true }
                    launchSingleTop = true
                }
            },
            icon = {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = BrandPrimary,
                    modifier = Modifier.size(48.dp)
                )
            },
            title = {
                Text(
                    text = "Order Placed Successfully!",
                    style = OnlyCoffeeTextStyles.H2
                )
            },
            text = {
                Column {
                    Text(
                        text = "Your order has been confirmed and is being prepared.",
                        style = OnlyCoffeeTextStyles.Body
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    successOrderId?.let { orderId ->
                        Text(
                            text = "Order ID: ${orderId.take(8)}",
                            style = OnlyCoffeeTextStyles.Caption,
                            color = TextSecondary
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Sign in to track your orders and earn rewards!",
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        color = BrandPrimary
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSuccessDialog = false
                        navController.navigate("login") {
                            popUpTo("cart") { inclusive = true }
                        }
                    }
                ) {
                    Text("Sign In")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showSuccessDialog = false
                        navController.navigate("home") {
                            popUpTo("cart") { inclusive = true }
                            launchSingleTop = true
                        }
                    }
                ) {
                    Text("Continue as Guest")
                }
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
