import { IsString, IsPhoneNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendCodeDto {
  @ApiProperty({
    example: '+12025551234',
    description: 'Phone number in E.164 format (include country code)'
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: false,
    description: 'User consent to receive marketing messages',
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  marketingOptIn?: boolean;
}
