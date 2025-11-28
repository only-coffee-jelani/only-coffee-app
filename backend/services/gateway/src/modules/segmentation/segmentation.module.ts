import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSegment, User } from '@shared/database/entities';
import { UserSegmentAssignment } from '@shared/database/entities/user-segment-assignment.entity';
import { SegmentationService } from './segmentation.service';
import { SegmentationController } from './segmentation.controller';
import { FeatureStoreModule } from '../features/feature-store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSegment, UserSegmentAssignment, User]),
    FeatureStoreModule,
  ],
  controllers: [SegmentationController],
  providers: [SegmentationService],
  exports: [SegmentationService],
})
export class SegmentationModule {}
