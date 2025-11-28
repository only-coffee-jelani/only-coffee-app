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
import com.onlycoffee.app.data.repository.SplashScreenRepository
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

    @Inject
    lateinit var splashScreenRepository: SplashScreenRepository

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
                OnlyCoffeeApp(
                    pushNotificationManager = pushNotificationManager,
                    splashScreenRepository = splashScreenRepository
                )
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
fun OnlyCoffeeApp(
    pushNotificationManager: PushNotificationManager,
    splashScreenRepository: SplashScreenRepository
) {
    val navController = rememberNavController()
    var activeSplashScreen by remember { mutableStateOf<com.onlycoffee.app.data.model.SplashScreen?>(null) }

    // Fetch active splash screen from API on app start
    LaunchedEffect(Unit) {
        try {
            val splashScreen = splashScreenRepository.getCurrentSplashScreen()
            activeSplashScreen = splashScreen
        } catch (e: Exception) {
            // Log error and continue without splash screen
            e.printStackTrace()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        OnlyCoffeeNavigation(
            navController = navController,
            modifier = Modifier.padding(innerPadding)
        )

        // Launch modal overlay with splash screen
        if (activeSplashScreen != null) {
            LaunchModalScreen(
                splashScreen = activeSplashScreen!!,
                onDismiss = { activeSplashScreen = null },
                onNavigateToMenuItem = { menuItemId ->
                    activeSplashScreen = null
                    navController.navigate("product/$menuItemId")
                },
                navController = navController,
                splashScreenRepository = splashScreenRepository
            )
        }
    }
}