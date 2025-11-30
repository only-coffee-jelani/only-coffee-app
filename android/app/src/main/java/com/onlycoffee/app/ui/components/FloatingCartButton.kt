package com.onlycoffee.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
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
import com.onlycoffee.app.ui.screens.cart.CartViewModel
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.StatusError

/**
 * Enterprise-level Floating Cart Button with Badge
 * Shows cart item count and provides quick access to cart
 */
@Composable
fun FloatingCartButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    cartViewModel: CartViewModel = hiltViewModel()
) {
    val uiState by cartViewModel.uiState.collectAsState()
    val itemCount = uiState.itemCount

    // Only show button if cart has items
    AnimatedVisibility(
        visible = itemCount > 0,
        enter = scaleIn(
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        ),
        exit = scaleOut(
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        ),
        modifier = modifier
    ) {
        FloatingActionButton(
            onClick = onClick,
            containerColor = BrandPrimary,
            contentColor = Color.White,
            modifier = Modifier.size(64.dp)
        ) {
            BadgedBox(
                badge = {
                    if (itemCount > 0) {
                        Badge(
                            containerColor = StatusError,
                            contentColor = Color.White,
                            modifier = Modifier.padding(4.dp)
                        ) {
                            Text(
                                text = if (itemCount > 99) "99+" else itemCount.toString(),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            ) {
                Icon(
                    imageVector = Icons.Default.ShoppingCart,
                    contentDescription = "View Cart",
                    modifier = Modifier.size(28.dp)
                )
            }
        }
    }
}

