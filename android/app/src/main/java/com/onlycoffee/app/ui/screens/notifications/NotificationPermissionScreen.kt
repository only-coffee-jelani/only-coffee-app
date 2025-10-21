package com.onlycoffee.app.ui.screens.notifications

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.R
import com.onlycoffee.app.managers.PushNotificationManager
import com.onlycoffee.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun NotificationPermissionScreen(
    navController: NavController,
    pushNotificationManager: PushNotificationManager,
    onPermissionGranted: () -> Unit = {}
) {
    val scope = rememberCoroutineScope()
    val permissionGranted by pushNotificationManager.permissionGranted.collectAsState()

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        pushNotificationManager.checkPermissionStatus()
        if (isGranted) {
            scope.launch {
                pushNotificationManager.requestToken()
                onPermissionGranted()
            }
        }
    }

    LaunchedEffect(permissionGranted) {
        if (permissionGranted) {
            pushNotificationManager.requestToken()
        }
    }

    Scaffold(
        containerColor = BackgroundPrimary
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Spacer(modifier = Modifier.height(32.dp))

            // Icon
            Surface(
                modifier = Modifier.size(120.dp),
                shape = RoundedCornerShape(60.dp),
                color = BrandPrimary.copy(alpha = 0.1f)
            ) {
                Box(
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = BrandPrimary
                    )
                }
            }

            // Title
            Text(
                "Stay in the Loop",
                style = OnlyCoffeeTextStyles.H1,
                color = TextPrimary,
                textAlign = TextAlign.Center
            )

            // Subtitle
            Text(
                "Get notified about exclusive offers, order updates, and more",
                style = OnlyCoffeeTextStyles.Body,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Benefits list
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                BenefitItem(
                    icon = Icons.Default.LocalOffer,
                    title = "Exclusive Coupons",
                    description = "Get notified when new coupons are available"
                )

                BenefitItem(
                    icon = Icons.Default.Timer,
                    title = "Coupon Expiry Reminders",
                    description = "Never miss out on savings with timely reminders"
                )

                BenefitItem(
                    icon = Icons.Default.ShoppingBag,
                    title = "Order Updates",
                    description = "Track your order from preparation to pickup"
                )

                BenefitItem(
                    icon = Icons.Default.Campaign,
                    title = "Special Promotions",
                    description = "Be the first to know about flash sales and events"
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // Enable notifications button
            if (!permissionGranted) {
                Button(
                    onClick = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        } else {
                            // Permission not needed for older versions
                            scope.launch {
                                pushNotificationManager.requestToken()
                                onPermissionGranted()
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandPrimary
                    ),
                    shape = RoundedCornerShape(28.dp)
                ) {
                    Text(
                        "Enable Notifications",
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                }

                TextButton(
                    onClick = { navController.popBackStack() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "Maybe Later",
                        style = OnlyCoffeeTextStyles.Body,
                        color = TextSecondary
                    )
                }
            } else {
                // Already granted
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = SuccessLight
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = SuccessDark,
                            modifier = Modifier.size(24.dp)
                        )

                        Text(
                            "Notifications are enabled!",
                            style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                            color = SuccessDark
                        )
                    }
                }

                Button(
                    onClick = { navController.popBackStack() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandPrimary
                    ),
                    shape = RoundedCornerShape(28.dp)
                ) {
                    Text(
                        "Continue",
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun BenefitItem(
    icon: ImageVector,
    title: String,
    description: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Surface(
            modifier = Modifier.size(48.dp),
            shape = RoundedCornerShape(24.dp),
            color = BrandPrimary.copy(alpha = 0.1f)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = BrandPrimary,
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                title,
                style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                color = TextPrimary
            )

            Text(
                description,
                style = OnlyCoffeeTextStyles.Caption,
                color = TextSecondary
            )
        }
    }
}
