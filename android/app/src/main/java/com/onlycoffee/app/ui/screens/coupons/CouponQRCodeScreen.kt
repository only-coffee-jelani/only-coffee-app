package com.onlycoffee.app.ui.screens.coupons

import android.app.Activity
import android.content.Context
import android.provider.Settings
import android.view.WindowManager
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.onlycoffee.app.data.model.Coupon
import com.onlycoffee.app.ui.theme.*
import com.onlycoffee.app.utils.QRCodeGenerator

@Composable
fun CouponQRCodeScreen(
    coupon: Coupon,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity

    // Save original brightness and set to max
    DisposableEffect(Unit) {
        val originalBrightness = try {
            Settings.System.getFloat(
                context.contentResolver,
                Settings.System.SCREEN_BRIGHTNESS
            ) / 255f
        } catch (e: Exception) {
            -1f // System default
        }

        // Set brightness to maximum
        activity?.window?.attributes = activity?.window?.attributes?.apply {
            screenBrightness = 1.0f // Maximum brightness
        }

        onDispose {
            // Restore original brightness
            activity?.window?.attributes = activity?.window?.attributes?.apply {
                screenBrightness = if (originalBrightness >= 0) originalBrightness else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
            }
        }
    }

    // Generate QR code
    val qrCodeBitmap = remember(coupon.id) {
        QRCodeGenerator.generateCouponQRCode(coupon, size = 512)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Black,
                    navigationIconContentColor = Color.White
                )
            )
        },
        containerColor = Color.Black
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Coupon info card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        coupon.displayValue,
                        style = OnlyCoffeeTextStyles.H1,
                        color = BrandPrimary,
                        textAlign = TextAlign.Center
                    )

                    Text(
                        coupon.label,
                        style = OnlyCoffeeTextStyles.Body,
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 8.dp)
                    )

                    if (coupon.description != null) {
                        Text(
                            coupon.description,
                            style = OnlyCoffeeTextStyles.Caption,
                            color = TextTertiary,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    Divider(modifier = Modifier.padding(vertical = 16.dp))

                    // QR Code
                    qrCodeBitmap?.let { bitmap ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(1f),
                            colors = CardDefaults.cardColors(containerColor = Color.White)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    bitmap = bitmap.asImageBitmap(),
                                    contentDescription = "QR Code",
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                    } ?: run {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(1f)
                                .background(BackgroundSecondary, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Failed to generate QR code",
                                style = OnlyCoffeeTextStyles.Body,
                                color = TextSecondary
                            )
                        }
                    }

                    Divider(modifier = Modifier.padding(vertical = 16.dp))

                    // Instructions
                    Text(
                        "Show this QR code at checkout",
                        style = OnlyCoffeeTextStyles.Body.copy(fontWeight = FontWeight.Bold),
                        textAlign = TextAlign.Center
                    )

                    Text(
                        "Valid until ${coupon.formattedExpiryDate}",
                        style = OnlyCoffeeTextStyles.Caption,
                        color = if (coupon.isExpiringSoon) WarningDark else TextTertiary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 8.dp)
                    )

                    // Channel badge
                    Surface(
                        modifier = Modifier.padding(top = 12.dp),
                        color = when (coupon.channels) {
                            "in_store", "store_only" -> SuccessLight
                            "app_only" -> InfoLight
                            else -> BackgroundSecondary
                        },
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            coupon.channelText,
                            style = OnlyCoffeeTextStyles.Caption.copy(fontWeight = FontWeight.Bold),
                            color = when (coupon.channels) {
                                "in_store", "store_only" -> SuccessDark
                                "app_only" -> InfoDark
                                else -> TextSecondary
                            },
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Bottom instructions
            Text(
                "Brightness has been increased for better scanning",
                style = OnlyCoffeeTextStyles.Caption,
                color = Color.White.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 24.dp)
            )
        }
    }
}
