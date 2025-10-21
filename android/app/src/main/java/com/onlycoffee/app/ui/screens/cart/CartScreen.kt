package com.onlycoffee.app.ui.screens.cart

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Discount
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
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

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cart", style = OnlyCoffeeTextStyles.H2) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundPrimary,
                    titleContentColor = TextPrimary
                )
            )
        },
        bottomBar = {
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
    ) { paddingValues ->
        if (uiState.isEmpty) {
            EmptyCartView(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(BackgroundSecondary),
                contentPadding = PaddingValues(16.dp),
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
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.name,
                    style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold)
                )

                if (!item.customizations.isNullOrEmpty()) {
                    Text(
                        text = item.customizations.joinToString(", "),
                        style = OnlyCoffeeTextStyles.Caption,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                Text(
                    text = String.format("$%.2f", item.price),
                    style = OnlyCoffeeTextStyles.Body,
                    color = BrandPrimary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    IconButton(
                        onClick = { onQuantityChange(item.quantity - 1) },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Remove,
                            contentDescription = "Decrease quantity",
                            tint = BrandPrimary
                        )
                    }

                    Text(
                        text = item.quantity.toString(),
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )

                    IconButton(
                        onClick = { onQuantityChange(item.quantity + 1) },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Increase quantity",
                            tint = BrandPrimary
                        )
                    }
                }

                IconButton(
                    onClick = onRemove,
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Remove item",
                        tint = Color.Red
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
        shadowElevation = 8.dp,
        color = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Subtotal
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Subtotal", style = OnlyCoffeeTextStyles.Body)
                Text(
                    String.format("$%.2f", subtotal),
                    style = OnlyCoffeeTextStyles.Body
                )
            }

            // Discount
            if (discount > 0) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "Discount",
                        style = OnlyCoffeeTextStyles.Body,
                        color = SuccessDark
                    )
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
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Tax", style = OnlyCoffeeTextStyles.Body)
                Text(
                    String.format("$%.2f", tax),
                    style = OnlyCoffeeTextStyles.Body
                )
            }

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            // Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "Total",
                    style = OnlyCoffeeTextStyles.H3
                )
                Text(
                    String.format("$%.2f", total),
                    style = OnlyCoffeeTextStyles.H3,
                    color = BrandPrimary
                )
            }

            Button(
                onClick = onCheckout,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp)
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                shape = RoundedCornerShape(28.dp)
            ) {
                Text(
                    "Proceed to Checkout",
                    style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun EmptyCartView(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            "Your cart is empty",
            style = OnlyCoffeeTextStyles.H2,
            color = TextSecondary
        )
        Text(
            "Add some items to get started",
            style = OnlyCoffeeTextStyles.Body,
            color = TextSecondary,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}
