package com.onlycoffee.app.ui.screens.modal

import android.util.Log
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.Promotion
import com.onlycoffee.app.data.model.SplashScreen
import com.onlycoffee.app.data.repository.SplashScreenRepository
import com.onlycoffee.app.ui.components.CachedAsyncImage
import com.onlycoffee.app.utils.DeviceIdManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun LaunchModalScreen(
    promotion: Promotion? = null,
    splashScreen: SplashScreen? = null,
    onDismiss: () -> Unit,
    onNavigateToMenuItem: (String) -> Unit,
    navController: NavController,
    splashScreenRepository: SplashScreenRepository? = null
) {
    // Use splash screen if available, otherwise fall back to promotion
    val imageUrl = splashScreen?.imageUrl ?: promotion?.imageUrl ?: ""
    val title = splashScreen?.title ?: promotion?.title ?: ""
    val targetUrl = splashScreen?.targetUrl ?: promotion?.targetUrl
    val targetMenuItemId = promotion?.targetMenuItemId // Only promotions have targetMenuItemId
    val displayDuration = splashScreen?.displayDuration ?: promotion?.displayDuration ?: 3
    val splashId = splashScreen?.id

    var timeRemaining by remember { mutableStateOf(displayDuration) }
    var sessionId by remember { mutableStateOf<String?>(null) }
    var startTime by remember { mutableStateOf(System.currentTimeMillis()) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val deviceId = remember { DeviceIdManager.getDeviceId(context) }

    // Track impression and start session when splash screen is shown
    LaunchedEffect(splashId) {
        if (splashId != null && splashScreenRepository != null) {
            // Track impression event
            splashScreenRepository.trackEvent(
                splashId = splashId,
                eventType = "impression",
                deviceId = deviceId
            )

            // Start session
            sessionId = splashScreenRepository.startSession(
                splashId = splashId,
                deviceId = deviceId
            )

            Log.d("LaunchModalScreen", "Tracked impression and started session for splash $splashId (deviceId: $deviceId)")
        }
    }

    // Countdown timer: Wait 1 second, then count down from displayDuration to 0
    LaunchedEffect(displayDuration) {
        delay(1000) // Show "Skip X" for 1 second
        while (timeRemaining > 0) {
            delay(1000)
            timeRemaining--
        }

        // Auto-complete when counter reaches 0
        if (splashId != null && splashScreenRepository != null) {
            val viewTime = ((System.currentTimeMillis() - startTime) / 1000).toInt()

            // Track complete event
            splashScreenRepository.trackEvent(
                splashId = splashId,
                eventType = "complete",
                deviceId = deviceId,
                viewTimeSeconds = viewTime
            )

            // End session
            sessionId?.let {
                splashScreenRepository.endSession(
                    sessionId = it,
                    wasSkipped = false,
                    wasClicked = false,
                    viewTimeSeconds = viewTime
                )
            }

            Log.d("LaunchModalScreen", "Tracked complete event for splash $splashId (viewTime: ${viewTime}s)")
        }

        onDismiss()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .clickable {
                // Track click event
                if (splashId != null && splashScreenRepository != null) {
                    val viewTime = ((System.currentTimeMillis() - startTime) / 1000).toInt()

                    scope.launch {
                        // Track click event
                        splashScreenRepository.trackEvent(
                            splashId = splashId,
                            eventType = "click",
                            deviceId = deviceId,
                            viewTimeSeconds = viewTime
                        )

                        // End session
                        sessionId?.let {
                            splashScreenRepository.endSession(
                                sessionId = it,
                                wasSkipped = false,
                                wasClicked = true,
                                viewTimeSeconds = viewTime
                            )
                        }

                        Log.d("LaunchModalScreen", "Tracked click event for splash $splashId")
                    }
                }

                // Navigate to menu page (always navigate to menu when splash is clicked)
                navController.navigate("menu") {
                    // Don't add to back stack so user can't go back to splash
                    launchSingleTop = true
                }
                onDismiss()
            }
    ) {
        // Full-screen promotional image with caching
        CachedAsyncImage(
            url = imageUrl,
            contentDescription = title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.FillBounds
        )

        // Skip button in top right
        Surface(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 32.dp, end = 16.dp, bottom = 16.dp, start = 16.dp)
                .clickable {
                    // Track skip event
                    if (splashId != null && splashScreenRepository != null) {
                        val viewTime = ((System.currentTimeMillis() - startTime) / 1000).toInt()

                        scope.launch {
                            // Track skip event
                            splashScreenRepository.trackEvent(
                                splashId = splashId,
                                eventType = "skip",
                                deviceId = deviceId,
                                viewTimeSeconds = viewTime
                            )

                            // End session
                            sessionId?.let {
                                splashScreenRepository.endSession(
                                    sessionId = it,
                                    wasSkipped = true,
                                    wasClicked = false,
                                    viewTimeSeconds = viewTime
                                )
                            }

                            Log.d("LaunchModalScreen", "Tracked skip event for splash $splashId")
                        }
                    }

                    onDismiss()
                },
            color = Color.White.copy(alpha = 0.9f),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(50),
            shadowElevation = 4.dp
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Text(
                    text = "Skip $timeRemaining",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.Black,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                )
            }
        }
    }
}
