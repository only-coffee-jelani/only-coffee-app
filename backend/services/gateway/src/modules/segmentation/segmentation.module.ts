import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSegment, User } from '@shared/database/entities';
import { SegmentationService } from './segmentation.service';
import { SegmentationController } from './segmentation.controller';
import { FeatureStoreModule } from '../features/feature-store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSegment, User]),
    FeatureStoreModule,
  ],
  controllers: [SegmentationController],
  providers: [SegmentationService],
  exports: [SegmentationService],
})
export class SegmentationModule {}
