import { IsEnum, IsString, IsNumber, IsOptional, Min, Max, IsEmail, IsPhoneNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GiftCardType } from '@shared/database/entities';

export class CreateGiftCardDto {
  @ApiProperty({
    enum: GiftCardType,
    description: 'Type of gift card',
    example: GiftCardType.AMOUNT,
  })
  @IsEnum(GiftCardType)
  type: GiftCardType;

  @ApiPropertyOptional({
    description: 'Amount for gift card (required for AMOUNT type)',
    example: 25.00,
    minimum: 5,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(500)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Max redeem value for free coffee voucher (required for FREE_COFFEE type)',
    example: 6.00,
    minimum: 3,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(20)
  maxRedeemValue?: number;

  @ApiPropertyOptional({
    description: 'Recipient email address',
    example: 'recipient@example.com',
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({
    description: 'Recipient phone number',
    example: '+15551234567',
  })
  @IsOptional()
  @IsPhoneNumber()
  recipientPhone?: string;

  @ApiPropertyOptional({
    description: 'Personal message to recipient',
    example: 'Enjoy your coffee on me!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
