import { IsString, IsPhoneNumber, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({
    example: '+12025551234',
    description: 'Phone number in E.164 format (include country code)'
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit verification code sent via SMS'
  })
  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Code must contain only digits' })
  code: string;
}
