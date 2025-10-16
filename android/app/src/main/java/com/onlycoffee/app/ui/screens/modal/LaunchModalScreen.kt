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
import coil.compose.AsyncImage
import com.onlycoffee.app.data.model.Promotion
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun LaunchModalScreen(
    promotion: Promotion,
    onDismiss: () -> Unit,
    onNavigateToMenuItem: (String) -> Unit,
    navController: NavController
) {
    var timeRemaining by remember { mutableStateOf(3) }
    val scope = rememberCoroutineScope()

    // Countdown timer: Wait 1 second, then count down from 3 to 0
    LaunchedEffect(Unit) {
        delay(1000) // Show "Skip 3" for 1 second
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
            .background(Color.Black.copy(alpha = 0.9f))
            .clickable {
                // Navigate to menu item if targetMenuItemId exists
                promotion.targetMenuItemId?.let { menuItemId ->
                    onNavigateToMenuItem(menuItemId)
                    onDismiss()
                }
            }
    ) {
        // Full-screen promotional image
        AsyncImage(
            model = promotion.imageUrl,
            contentDescription = promotion.title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // Skip button in top right
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.TopEnd)
        ) {
            Surface(
                modifier = Modifier
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
}
