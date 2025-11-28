import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { getDatabaseConfig } from '@shared/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { GiftsModule } from './modules/gifts/gifts.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { AdminModule } from './modules/admin/admin.module';
import { SplashScreenModule } from './modules/splash-screen/splash-screen.module';
import { CarouselModule } from './modules/carousel/carousel.module';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
// Note: LoyaltyModule disabled - depends on entities that don't exist in new schema
// import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { EventsModule } from './modules/events/events.module';
import { WeatherModule } from './modules/weather/weather.module';
import { FeatureStoreModule } from './modules/features/feature-store.module';
import { SegmentationModule } from './modules/segmentation/segmentation.module';
import { ChurnPredictionModule } from './modules/churn/churn-prediction.module';
import { RecommendationModule } from './modules/recommendations/recommendation.module';
import { ContextualBanditModule } from './modules/bandit/contextual-bandit.module';
import { TriggerEngineModule } from './modules/triggers/trigger-engine.module';
import { AIPromotionGeneratorModule } from './modules/ai-promotions/ai-promotion-generator.module';
import { NotificationDecisionModule } from './modules/notification-decision/notification-decision.module';
import { PushNotificationModule } from './modules/push-notifications/push-notification.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { PersonalizedOffersModule } from './modules/personalized-offers/personalized-offers.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    StoresModule,
    MenuModule,
    OrdersModule,
    PaymentsModule,
    RewardsModule,
    GiftsModule,
    ReviewsModule,
    UploadModule,
    PromotionsModule,
    AdminModule,
    SplashScreenModule,
    CarouselModule,
    PromoCodesModule,
    CouponsModule,
    NotificationsModule,
    TasksModule,
    AnalyticsModule,
    // LoyaltyModule, // Disabled - depends on entities that don't exist in new schema
    EventsModule,
    WeatherModule,
    FeatureStoreModule,
    SegmentationModule,
    ChurnPredictionModule,
    RecommendationModule,
    ContextualBanditModule,
    TriggerEngineModule,
    AIPromotionGeneratorModule,
    NotificationDecisionModule,
    PushNotificationModule,
    PrivacyModule,
    MonitoringModule,
    PersonalizedOffersModule,
  ],
})
export class AppModule {}
