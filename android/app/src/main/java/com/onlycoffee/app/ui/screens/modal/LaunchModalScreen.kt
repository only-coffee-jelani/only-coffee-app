package com.onlycoffee.app.ui.screens.modal

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
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.Promotion
import com.onlycoffee.app.data.model.SplashScreen
import com.onlycoffee.app.ui.components.CachedAsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun LaunchModalScreen(
    promotion: Promotion? = null,
    splashScreen: SplashScreen? = null,
    onDismiss: () -> Unit,
    onNavigateToMenuItem: (String) -> Unit,
    navController: NavController
) {
    // Use splash screen if available, otherwise fall back to promotion
    val imageUrl = splashScreen?.imageUrl ?: promotion?.imageUrl ?: ""
    val title = splashScreen?.title ?: promotion?.title ?: ""
    val targetMenuItemId = splashScreen?.targetMenuItemId ?: promotion?.targetMenuItemId
    val displayDuration = splashScreen?.displayDuration ?: promotion?.displayDuration ?: 3

    var timeRemaining by remember { mutableStateOf(displayDuration) }
    val scope = rememberCoroutineScope()

    // Countdown timer: Wait 1 second, then count down from displayDuration to 0
    LaunchedEffect(displayDuration) {
        delay(1000) // Show "Skip X" for 1 second
        while (timeRemaining > 0) {
            delay(1000)
            timeRemaining--
        }
        // Auto-dismiss when counter reaches 0
        onDismiss()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .clickable {
                // Navigate to menu item if targetMenuItemId exists
                targetMenuItemId?.let { menuItemId ->
                    onNavigateToMenuItem(menuItemId)
                    onDismiss()
                }
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
