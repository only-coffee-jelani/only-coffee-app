import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard } from '@shared/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([GiftCard])],
  // TODO: Add controllers and services for gift cards
})
export class GiftsModule {}
