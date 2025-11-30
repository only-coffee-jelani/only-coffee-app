package com.onlycoffee.app.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.onlycoffee.app.managers.AuthenticationManager
import com.onlycoffee.app.ui.theme.*
import kotlinx.coroutines.launch

/**
 * Enterprise-level phone authentication dialog
 * Implements secure phone verification flow for guest checkout
 */
@Composable
fun PhoneAuthDialog(
    authenticationManager: AuthenticationManager,
    onDismiss: () -> Unit,
    onAuthSuccess: () -> Unit
) {
    var phoneNumber by remember { mutableStateOf("") }
    var verificationCode by remember { mutableStateOf("") }
    var isCodeSent by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 8.dp
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Title
                Text(
                    text = if (!isCodeSent) "Verify Your Phone" else "Enter Code",
                    style = OnlyCoffeeTextStyles.H2,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Description
                Text(
                    text = if (!isCodeSent) 
                        "We'll send you a verification code to complete your order"
                    else 
                        "Enter the 6-digit code sent to $phoneNumber",
                    style = OnlyCoffeeTextStyles.Body,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(24.dp))

                if (!isCodeSent) {
                    // Phone number input
                    OutlinedTextField(
                        value = phoneNumber,
                        onValueChange = { 
                            phoneNumber = it
                            errorMessage = null
                        },
                        label = { Text("Phone Number") },
                        placeholder = { Text("+1 (555) 123-4567") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        isError = errorMessage != null
                    )
                } else {
                    // Verification code input
                    OutlinedTextField(
                        value = verificationCode,
                        onValueChange = { 
                            if (it.length <= 6) {
                                verificationCode = it
                                errorMessage = null
                            }
                        },
                        label = { Text("Verification Code") },
                        placeholder = { Text("123456") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        isError = errorMessage != null
                    )
                }

                // Error message
                if (errorMessage != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = errorMessage!!,
                        style = OnlyCoffeeTextStyles.Caption,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Action button
                Button(
                    onClick = {
                        scope.launch {
                            isLoading = true
                            errorMessage = null

                            if (!isCodeSent) {
                                // Format phone number to E.164 format
                                val formattedPhone = formatPhoneNumber(phoneNumber)

                                // Send verification code
                                val success = authenticationManager.sendVerificationCode(formattedPhone)
                                if (success) {
                                    isCodeSent = true
                                } else {
                                    errorMessage = authenticationManager.errorMessage.value
                                        ?: "Failed to send code. Please check your phone number."
                                }
                            } else {
                                // Format phone number to E.164 format
                                val formattedPhone = formatPhoneNumber(phoneNumber)

                                // Verify code
                                val success = authenticationManager.verifyPhone(formattedPhone, verificationCode)
                                if (success) {
                                    onAuthSuccess()
                                } else {
                                    errorMessage = authenticationManager.errorMessage.value
                                        ?: "Invalid code. Please try again."
                                }
                            }

                            isLoading = false
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    enabled = !isLoading && (
                        (!isCodeSent && phoneNumber.isNotBlank()) ||
                        (isCodeSent && verificationCode.length == 6)
                    ),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                    shape = RoundedCornerShape(28.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text(
                            text = if (!isCodeSent) "Send Code" else "Verify & Continue",
                            style = OnlyCoffeeTextStyles.ButtonText
                        )
                    }
                }

                // Resend code button (only shown after code is sent)
                if (isCodeSent) {
                    Spacer(modifier = Modifier.height(16.dp))
                    TextButton(
                        onClick = {
                            scope.launch {
                                isLoading = true
                                errorMessage = null
                                // Format phone number to E.164 format
                                val formattedPhone = formatPhoneNumber(phoneNumber)
                                val success = authenticationManager.sendVerificationCode(formattedPhone)
                                if (!success) {
                                    errorMessage = "Failed to resend code"
                                }
                                isLoading = false
                            }
                        },
                        enabled = !isLoading
                    ) {
                        Text(
                            text = "Resend Code",
                            style = OnlyCoffeeTextStyles.ButtonText,
                            color = BrandPrimary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Cancel button
                TextButton(
                    onClick = onDismiss,
                    enabled = !isLoading
                ) {
                    Text(
                        text = "Cancel",
                        style = OnlyCoffeeTextStyles.ButtonText,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

/**
 * Format phone number to E.164 format
 * Enterprise-level: Handles various input formats and converts to international standard
 *
 * Examples:
 * - "5047770440" -> "+15047770440"
 * - "+1 (504) 777-0440" -> "+15047770440"
 * - "504-777-0440" -> "+15047770440"
 * - "+15047770440" -> "+15047770440" (already formatted)
 */
private fun formatPhoneNumber(phone: String): String {
    // Remove all non-digit characters except leading +
    val digitsOnly = phone.replace(Regex("[^0-9+]"), "")

    // If already starts with +, return as is
    if (digitsOnly.startsWith("+")) {
        return digitsOnly
    }

    // If starts with 1 and has 11 digits, add +
    if (digitsOnly.startsWith("1") && digitsOnly.length == 11) {
        return "+$digitsOnly"
    }

    // If 10 digits, assume US number and add +1
    if (digitsOnly.length == 10) {
        return "+1$digitsOnly"
    }

    // Otherwise, assume US and add +1
    return "+1$digitsOnly"
}
