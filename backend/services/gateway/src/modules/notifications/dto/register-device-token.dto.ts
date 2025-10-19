import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'Device token for push notifications' })
  @IsString()
  deviceToken: string;

  @ApiProperty({ enum: ['ios', 'android'], description: 'Platform type' })
  @IsEnum(['ios', 'android'])
  platform: 'ios' | 'android';
}
