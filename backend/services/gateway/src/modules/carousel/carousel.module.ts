import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarouselItem, Carousel } from '@shared/database/entities';
import { CarouselService } from './carousel.service';
import { CarouselController } from './carousel.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([CarouselItem, Carousel]), UploadModule],
  controllers: [CarouselController],
  providers: [CarouselService],
  exports: [CarouselService],
})
export class CarouselModule {}

