import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEvent,
  UserProfile,
  Order,
  User,
  Store,
} from '@shared/database/entities';
import { FeatureStoreService } from './feature-store.service';
import { FeatureStoreController } from './feature-store.controller';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEvent, UserProfile, Order, User, Store]),
    WeatherModule,
  ],
  controllers: [FeatureStoreController],
  providers: [FeatureStoreService],
  exports: [FeatureStoreService],
})
export class FeatureStoreModule {}
