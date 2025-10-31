import { Module } from '@nestjs/common';
import { KinesisService } from './kinesis.service';

@Module({
  providers: [KinesisService],
  exports: [KinesisService],
})
export class StreamingModule {}
