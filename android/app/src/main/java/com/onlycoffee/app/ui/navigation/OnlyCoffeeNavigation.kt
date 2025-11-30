package com.onlycoffee.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.managers.CarouselAnalyticsManager
import com.onlycoffee.app.ui.components.FloatingCartButton
import com.onlycoffee.app.ui.screens.auth.LoginScreen
import com.onlycoffee.app.ui.screens.auth.SignupScreen
import com.onlycoffee.app.ui.screens.home.HomeScreen
import com.onlycoffee.app.ui.screens.menu.MenuScreen
import com.onlycoffee.app.ui.screens.orders.OrdersScreenUpdated
import com.onlycoffee.app.ui.screens.product.ProductDetailScreen
import com.onlycoffee.app.ui.screens.profile.ProfileScreen
import com.onlycoffee.app.ui.screens.rewards.RewardsScreen
import com.onlycoffee.app.ui.screens.coupons.MyCouponsScreen
import com.onlycoffee.app.ui.screens.stores.StoreViewModel
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.OnlyCoffeeTextStyles
import com.onlycoffee.app.ui.theme.TextSecondary
import dagger.hilt.android.EntryPointAccessors
import com.onlycoffee.app.di.CarouselAnalyticsEntryPoint
import androidx.hilt.navigation.compose.hiltViewModel
import com.onlycoffee.app.ui.screens.cart.CartViewModel
import androidx.compose.runtime.collectAsState

@Composable
fun OnlyCoffeeNavigation(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    // Get CarouselAnalyticsManager from Hilt
    val context = LocalContext.current
    val analyticsManager = EntryPointAccessors.fromApplication(
        context.applicationContext,
        CarouselAnalyticsEntryPoint::class.java
    ).carouselAnalyticsManager()

    // Create a shared StoreViewModel at the navigation level
    val sharedStoreViewModel: StoreViewModel = hiltViewModel()

    // Get CartViewModel to observe cart state
    val cartViewModel: CartViewModel = hiltViewModel()
    val cartUiState by cartViewModel.uiState.collectAsState()

    Scaffold(
        bottomBar = {
            OnlyCoffeeBottomNavigation(navController = navController)
        },
        floatingActionButton = {
            // Show floating cart button on all screens except:
            // - cart and checkout screens (always hidden)
            // - product detail screen when cart has items (to avoid duplicate cart buttons)
            val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
            val shouldShowFloatingCart = when {
                currentRoute == "cart" || currentRoute == "checkout" -> false
                currentRoute?.startsWith("product_detail/") == true && cartUiState.itemCount > 0 -> false
                else -> true
            }

            if (shouldShowFloatingCart) {
                FloatingCartButton(
                    onClick = {
                        navController.navigate("cart") {
                            launchSingleTop = true
                        }
                    },
                    modifier = Modifier.padding(end = 8.dp, bottom = 8.dp)
                )
            }
        },
        modifier = modifier
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = BottomNavItem.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(BottomNavItem.Home.route) {
                HomeScreen(
                    navController = navController,
                    analyticsManager = analyticsManager
                )
            }
            composable(BottomNavItem.Menu.route) {
                MenuScreen(
                    navController = navController,
                    storeViewModel = sharedStoreViewModel
                )
            }
            composable(BottomNavItem.Orders.route) {
                OrdersScreenUpdated(navController = navController)
            }
            composable(BottomNavItem.Rewards.route) {
                RewardsScreen(navController = navController)
            }
            composable(BottomNavItem.Profile.route) {
                ProfileScreen(navController = navController)
            }
            composable(BottomNavItem.Locations.route) {
                com.onlycoffee.app.ui.screens.locations.SelectLocationScreen(
                    navController = navController,
                    storeViewModel = sharedStoreViewModel
                )
            }
            composable("select_location") {
                com.onlycoffee.app.ui.screens.locations.SelectLocationScreen(
                    navController = navController,
                    storeViewModel = sharedStoreViewModel
                )
            }
            composable("coupons") {
                MyCouponsScreen()
            }
            composable("cart") {
                com.onlycoffee.app.ui.screens.cart.CartScreen(navController = navController)
            }
            composable("checkout") {
                com.onlycoffee.app.ui.screens.cart.CheckoutScreen(navController = navController)
            }
            composable("product_detail/{menuItemId}/{storeId}") { backStackEntry ->
                val menuItemId = backStackEntry.arguments?.getString("menuItemId")
                val storeId = backStackEntry.arguments?.getString("storeId")
                if (menuItemId != null && storeId != null) {
                    ProductDetailScreen(
                        menuItemId = menuItemId,
                        storeId = storeId,
                        navController = navController
                    )
                }
            }
            composable("login") {
                LoginScreen(navController = navController)
            }
            composable("signup") {
                SignupScreen(navController = navController)
            }
        }
    }
}

@Composable
fun OnlyCoffeeBottomNavigation(
    navController: NavHostController
) {
    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.Menu,
        BottomNavItem.Rewards,
        BottomNavItem.Orders,
        BottomNavItem.Profile
    )
    
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val currentRoute = currentDestination?.route

    NavigationBar {
        items.forEach { item ->
            // Check if current route matches the item route
            // Special case: select_location screen should highlight Menu tab
            // Exclude cart and checkout from selection logic
            val selected = when {
                currentRoute == "cart" || currentRoute == "checkout" -> false
                currentRoute == item.route -> true
                currentRoute == "select_location" && item.route == "menu" -> true
                else -> currentDestination?.hierarchy?.any { it.route == item.route } == true
            }

            NavigationBarItem(
                icon = {
                    Icon(
                        painter = painterResource(id = item.iconRes),
                        contentDescription = stringResource(id = item.titleRes)
                    )
                },
                label = {
                    Text(
                        text = stringResource(id = item.titleRes),
                        style = OnlyCoffeeTextStyles.TabText
                    )
                },
                selected = selected,
                onClick = {
                    // If currently on cart or checkout, navigate without saving state
                    if (currentRoute == "cart" || currentRoute == "checkout") {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                inclusive = false
                            }
                            launchSingleTop = true
                        }
                    } else {
                        navController.navigate(item.route) {
                            // Pop up to the start destination of the graph to
                            // avoid building up a large stack of destinations
                            // on the back stack as users select items
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            // Avoid multiple copies of the same destination when
                            // reselecting the same item
                            launchSingleTop = true
                            // Restore state when reselecting a previously selected item
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BrandPrimary,
                    selectedTextColor = BrandPrimary,
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary
                )
            )
        }
    }
}

sealed class BottomNavItem(
    val route: String,
    val titleRes: Int,
    val iconRes: Int
) {
    object Home : BottomNavItem(
        route = "home",
        titleRes = R.string.nav_home,
        iconRes = R.drawable.ic_home
    )
    
    object Menu : BottomNavItem(
        route = "menu",
        titleRes = R.string.nav_menu,
        iconRes = R.drawable.ic_coffee
    )
    
    object Orders : BottomNavItem(
        route = "orders",
        titleRes = R.string.nav_orders,
        iconRes = R.drawable.ic_orders
    )
    
    object Rewards : BottomNavItem(
        route = "rewards",
        titleRes = R.string.nav_rewards,
        iconRes = R.drawable.ic_rewards
    )
    
    object Profile : BottomNavItem(
        route = "profile",
        titleRes = R.string.nav_profile,
        iconRes = R.drawable.ic_profile
    )

    object Locations : BottomNavItem(
        route = "locations",
        titleRes = R.string.nav_locations,
        iconRes = R.drawable.ic_location
    )
}
