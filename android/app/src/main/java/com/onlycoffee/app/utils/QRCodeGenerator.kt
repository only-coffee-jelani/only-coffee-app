package com.onlycoffee.app.utils

import android.graphics.Bitmap
import android.graphics.Color
import com.google.gson.Gson
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.onlycoffee.app.data.model.Coupon
import java.text.SimpleDateFormat
import java.util.*

object QRCodeGenerator {

    /**
     * Generate a QR code bitmap from a coupon
     * @param coupon The coupon to encode
     * @param size The size of the QR code in pixels (default: 512x512)
     * @return Bitmap of the QR code
     */
    fun generateCouponQRCode(coupon: Coupon, size: Int = 512): Bitmap? {
        return try {
            // Create payload with coupon information
            val payload = mapOf(
                "type" to "coupon",
                "couponId" to coupon.id,
                "userId" to (coupon.userId ?: ""),
                "code" to coupon.label,
                "value" to coupon.displayValue,
                "expiresAt" to formatDateISO8601(coupon.expiresAt)
            )

            // Convert payload to JSON string
            val jsonPayload = Gson().toJson(payload)

            // Generate QR code
            generateQRCode(jsonPayload, size)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Generate a QR code bitmap from any string data
     * @param data The string data to encode
     * @param size The size of the QR code in pixels
     * @return Bitmap of the QR code
     */
    fun generateQRCode(data: String, size: Int = 512): Bitmap? {
        return try {
            val writer = QRCodeWriter()
            val hints = mapOf(
                EncodeHintType.MARGIN to 1,
                EncodeHintType.CHARACTER_SET to "UTF-8"
            )

            val bitMatrix = writer.encode(
                data,
                BarcodeFormat.QR_CODE,
                size,
                size,
                hints
            )

            val width = bitMatrix.width
            val height = bitMatrix.height
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)

            for (x in 0 until width) {
                for (y in 0 until height) {
                    bitmap.setPixel(
                        x,
                        y,
                        if (bitMatrix[x, y]) Color.BLACK else Color.WHITE
                    )
                }
            }

            bitmap
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Format date to ISO 8601 string
     */
    private fun formatDateISO8601(date: Date): String {
        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        format.timeZone = TimeZone.getTimeZone("UTC")
        return format.format(date)
    }
}
