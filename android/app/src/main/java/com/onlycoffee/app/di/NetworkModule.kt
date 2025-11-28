package com.onlycoffee.app.di

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.onlycoffee.app.BuildConfig
import com.onlycoffee.app.data.api.AuthApiService
import com.onlycoffee.app.data.api.CarouselApiService
import com.onlycoffee.app.data.api.CarouselAnalyticsApiService
import com.onlycoffee.app.data.api.CouponsApiService
import com.onlycoffee.app.data.api.LoyaltyApiService
import com.onlycoffee.app.data.api.MenuApiService
import com.onlycoffee.app.data.api.OffersApiService
import com.onlycoffee.app.data.api.OrderApiService
import com.onlycoffee.app.data.api.SplashScreenApi
import com.onlycoffee.app.data.api.StoreApiService
import com.onlycoffee.app.managers.SecureStorageManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create()
    }

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        loggingInterceptor: HttpLoggingInterceptor,
        secureStorage: SecureStorageManager
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                val original = chain.request()
                val token = secureStorage.getAccessToken()
                val request = original.newBuilder()
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .apply {
                        if (token != null) {
                            header("Authorization", "Bearer $token")
                        }
                    }
                    .method(original.method, original.body)
                    .build()
                chain.proceed(request)
            }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    @Provides
    @Singleton
    fun provideCouponsApiService(retrofit: Retrofit): CouponsApiService {
        return retrofit.create(CouponsApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideLoyaltyApiService(retrofit: Retrofit): LoyaltyApiService {
        return retrofit.create(LoyaltyApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideAuthApiService(retrofit: Retrofit): AuthApiService {
        return retrofit.create(AuthApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideOrderApiService(retrofit: Retrofit): OrderApiService {
        return retrofit.create(OrderApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideMenuApiService(retrofit: Retrofit): MenuApiService {
        return retrofit.create(MenuApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideStoreApiService(retrofit: Retrofit): StoreApiService {
        return retrofit.create(StoreApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideOffersApiService(retrofit: Retrofit): OffersApiService {
        return retrofit.create(OffersApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideSplashScreenApi(retrofit: Retrofit): SplashScreenApi {
        return retrofit.create(SplashScreenApi::class.java)
    }

    @Provides
    @Singleton
    fun provideCarouselApiService(retrofit: Retrofit): CarouselApiService {
        return retrofit.create(CarouselApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideCarouselAnalyticsApiService(retrofit: Retrofit): CarouselAnalyticsApiService {
        return retrofit.create(CarouselAnalyticsApiService::class.java)
    }
}