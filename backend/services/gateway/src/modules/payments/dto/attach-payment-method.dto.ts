import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachPaymentMethodDto {
  @ApiProperty({
    description: 'Payment method ID to attach',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  paymentMethodId: string;
}
