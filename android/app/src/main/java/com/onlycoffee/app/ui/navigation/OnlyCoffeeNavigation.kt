package com.onlycoffee.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.ui.screens.home.HomeScreen
import com.onlycoffee.app.ui.screens.menu.MenuScreen
import com.onlycoffee.app.ui.screens.orders.OrdersScreen
import com.onlycoffee.app.ui.screens.product.ProductDetailScreen
import com.onlycoffee.app.ui.screens.profile.ProfileScreen
import com.onlycoffee.app.ui.screens.rewards.RewardsScreen
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.OnlyCoffeeTextStyles
import com.onlycoffee.app.ui.theme.TextSecondary

@Composable
fun OnlyCoffeeNavigation(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    Scaffold(
        bottomBar = {
            OnlyCoffeeBottomNavigation(navController = navController)
        },
        modifier = modifier
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = BottomNavItem.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(BottomNavItem.Home.route) {
                HomeScreen(navController = navController)
            }
            composable(BottomNavItem.Menu.route) {
                MenuScreen(navController = navController)
            }
            composable(BottomNavItem.Orders.route) {
                OrdersScreen(navController = navController)
            }
            composable(BottomNavItem.Rewards.route) {
                RewardsScreen(navController = navController)
            }
            composable(BottomNavItem.Profile.route) {
                ProfileScreen(navController = navController)
            }
            composable(BottomNavItem.Locations.route) {
                com.onlycoffee.app.ui.screens.locations.LocationsScreen(navController = navController)
            }
            composable("select_location") {
                com.onlycoffee.app.ui.screens.locations.SelectLocationScreen(navController = navController)
            }
            composable("product_detail/{menuItemId}") { backStackEntry ->
                val menuItemId = backStackEntry.arguments?.getString("menuItemId")
                val menuItem = MenuItem.sampleItems.find { it.id == menuItemId }
                menuItem?.let {
                    ProductDetailScreen(
                        menuItem = it,
                        navController = navController
                    )
                }
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
    
    NavigationBar {
        items.forEach { item ->
            val selected = currentDestination?.hierarchy?.any { it.route == item.route } == true
            
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
