import { ApiProperty } from '@nestjs/swagger';

export class CarouselAnalyticsDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Carousel image ID',
  })
  id: string;

  @ApiProperty({
    example: 'Summer Promotion',
    description: 'Title of the carousel image',
  })
  title: string;

  @ApiProperty({
    example: 1500,
    description: 'Total number of times this image was viewed',
  })
  viewCount: number;

  @ApiProperty({
    example: 150,
    description: 'Total number of times this image was clicked',
  })
  clickCount: number;

  @ApiProperty({
    example: 45,
    description: 'Total number of conversions from this image',
  })
  conversionCount: number;

  @ApiProperty({
    example: 10,
    description: 'Click-through rate percentage',
  })
  clickThroughRate: number;

  @ApiProperty({
    example: 3,
    description: 'Conversion rate percentage',
  })
  conversionRate: number;

  @ApiProperty({
    example: '2024-06-01T00:00:00Z',
    description: 'When this image was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-06-15T10:30:00Z',
    description: 'Last time this image was viewed',
  })
  lastViewedAt: Date | null;

  @ApiProperty({
    example: '2024-06-15T10:25:00Z',
    description: 'Last time this image was clicked',
  })
  lastClickedAt: Date | null;

  @ApiProperty({
    example: true,
    description: 'Whether this image is currently active',
  })
  isActive: boolean;
}

