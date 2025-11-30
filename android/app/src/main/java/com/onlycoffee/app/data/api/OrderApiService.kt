package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.*
import retrofit2.http.*

interface OrderApiService {
    @GET("orders/my-orders")
    suspend fun getMyOrders(): OrdersListResponse
    
    @GET("orders/{id}")
    suspend fun getOrderById(@Path("id") orderId: String): OrderResponse
    
    @POST("orders")
    suspend fun createOrder(@Body request: CreateOrderRequest): CreateOrderResponse
    
    @PATCH("orders/{id}/cancel")
    suspend fun cancelOrder(@Path("id") orderId: String): OrderResponse
    
    @POST("orders/{id}/reorder")
    suspend fun reorder(@Path("id") orderId: String): OrderResponse
}

