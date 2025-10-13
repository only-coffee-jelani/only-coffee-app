import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '@shared/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Review])],
  // TODO: Add controllers and services for reviews
})
export class ReviewsModule {}
