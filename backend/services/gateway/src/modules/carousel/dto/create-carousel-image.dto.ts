import { IsString, IsOptional, IsNumber, IsBoolean, IsUrl, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarouselImageDto {
  @ApiProperty({
    example: 'Summer Promotion',
    description: 'Title of the carousel image',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Get 20% off all summer drinks',
    description: 'Description of the carousel image',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'https://only-coffee-assets.s3.us-east-1.amazonaws.com/carousel/summer.webp',
    description: 'URL of the carousel image',
  })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    example: 1024000,
    description: 'Size of the image in bytes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  imageSizeBytes?: number;

  @ApiProperty({
    example: 1920,
    description: 'Width of the image in pixels',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  imageWidth?: number;

  @ApiProperty({
    example: 1080,
    description: 'Height of the image in pixels',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  imageHeight?: number;

  @ApiProperty({
    example: 0,
    description: 'Display position (0-4, max 5 images)',
    minimum: 0,
    maximum: 4,
  })
  @IsNumber()
  @Min(0)
  @Max(4)
  position: number;

  @ApiProperty({
    example: true,
    description: 'Whether this image is active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'uuid-of-menu-item',
    description: 'Optional link to a menu item',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetMenuItemId?: string;

  @ApiProperty({
    example: '2024-06-01T00:00:00Z',
    description: 'When to start showing this image',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2024-08-31T23:59:59Z',
    description: 'When to stop showing this image',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: 3,
    description: 'Display duration in seconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  displayDuration?: number;

  @ApiProperty({
    example: 'Summer campaign for new drinks',
    description: 'Internal notes about this carousel image',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

