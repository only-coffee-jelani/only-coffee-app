import { IsEnum, IsOptional, IsString, IsUUID, IsObject, IsNumber } from 'class-validator';
import { EventType } from '@shared/database/entities';

export class TrackEventDto {
  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsUUID()
  storeId?: string;
}
