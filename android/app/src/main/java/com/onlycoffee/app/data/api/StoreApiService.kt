package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.Store
import retrofit2.http.*

interface StoreApiService {
    @GET("stores")
    suspend fun getAllStores(): StoresResponse
    
    @GET("stores/{id}")
    suspend fun getStoreById(@Path("id") storeId: String): StoreResponse
    
    @GET("stores/nearby")
    suspend fun getNearbyStores(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Double = 10.0 // miles
    ): StoresResponse
    
    @GET("stores/search")
    suspend fun searchStores(
        @Query("query") query: String
    ): StoresResponse
}

data class StoresResponse(
    val success: Boolean,
    val data: List<Store>,
    val count: Int
)

data class StoreResponse(
    val success: Boolean,
    val data: Store
)

