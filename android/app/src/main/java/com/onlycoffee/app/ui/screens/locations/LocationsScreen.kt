package com.onlycoffee.app.ui.screens.locations

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
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
import com.onlycoffee.app.ui.components.AppHeader
import com.onlycoffee.app.ui.components.StoreLocatorMap
import com.onlycoffee.app.ui.components.StoreListCard
import com.onlycoffee.app.ui.screens.orders.OrderType
import com.onlycoffee.app.ui.screens.orders.OrdersViewModel
import com.onlycoffee.app.ui.screens.orders.StoreTab
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextSecondary
import com.onlycoffee.app.utils.LocationUtils

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun LocationsScreen(
    navController: NavController,
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    // Location permission handling
    val fineLocationPermissionState = rememberPermissionState(
        android.Manifest.permission.ACCESS_FINE_LOCATION
    )

    val backgroundLocationPermissionState = rememberPermissionState(
        android.Manifest.permission.ACCESS_BACKGROUND_LOCATION
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

            if (!backgroundLocationPermissionState.status.isGranted) {
                backgroundLocationPermissionState.launchPermissionRequest()
            }
        }
    }

    // Refresh location periodically
    LaunchedEffect(fineLocationPermissionState.status.isGranted) {
        if (fineLocationPermissionState.status.isGranted && LocationUtils.isLocationEnabled(context)) {
            while (true) {
                val location = LocationUtils.getCurrentLocation(context)
                location?.let {
                    viewModel.updateUserLocation(it.latitude, it.longitude)
                }
                kotlinx.coroutines.delay(15000)
            }
        }
    }

    var searchText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundPrimary)
    ) {
        // App Header
        AppHeader(title = "Locations")

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
                StoreListCard(
                    store = store,
                    onStoreClick = { viewModel.selectStore(it) },
                    onOrderHereClick = {
                        // Navigate to menu with selected store
                        navController.navigate("menu")
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
}

@Preview(showBackground = true)
@Composable
fun LocationsScreenPreview() {
    OnlyCoffeeTheme {
        LocationsScreen(navController = rememberNavController())
    }
}
