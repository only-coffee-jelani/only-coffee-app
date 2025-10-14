package com.onlycoffee.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.model.Store
import com.onlycoffee.app.ui.components.MenuItemCard
import com.onlycoffee.app.ui.components.QuickActionCard
import com.onlycoffee.app.ui.components.StoreCard
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandAccent
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.GradientEnd
import com.onlycoffee.app.ui.theme.GradientStart
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextOnPrimary
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary

@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundPrimary),
        contentPadding = PaddingValues(bottom = Spacing.lg)
    ) {
        item {
            // Header Section
            HeaderSection(
                userName = uiState.userName,
                loyaltyPoints = uiState.loyaltyPoints
            )
        }
        
        item {
            Spacer(modifier = Modifier.height(Spacing.lg))
        }
        
        item {
            // Quick Actions
            QuickActionsSection(
                onOrderAheadClick = { navController.navigate("menu") },
                onFindStoresClick = { navController.navigate("stores") }
            )
        }
        
        item {
            Spacer(modifier = Modifier.height(Spacing.lg))
        }
        
        item {
            // Nearby Stores Section
            SectionHeader(
                title = stringResource(R.string.nearby_stores),
                actionText = stringResource(R.string.see_all),
                onActionClick = { navController.navigate("stores") }
            )
        }
        
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = Spacing.screenPadding),
                horizontalArrangement = Arrangement.spacedBy(Spacing.md)
            ) {
                items(uiState.nearbyStores) { store ->
                    StoreCard(
                        store = store,
                        onStoreClick = { /* Navigate to store details */ }
                    )
                }
            }
        }
        
        item {
            Spacer(modifier = Modifier.height(Spacing.lg))
        }
        
        item {
            // Featured Items Section
            SectionHeader(
                title = stringResource(R.string.featured_items),
                actionText = stringResource(R.string.view_menu),
                onActionClick = { navController.navigate("menu") }
            )
        }
        
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = Spacing.screenPadding),
                horizontalArrangement = Arrangement.spacedBy(Spacing.md)
            ) {
                items(uiState.featuredItems) { item ->
                    MenuItemCard(
                        menuItem = item,
                        onItemClick = { menuItem ->
                            navController.navigate("product_detail/${menuItem.id}")
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun HeaderSection(
    userName: String,
    loyaltyPoints: Int
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(GradientStart, GradientEnd)
                )
            )
            .padding(Spacing.screenPadding)
    ) {
        Column {
            Spacer(modifier = Modifier.height(Spacing.xl))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = stringResource(R.string.good_morning, userName),
                        style = MaterialTheme.typography.headlineMedium,
                        color = TextOnPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    
                    Text(
                        text = stringResource(R.string.welcome_back),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextOnPrimary.copy(alpha = 0.8f)
                    )
                }
                
                // Loyalty Points Badge
                Card(
                    shape = RoundedCornerShape(Spacing.lg),
                    colors = CardDefaults.cardColors(
                        containerColor = BrandAccent
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(
                            horizontal = Spacing.md,
                            vertical = Spacing.sm
                        ),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.ic_star),
                            contentDescription = null,
                            tint = TextPrimary,
                            modifier = Modifier.size(Spacing.md)
                        )
                        
                        Spacer(modifier = Modifier.width(Spacing.xs))
                        
                        Text(
                            text = loyaltyPoints.toString(),
                            style = MaterialTheme.typography.labelMedium,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(Spacing.lg))
        }
    }
}

@Composable
private fun QuickActionsSection(
    onOrderAheadClick: () -> Unit,
    onFindStoresClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.screenPadding),
        horizontalArrangement = Arrangement.spacedBy(Spacing.md)
    ) {
        QuickActionCard(
            title = stringResource(R.string.order_ahead),
            subtitle = stringResource(R.string.skip_the_line),
            iconRes = R.drawable.ic_coffee,
            onClick = onOrderAheadClick,
            modifier = Modifier.weight(1f)
        )
        
        QuickActionCard(
            title = stringResource(R.string.find_stores),
            subtitle = stringResource(R.string.locate_nearby),
            iconRes = R.drawable.ic_location,
            onClick = onFindStoresClick,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun SectionHeader(
    title: String,
    actionText: String,
    onActionClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.screenPadding),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontWeight = FontWeight.SemiBold
        )
        
        Text(
            text = actionText,
            style = MaterialTheme.typography.labelMedium,
            color = BrandPrimary,
            fontWeight = FontWeight.Medium
        )
    }
    
    Spacer(modifier = Modifier.height(Spacing.md))
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    OnlyCoffeeTheme {
        HomeScreen(navController = rememberNavController())
    }
}
