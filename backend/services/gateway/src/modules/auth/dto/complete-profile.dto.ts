import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address (optional)',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name (optional)',
    required: false
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name (optional)',
    required: false
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsOptional()
  lastName?: string;
}
