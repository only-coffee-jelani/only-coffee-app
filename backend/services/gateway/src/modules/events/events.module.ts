import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEvent } from '@shared/database/entities';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { WeatherModule } from '../weather/weather.module';
import { StreamingModule } from '../streaming/streaming.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEvent]), WeatherModule, StreamingModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
