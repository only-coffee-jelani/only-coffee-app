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
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';

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
      useFactory: () => getDatabaseConfig(),
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
    PromoCodesModule,
    CouponsModule,
    NotificationsModule,
    TasksModule,
    AnalyticsModule,
    LoyaltyModule,
  ],
})
export class AppModule {}
