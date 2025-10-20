import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarouselImage } from '@shared/database/entities';
import { CarouselService } from './carousel.service';
import { CarouselController } from './carousel.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([CarouselImage]), UploadModule],
  controllers: [CarouselController],
  providers: [CarouselService],
  exports: [CarouselService],
})
export class CarouselModule {}

