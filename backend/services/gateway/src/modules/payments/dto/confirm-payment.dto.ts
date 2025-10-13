import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Payment intent ID to confirm',
    example: 'pi_1234567890abcdef',
  })
  @IsString()
  paymentIntentId: string;

  @ApiProperty({
    description: 'Payment method ID (if not already attached)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
