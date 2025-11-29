package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.PersonalizedOffersResponse
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * API service for personalized offers
 */
interface OffersApiService {
    @GET("offers/personalized")
    suspend fun getPersonalizedOffers(): PersonalizedOffersResponse
    
    @POST("offers/{id}/view")
    suspend fun trackOfferView(@Path("id") offerId: String): ApiResponse<Unit>
    
    @POST("offers/{id}/click")
    suspend fun trackOfferClick(@Path("id") offerId: String): ApiResponse<Unit>
}
