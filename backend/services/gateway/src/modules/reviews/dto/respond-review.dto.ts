import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondReviewDto {
  @ApiProperty({
    description: 'Response text from business',
    example: 'Thank you for your feedback! We appreciate your visit.',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  responseText: string;
}
