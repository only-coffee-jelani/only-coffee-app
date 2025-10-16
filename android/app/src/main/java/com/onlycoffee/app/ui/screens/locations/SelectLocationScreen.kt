package com.onlycoffee.app.ui.screens.locations

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.maps.model.LatLng
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.Store
import com.onlycoffee.app.ui.components.AppHeader
import com.onlycoffee.app.ui.components.StoreLocatorMap
import com.onlycoffee.app.ui.screens.orders.OrdersViewModel
import com.onlycoffee.app.ui.screens.orders.StoreTab
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextOnPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import com.onlycoffee.app.utils.LocationUtils

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun SelectLocationScreen(
    navController: NavController,
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    // Location permission handling
    val fineLocationPermissionState = rememberPermissionState(
        android.Manifest.permission.ACCESS_FINE_LOCATION
    )

    val context = LocalContext.current

    // Request location permissions
    LaunchedEffect(fineLocationPermissionState.status.isGranted) {
        if (!fineLocationPermissionState.status.isGranted) {
            fineLocationPermissionState.launchPermissionRequest()
        } else {
            if (LocationUtils.isLocationEnabled(context)) {
                val location = LocationUtils.getCurrentLocation(context)
                location?.let {
                    viewModel.updateUserLocation(it.latitude, it.longitude)
                }
            }
        }
    }

    var searchText by remember { mutableStateOf("") }

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
                        viewModel.searchStores(it)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = Spacing.screenPadding),
                    placeholder = {
                        Text(
                            text = "Search by city or zip code",
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
                    shape = RoundedCornerShape(CornerRadius.input)
                )
            }

            item {
                Spacer(modifier = Modifier.height(Spacing.lg))
            }

            item {
                // Map View
                val userLat = uiState.userLatitude
                val userLng = uiState.userLongitude
                val userLocation = if (userLat != null && userLng != null) {
                    LatLng(userLat, userLng)
                } else null

                StoreLocatorMap(
                    stores = uiState.filteredStores,
                    userLocation = userLocation,
                    selectedStore = uiState.selectedStore,
                    onStoreSelected = { store ->
                        viewModel.selectStore(store)
                    },
                    modifier = Modifier.padding(horizontal = Spacing.screenPadding)
                )
            }

            item {
                Spacer(modifier = Modifier.height(Spacing.lg))
            }

            item {
                // Store Tabs
                TabRow(
                    selectedTabIndex = uiState.selectedTab.ordinal,
                    modifier = Modifier.padding(horizontal = Spacing.screenPadding),
                    containerColor = BackgroundPrimary,
                    indicator = { tabPositions ->
                        TabRowDefaults.Indicator(
                            modifier = Modifier.tabIndicatorOffset(tabPositions[uiState.selectedTab.ordinal]),
                            color = BrandPrimary,
                            height = 3.dp
                        )
                    }
                ) {
                    StoreTab.values().forEach { tab ->
                        Tab(
                            selected = uiState.selectedTab == tab,
                            onClick = { viewModel.selectTab(tab) },
                            text = {
                                Text(
                                    text = tab.displayName,
                                    fontWeight = if (uiState.selectedTab == tab) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (uiState.selectedTab == tab) BrandPrimary else TextSecondary
                                )
                            }
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(Spacing.md))
            }

            // Store List
            items(uiState.filteredStores) { store ->
                SelectLocationCard(
                    store = store,
                    isSelected = uiState.selectedStore?.id == store.id,
                    onStoreClick = { viewModel.selectStore(it) },
                    onSelectClick = {
                        // Save selected store and navigate to menu
                        viewModel.saveSelectedStore(it)
                        navController.navigate("menu") {
                            popUpTo("menu") { inclusive = true }
                        }
                    },
                    isFavorite = viewModel.isFavorite(store.id),
                    onFavoriteClick = { storeId ->
                        viewModel.toggleFavorite(storeId)
                    },
                    modifier = Modifier.padding(
                        horizontal = Spacing.screenPadding,
                        vertical = Spacing.xs
                    )
                )
            }
        }
}

@Composable
fun SelectLocationCard(
    store: Store,
    isSelected: Boolean,
    onStoreClick: (Store) -> Unit,
    onSelectClick: (Store) -> Unit,
    isFavorite: Boolean = false,
    onFavoriteClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    androidx.compose.material3.Card(
        modifier = modifier
            .fillMaxWidth(),
        shape = RoundedCornerShape(CornerRadius.card),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (isSelected) BrandPrimary.copy(alpha = 0.1f) else com.onlycoffee.app.ui.theme.CardBackground
        ),
        elevation = androidx.compose.material3.CardDefaults.cardElevation(defaultElevation = com.onlycoffee.app.ui.theme.Elevation.card)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md)
        ) {
            // Top row with heart in top right
            androidx.compose.foundation.layout.Box(
                modifier = Modifier.fillMaxWidth()
            ) {
                androidx.compose.foundation.layout.Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = store.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = com.onlycoffee.app.ui.theme.TextPrimary
                        )

                        Spacer(modifier = Modifier.height(Spacing.xs))

                        Text(
                            text = store.address.formattedAddress,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(Spacing.xs))

                        androidx.compose.foundation.layout.Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = store.formattedDistance,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )

                            if (store.formattedDistance.isNotEmpty()) {
                                Text(
                                    text = " • ",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }

                            Text(
                                text = if (store.isOpen) "Open until 9:00 PM" else "Closed",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (store.isOpen) BrandPrimary else TextSecondary
                            )
                        }
                    }
                }

                // Favorite heart icon positioned in top right
                androidx.compose.material3.IconButton(
                    onClick = { onFavoriteClick(store.id) },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(0.dp)
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = if (isFavorite) "Remove from favorites" else "Add to favorites",
                        tint = if (isFavorite) BrandPrimary else TextSecondary,
                        modifier = Modifier.padding(0.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.md))

            // Select Button
            Button(
                onClick = { onSelectClick(store) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandPrimary
                ),
                shape = RoundedCornerShape(CornerRadius.button)
            ) {
                Text(
                    text = "Select This Location",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = TextOnPrimary,
                    modifier = Modifier.padding(vertical = Spacing.xs)
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun SelectLocationScreenPreview() {
    OnlyCoffeeTheme {
        SelectLocationScreen(navController = rememberNavController())
    }
}
