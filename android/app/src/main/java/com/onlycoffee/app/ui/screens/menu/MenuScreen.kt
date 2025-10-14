package com.onlycoffee.app.ui.screens.menu

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.MenuCategory
import com.onlycoffee.app.ui.components.AppHeader
import com.onlycoffee.app.ui.components.MenuItemListCard
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CardBackground
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.IconSize
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.StatusError
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuScreen(
    navController: NavController,
    viewModel: MenuViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchText by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundPrimary)
    ) {
        // App Header
        AppHeader(title = stringResource(R.string.menu))

        // Content
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundPrimary),
            contentPadding = PaddingValues(bottom = Spacing.lg)
        ) {
            item {
                // Search Bar
                OutlinedTextField(
                    value = searchText,
                    onValueChange = { 
                        searchText = it
                        viewModel.searchItems(it)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = Spacing.screenPadding),
                    placeholder = {
                        Text(
                            text = stringResource(R.string.search_menu_items),
                            color = TextSecondary
                        )
                    },
                    leadingIcon = {
                        Icon(
                            painter = painterResource(R.drawable.ic_search),
                            contentDescription = null,
                            tint = TextSecondary
                        )
                    },
                    trailingIcon = {
                        if (searchText.isNotEmpty()) {
                            IconButton(
                                onClick = { 
                                    searchText = ""
                                    viewModel.searchItems("")
                                }
                            ) {
                                Icon(
                                    painter = painterResource(R.drawable.ic_clear),
                                    contentDescription = "Clear",
                                    tint = TextSecondary
                                )
                            }
                        }
                    },
                    shape = RoundedCornerShape(CornerRadius.input),
                    singleLine = true
                )
            }
            
            item {
                Spacer(modifier = Modifier.height(Spacing.md))
            }
            
            item {
                // Category Filter
                LazyRow(
                    contentPadding = PaddingValues(horizontal = Spacing.screenPadding),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
                ) {
                    items(MenuCategory.values()) { category ->
                        FilterChip(
                            onClick = { viewModel.selectCategory(category) },
                            label = {
                                Text(
                                    text = category.displayName,
                                    style = MaterialTheme.typography.labelMedium
                                )
                            },
                            selected = uiState.selectedCategory == category,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = BrandPrimary,
                                selectedLabelColor = androidx.compose.ui.graphics.Color.White,
                                containerColor = CardBackground,
                                labelColor = TextPrimary
                            )
                        )
                    }
                }
            }
            
            item {
                Spacer(modifier = Modifier.height(Spacing.lg))
            }
            
            // Menu Items
            items(uiState.filteredItems) { item ->
                MenuItemListCard(
                    menuItem = item,
                    onItemClick = { menuItem ->
                        navController.navigate("product_detail/${menuItem.id}")
                    },
                    modifier = Modifier.padding(
                        horizontal = Spacing.screenPadding,
                        vertical = Spacing.xs
                    )
                )
            }
            
            // Empty State
            if (uiState.filteredItems.isEmpty() && !uiState.isLoading) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(Spacing.xl),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.ic_search),
                            contentDescription = null,
                            tint = TextSecondary,
                            modifier = Modifier.size(64.dp)
                        )
                        
                        Spacer(modifier = Modifier.height(Spacing.md))
                        
                        Text(
                            text = if (searchText.isNotEmpty()) {
                                stringResource(R.string.no_items_found)
                            } else {
                                stringResource(R.string.no_items_available)
                            },
                            style = MaterialTheme.typography.titleMedium,
                            color = TextPrimary
                        )
                        
                        Text(
                            text = if (searchText.isNotEmpty()) {
                                stringResource(R.string.try_different_search)
                            } else {
                                stringResource(R.string.check_back_later)
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun MenuScreenPreview() {
    OnlyCoffeeTheme {
        MenuScreen(navController = rememberNavController())
    }
}
