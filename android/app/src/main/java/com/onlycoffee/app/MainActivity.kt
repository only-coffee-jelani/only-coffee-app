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
import com.onlycoffee.app.data.model.SplashScreen
import com.onlycoffee.app.data.repository.SplashScreenRepository
import com.onlycoffee.app.ui.screens.modal.LaunchModalScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.onlycoffee.app.ui.navigation.OnlyCoffeeNavigation
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import android.util.Log

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject
    lateinit var splashScreenRepository: SplashScreenRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        installSplashScreen()

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            OnlyCoffeeTheme {
                OnlyCoffeeApp(splashScreenRepository)
            }
        }
    }
}

@Composable
fun OnlyCoffeeApp(
    splashScreenRepository: SplashScreenRepository
) {
    val navController = rememberNavController()
    var activeSplashScreen by remember { mutableStateOf<SplashScreen?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    // Fetch active splash screen from API on app start
    LaunchedEffect(Unit) {
        try {
            Log.d("SplashScreen", "Starting to fetch splash screen...")
            val splashScreen = withContext(Dispatchers.IO) {
                splashScreenRepository.getCurrentSplashScreen()
            }
            activeSplashScreen = splashScreen
            Log.d("SplashScreen", "Fetched splash screen: $splashScreen")
        } catch (e: Exception) {
            Log.e("SplashScreen", "Error fetching splash screen", e)
            e.printStackTrace()
            // If API fails, no splash screen will be shown
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        OnlyCoffeeNavigation(
            navController = navController,
            modifier = Modifier.padding(innerPadding)
        )

        // Launch modal overlay - show splash screen if available
        if (activeSplashScreen != null) {
            LaunchModalScreen(
                splashScreen = activeSplashScreen!!,
                onDismiss = { activeSplashScreen = null },
                onNavigateToMenuItem = { menuItemId ->
                    activeSplashScreen = null
                    navController.navigate("product/$menuItemId")
                },
                navController = navController
            )
        }
    }
}
