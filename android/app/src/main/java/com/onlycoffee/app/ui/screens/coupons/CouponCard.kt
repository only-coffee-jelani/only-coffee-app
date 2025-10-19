package com.onlycoffee.app.ui.screens.coupons

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.onlycoffee.app.data.model.Coupon
import com.onlycoffee.app.data.model.CouponStatus
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun CouponCard(
    coupon: Coupon,
    modifier: Modifier = Modifier
) {
    var showDetails by remember { mutableStateOf(false) }
    var showQRCode by remember { mutableStateOf(false) }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .alpha(if (coupon.isExpired) 0.6f else 1.0f),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 4.dp
        ),
        onClick = { showDetails = true }
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header with value badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.Top
            ) {
                // Value Badge
                Surface(
                    color = when {
                        coupon.isExpired -> Color.Gray
                        coupon.isExpiringSoon -> Color(0xFFFF9800)
                        else -> Color(0xFFE91E63)
                    },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = coupon.displayValue,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                // Label and Description
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = coupon.label,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (coupon.isExpired) {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )

                    coupon.description?.let { desc ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = desc,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            maxLines = 2
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Expiry and Channel Info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Expiry
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (coupon.isExpiringSoon) {
                            Icons.Default.Warning
                        } else {
                            Icons.Default.Schedule
                        },
                        contentDescription = null,
                        tint = if (coupon.isExpiringSoon) {
                            Color(0xFFFF9800)
                        } else {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        },
                        modifier = Modifier.size(16.dp)
                    )

                    Text(
                        text = coupon.expiryText,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = if (coupon.isExpiringSoon) FontWeight.SemiBold else FontWeight.Normal,
                        color = if (coupon.isExpiringSoon) {
                            Color(0xFFFF9800)
                        } else {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        }
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                // Channel Badge
                Surface(
                    color = Color(0xFF4CAF50).copy(alpha = 0.8f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (coupon.channels == "app_only") {
                                Icons.Default.PhoneAndroid
                            } else {
                                Icons.Default.ShoppingBag
                            },
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(12.dp)
                        )

                        Text(
                            text = coupon.channelText,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium,
                            color = Color.White
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Buttons
            when {
                coupon.isActive -> {
                    when (coupon.channels) {
                        "in_store", "store_only" -> {
                            // In-store only - show QR code button
                            Button(
                                onClick = { showQRCode = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF4CAF50)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.QrCode,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Show QR Code for In-Store",
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                        "app_only" -> {
                            // App only - show use in app button
                            Button(
                                onClick = { /* TODO: Navigate to menu with coupon pre-selected */ },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFFE91E63)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = "Use in App",
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                        else -> {
                            // Both channels - show two buttons
                            Column(
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = { showQRCode = true },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF4CAF50)
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.QrCode,
                                        contentDescription = null,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Show QR Code for In-Store",
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }

                                OutlinedButton(
                                    onClick = { /* TODO: Navigate to menu with coupon pre-selected */ },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        contentColor = Color(0xFFE91E63)
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = "Use in App",
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                    }
                }

                coupon.status == CouponStatus.REDEEMED -> {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = Color(0xFF4CAF50).copy(alpha = 0.1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Color(0xFF4CAF50)
                            )

                            Text(
                                text = "Redeemed",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = Color(0xFF4CAF50)
                            )

                            coupon.redeemedAt?.let { date ->
                                Text(
                                    text = "• ${formatDate(date)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Coupon Detail Dialog
    if (showDetails) {
        CouponDetailDialog(
            coupon = coupon,
            onDismiss = { showDetails = false }
        )
    }

    // QR Code Screen
    if (showQRCode) {
        CouponQRCodeScreen(
            coupon = coupon,
            onDismiss = { showQRCode = false }
        )
    }
}

@Composable
fun CouponDetailDialog(
    coupon: Coupon,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Coupon Details")
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Value Display
                Surface(
                    color = Color(0xFFE91E63).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = coupon.displayValue,
                            style = MaterialTheme.typography.displayMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFE91E63)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = coupon.label,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        coupon.description?.let { desc ->
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = desc,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }

                // Details
                DetailRow(
                    icon = Icons.Default.Schedule,
                    label = "Expires",
                    value = coupon.formattedExpiryDate
                )

                DetailRow(
                    icon = Icons.Default.ShoppingBag,
                    label = "Redeem",
                    value = coupon.channelText
                )

                coupon.eligibleItems?.let { eligibleItems ->
                    eligibleItems.exclude?.takeIf { it.isNotEmpty() }?.let { excludeList ->
                        DetailRow(
                            icon = Icons.Default.Close,
                            label = "Excludes",
                            value = excludeList.joinToString(", ").capitalize(Locale.getDefault())
                        )
                    }

                    eligibleItems.include?.takeIf { it.isNotEmpty() }?.let { includeList ->
                        DetailRow(
                            icon = Icons.Default.Check,
                            label = "Includes",
                            value = includeList.joinToString(", ").capitalize(Locale.getDefault())
                        )
                    }
                }

                DetailRow(
                    icon = Icons.Default.Label,
                    label = "Source",
                    value = formatSource(coupon.source)
                )
            }
        },
        confirmButton = {
            if (coupon.isActive) {
                TextButton(
                    onClick = {
                        // TODO: Navigate to menu with coupon pre-selected
                        onDismiss()
                    }
                ) {
                    Text("Use This Coupon")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
fun DetailRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Color(0xFFE91E63),
            modifier = Modifier.size(24.dp)
        )

        Column(
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

private fun formatDate(date: Date): String {
    val format = SimpleDateFormat("MMM d", Locale.getDefault())
    return format.format(date)
}

private fun formatSource(source: String): String {
    return source.replace("_", " ")
        .split(" ")
        .joinToString(" ") { it.capitalize(Locale.getDefault()) }
}
