import { IsString, IsOptional, IsNumber, IsBoolean, IsUrl, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarouselImageDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Carousel ID this item belongs to',
  })
  @IsUUID()
  carouselId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Image asset ID from media_assets table',
  })
  @IsUUID()
  imageAssetId: string;

  @ApiProperty({
    example: 'Summer Promotion',
    description: 'Title of the carousel image',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Get 20% off all summer drinks',
    description: 'Subtitle of the carousel image',
    required: false,
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({
    example: '/menu/summer-drinks',
    description: 'Deep link URL for navigation',
    required: false,
  })
  @IsOptional()
  @IsString()
  deeplink?: string;

  @ApiProperty({
    example: 0,
    description: 'Sort order for display',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  sortOrder: number;

  @ApiProperty({
    example: true,
    description: 'Whether this carousel item is active. Defaults to true.',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: '2024-06-01T00:00:00Z',
    description: 'When to start showing this image',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiProperty({
    example: '2024-08-31T23:59:59Z',
    description: 'When to stop showing this image',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

