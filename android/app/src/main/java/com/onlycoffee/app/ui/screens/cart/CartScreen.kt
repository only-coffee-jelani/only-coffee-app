package com.onlycoffee.app.ui.screens.cart

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Discount
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.OrderItem
import com.onlycoffee.app.ui.theme.*

@Composable
fun CartScreen(
    navController: NavController,
    viewModel: CartViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundPrimary)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top Bar with Back Button
            TopAppBar(
                title = {
                    Text(
                        text = "Cart",
                        style = OnlyCoffeeTextStyles.H2,
                        color = TextPrimary
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = TextPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundPrimary,
                    titleContentColor = TextPrimary
                )
            )

            // Content
            if (uiState.isEmpty) {
                EmptyCartView(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                )
            } else {
                // Cart Items List
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .background(BackgroundSecondary),
                    contentPadding = PaddingValues(
                        start = 16.dp,
                        end = 16.dp,
                        top = 16.dp,
                        bottom = 16.dp
                    ),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.items) { item ->
                        CartItemCard(
                            item = item,
                            onQuantityChange = { newQuantity ->
                                viewModel.updateItemQuantity(item, newQuantity)
                            },
                            onRemove = { viewModel.removeItem(item) }
                        )
                    }

                    // Coupon section
                    item {
                        if (uiState.selectedCoupon != null) {
                            AppliedCouponCard(
                                coupon = uiState.selectedCoupon!!,
                                discountAmount = uiState.discountAmount,
                                onRemove = { viewModel.removeCoupon() }
                            )
                        }
                    }

                    // Add spacing at bottom for checkout button
                    item {
                        Spacer(modifier = Modifier.height(180.dp))
                    }
                }

                // Checkout Bottom Bar (Fixed at bottom)
                if (!uiState.isEmpty) {
                    CartBottomBar(
                        subtotal = uiState.subtotal,
                        discount = uiState.discountAmount,
                        tax = uiState.tax,
                        total = uiState.total,
                        onCheckout = { navController.navigate("checkout") }
                    )
                }
            }
        }
    }
}

@Composable
fun CartItemCard(
    item: OrderItem,
    onQuantityChange: (Int) -> Unit,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header Row: Name and Remove Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.name,
                        style = OnlyCoffeeTextStyles.H3.copy(fontWeight = FontWeight.Bold),
                        color = TextPrimary
                    )

                    // Show formatted customizations including add-ons
                    if (item.formattedCustomizations.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        item.formattedCustomizations.forEach { customization ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(vertical = 2.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(4.dp)
                                        .background(BrandPrimary, CircleShape)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = customization,
                                    style = OnlyCoffeeTextStyles.Caption,
                                    color = TextSecondary
                                )
                            }
                        }
                    }
                }

                // Remove Button
                IconButton(
                    onClick = onRemove,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Remove item",
                        tint = StatusError,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Bottom Row: Price and Quantity Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Price
                Column {
                    Text(
                        text = "Item Price",
                        style = OnlyCoffeeTextStyles.Caption,
                        color = TextSecondary
                    )
                    Text(
                        text = String.format("$%.2f", item.price + item.addOnsPrice),
                        style = OnlyCoffeeTextStyles.H3.copy(fontWeight = FontWeight.Bold),
                        color = BrandPrimary
                    )
                }

                // Quantity Controls
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = BrandPrimary.copy(alpha = 0.1f)),
                    modifier = Modifier.height(44.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp)
                    ) {
                        IconButton(
                            onClick = { onQuantityChange(item.quantity - 1) },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Remove,
                                contentDescription = "Decrease quantity",
                                tint = BrandPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Text(
                            text = item.quantity.toString(),
                            style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                            color = TextPrimary,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )

                        IconButton(
                            onClick = { onQuantityChange(item.quantity + 1) },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Increase quantity",
                                tint = BrandPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }

            // Total for this item
            if (item.quantity > 1) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Text(
                        text = "Total: ${String.format("$%.2f", item.totalPrice)}",
                        style = OnlyCoffeeTextStyles.Caption.copy(fontWeight = FontWeight.SemiBold),
                        color = TextSecondary
                    )
                }
            }
        }
    }
}

@Composable
fun AppliedCouponCard(
    coupon: com.onlycoffee.app.data.model.Coupon,
    discountAmount: Double,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SuccessLight)
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
                    tint = SuccessDark
                )

                Column {
                    Text(
                        text = coupon.displayValue,
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        color = SuccessDark
                    )
                    Text(
                        text = coupon.label,
                        style = OnlyCoffeeTextStyles.Caption,
                        color = SuccessDark
                    )
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = String.format("-$%.2f", discountAmount),
                    style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                    color = SuccessDark
                )

                TextButton(onClick = onRemove) {
                    Text("Remove", color = SuccessDark)
                }
            }
        }
    }
}

@Composable
fun CartBottomBar(
    subtotal: Double,
    discount: Double,
    tax: Double,
    total: Double,
    onCheckout: () -> Unit
) {
    Surface(
        shadowElevation = 12.dp,
        color = CardBackground,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            // Order Summary Header
            Text(
                text = "Order Summary",
                style = OnlyCoffeeTextStyles.H3.copy(fontWeight = FontWeight.Bold),
                color = TextPrimary,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // Subtotal
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Subtotal",
                    style = OnlyCoffeeTextStyles.Body,
                    color = TextSecondary
                )
                Text(
                    text = String.format("$%.2f", subtotal),
                    style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.SemiBold),
                    color = TextPrimary
                )
            }

            // Discount
            if (discount > 0) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Discount,
                            contentDescription = null,
                            tint = SuccessDark,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Discount",
                            style = OnlyCoffeeTextStyles.Body,
                            color = SuccessDark
                        )
                    }
                    Text(
                        text = String.format("-$%.2f", discount),
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.SemiBold),
                        color = SuccessDark
                    )
                }
            }

            // Tax
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Tax (8%)",
                    style = OnlyCoffeeTextStyles.Body,
                    color = TextSecondary
                )
                Text(
                    text = String.format("$%.2f", tax),
                    style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.SemiBold),
                    color = TextPrimary
                )
            }

            // Divider
            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                thickness = 1.dp,
                color = TextSecondary.copy(alpha = 0.2f)
            )

            // Total
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Total",
                    style = OnlyCoffeeTextStyles.H2.copy(fontWeight = FontWeight.Bold),
                    color = TextPrimary
                )
                Text(
                    text = String.format("$%.2f", total),
                    style = OnlyCoffeeTextStyles.H2.copy(fontWeight = FontWeight.Bold),
                    color = BrandPrimary
                )
            }

            // Checkout Button
            Button(
                onClick = onCheckout,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                shape = RoundedCornerShape(CornerRadius.button),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Proceed to Checkout",
                        style = OnlyCoffeeTextStyles.Body.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        ),
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyCartView(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Empty cart icon
        Box(
            modifier = Modifier
                .size(120.dp)
                .background(BrandPrimary.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.ShoppingCart,
                contentDescription = null,
                tint = BrandPrimary,
                modifier = Modifier.size(60.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Your cart is empty",
            style = OnlyCoffeeTextStyles.H2.copy(fontWeight = FontWeight.Bold),
            color = TextPrimary,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Add some delicious items from our menu to get started!",
            style = OnlyCoffeeTextStyles.Body,
            color = TextSecondary,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = Modifier.padding(horizontal = 32.dp)
        )
    }
}
