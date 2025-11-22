package com.onlycoffee.app.ui.screens.orders

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.Order
import com.onlycoffee.app.data.model.OrderStatus
import com.onlycoffee.app.ui.screens.auth.AuthViewModel
import com.onlycoffee.app.ui.theme.BrandPrimary
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun OrdersScreenUpdated(
    navController: NavController,
    authViewModel: AuthViewModel = hiltViewModel(),
    viewModel: OrdersScreenViewModel = hiltViewModel()
) {
    val authUiState by authViewModel.uiState.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(authUiState.isAuthenticated) {
        if (authUiState.isAuthenticated) {
            viewModel.loadOrders()
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        if (authUiState.isAuthenticated) {
            when {
                uiState.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                uiState.orders.isEmpty() -> {
                    EmptyOrdersContent()
                }
                else -> {
                    OrdersListContent(uiState.orders, navController, viewModel)
                }
            }
        } else {
            UnauthenticatedOrdersContent(navController)
        }
    }
}

@Composable
private fun OrdersListContent(
    orders: List<Order>,
    navController: NavController,
    viewModel: OrdersScreenViewModel
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(orders) { order ->
            OrderCard(order, onClick = {}, onReorder = { viewModel.reorderOrder(order.id) })
        }
    }
}

@Composable
private fun OrderCard(order: Order, onClick: () -> Unit, onReorder: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatDate(order.createdAt),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusChip(order.status)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${order.items.size} items",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (order.items.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = order.items.joinToString(", ") { it.name },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
            }
            if (order.status == OrderStatus.COMPLETED) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(onClick = onReorder, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Reorder")
                }
            }
        }
    }
}

@Composable
private fun StatusChip(status: OrderStatus) {
    val (color, text) = when (status) {
        OrderStatus.PENDING -> Color(0xFFFFA500) to "Pending"
        OrderStatus.CONFIRMED -> Color(0xFF2196F3) to "Confirmed"
        OrderStatus.PREPARING -> Color(0xFF2196F3) to "Preparing"
        OrderStatus.READY -> Color(0xFF4CAF50) to "Ready"
        OrderStatus.COMPLETED -> Color(0xFF4CAF50) to "Completed"
        OrderStatus.CANCELLED -> Color(0xFFF44336) to "Cancelled"
        OrderStatus.PAYMENT_FAILED -> Color(0xFFF44336) to "Payment Failed"
    }
    Surface(shape = RoundedCornerShape(16.dp), color = color.copy(alpha = 0.1f)) {
        Text(
            text = text, style = MaterialTheme.typography.labelMedium, color = color,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

@Composable
private fun EmptyOrdersContent() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.ShoppingBag,
            contentDescription = null,
            tint = BrandPrimary,
            modifier = Modifier.size(80.dp)
        )
        Spacer(modifier = Modifier.height(20.dp))
        Text(
            text = "No Orders Yet",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Your order history will appear here",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun UnauthenticatedOrdersContent(navController: NavController) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.ShoppingBag,
            contentDescription = null,
            tint = BrandPrimary,
            modifier = Modifier.size(80.dp)
        )
        Spacer(modifier = Modifier.height(20.dp))
        Text(
            text = "Sign In to View Orders",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Track your orders and reorder your favorites",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = { navController.navigate("login") },
            modifier = Modifier.fillMaxWidth(0.7f).height(56.dp)
        ) {
            Text("Sign In", style = MaterialTheme.typography.titleMedium)
        }
    }
}

private fun formatDate(date: Date): String {
    val formatter = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
    return formatter.format(date)
}

