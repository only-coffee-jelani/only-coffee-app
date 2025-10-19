package com.onlycoffee.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.onlycoffee.app.data.model.Promotion
import com.onlycoffee.app.ui.screens.modal.LaunchModalScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.onlycoffee.app.ui.navigation.OnlyCoffeeNavigation
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.managers.PushNotificationManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var pushNotificationManager: PushNotificationManager

    private val activityScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        installSplashScreen()

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize push notifications
        initializePushNotifications()

        setContent {
            OnlyCoffeeTheme {
                OnlyCoffeeApp(pushNotificationManager)
            }
        }
    }

    private fun initializePushNotifications() {
        activityScope.launch {
            pushNotificationManager.checkPermissionStatus()

            // Request token if permission is granted
            if (pushNotificationManager.permissionGranted.value) {
                pushNotificationManager.requestToken()
            }
        }
    }
}

@Composable
fun OnlyCoffeeApp(pushNotificationManager: PushNotificationManager) {
    val navController = rememberNavController()
    var activePromotion by remember { mutableStateOf<Promotion?>(null) }

    // Fetch active launch modal promotion on app start
    LaunchedEffect(Unit) {
        // Hardcoded Waffolino promotion for now
        // TODO: Replace with actual API call
        activePromotion = Promotion(
            id = "1",
            title = "Fall Special: Waffolino",
            description = "Try our signature Waffolino - a perfect blend of espresso and waffle flavors",
            promotionType = com.onlycoffee.app.data.model.PromotionType.LAUNCH_MODAL,
            imageUrl = "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/waffolino-launch-v2.webp",
            targetMenuItemId = null,
            targetUrl = null,
            startDate = "2025-10-01T00:00:00Z",
            endDate = "2025-12-31T23:59:59Z",
            isActive = true,
            displayDuration = 3,
            sortOrder = 0
        )
    }

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        OnlyCoffeeNavigation(
            navController = navController,
            modifier = Modifier.padding(innerPadding)
        )

        // Launch modal overlay
        if (activePromotion != null) {
            LaunchModalScreen(
                promotion = activePromotion!!,
                onDismiss = { activePromotion = null },
                onNavigateToMenuItem = { menuItemId ->
                    activePromotion = null
                    navController.navigate("product/$menuItemId")
                },
                navController = navController
            )
        }
    }
}
